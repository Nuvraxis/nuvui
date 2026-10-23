import type { HttpBindings } from "@hono/node-server";
import { Hono } from "hono";
import { type SSEStreamingApi, streamSSE } from "hono/streaming";
import { type ChatEvent, type ChatMessage, ModelError } from "./azure.ts";
import { callerOf, type createGate, type Verdict } from "./limit.ts";
import type { Logger } from "./log.ts";
import type { Metrics, Outcome } from "./metrics.ts";
import { contextFor, type Page } from "./pages.ts";
import { messagesFor, noMatch } from "./prompt.ts";
import { parseTraceparent, type Tracer } from "./trace.ts";

export interface AppOptions {
  pages: readonly Page[];
  trustedProxies: number;
  maxQuestionChars: number;
  maxAnswerTokens: number;
  timeoutMs: number;
  keepAliveMs: number;
  /** The deployment's name, for the spans. */
  model: string;
  limit: (caller: string) => Verdict;
  gate: ReturnType<typeof createGate>;
  /** Without one, Turnstile isn't checked. */
  verify?: (
    token: string,
    remoteIp: string,
    signal: AbortSignal,
  ) => Promise<boolean>;
  chat: (
    messages: ChatMessage[],
    options: { maxTokens: number; signal: AbortSignal },
  ) => AsyncIterable<ChatEvent>;
  tracer: Tracer;
  metrics: Metrics;
  log: Logger;
  now?: () => number;
}

/** What the panel sends. */
interface Question {
  question?: unknown;
  turnstile?: unknown;
}

const json = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

export function createApp(options: AppOptions) {
  const now = options.now ?? Date.now;
  const app = new Hono<{ Bindings: HttpBindings }>();

  // For the probes. Neither says anything about Azure: a pod that can't
  // reach it still answers that it can't, which is better than none.
  app.get("/healthz", (c) => c.text("ok\n"));
  app.get("/readyz", (c) =>
    options.pages.length > 0 ? c.text("ok\n") : c.text("no pages\n", 503),
  );

  app.post("/api/ask", async (c) => {
    const started = now();
    const span = options.tracer.startSpan("POST /api/ask", {
      kind: "server",
      parent: parseTraceparent(c.req.header("traceparent")),
      attributes: { "http.request.method": "POST", "http.route": "/api/ask" },
    });
    const facts: Record<string, string | number | undefined> = {};
    let finished = false;
    const finish = (outcome: Outcome, status: number) => {
      if (finished) return;
      finished = true;
      const ms = now() - started;
      span.setAttribute("http.response.status_code", status);
      span.setAttribute("ask.outcome", outcome);
      if (outcome === "failed" || outcome === "timeout") span.fail(outcome);
      span.end();
      options.metrics.question(outcome, ms / 1000);
      options.log.info("ask", {
        outcome,
        status,
        duration_ms: Math.round(ms),
        trace_id: span.traceId,
        span_id: span.spanId,
        ...facts,
      });
    };

    let body: Question;
    try {
      body = (await c.req.json()) as Question;
    } catch {
      finish("invalid", 400);
      return json(400, "invalid", "Send a question as JSON.");
    }
    const question =
      typeof body.question === "string" ? body.question.trim() : "";
    facts.question_length = question.length;
    if (!question || question.length > options.maxQuestionChars) {
      finish("invalid", 400);
      return json(
        400,
        "invalid",
        `A question is 1 to ${options.maxQuestionChars} characters.`,
      );
    }

    const incoming = c.env?.incoming;
    const caller = incoming
      ? callerOf(incoming, options.trustedProxies)
      : "unknown";
    const verdict = options.limit(caller);
    if (!verdict.ok) {
      finish("limited", 429);
      const response = json(
        429,
        "limited",
        `Too many questions. Try again in ${verdict.retryAfter} seconds.`,
      );
      response.headers.set("Retry-After", String(verdict.retryAfter));
      return response;
    }

    if (options.verify) {
      const token = typeof body.turnstile === "string" ? body.turnstile : "";
      const check = options.tracer.startSpan("turnstile.verify", {
        kind: "client",
        parent: span,
      });
      const passed =
        token !== "" &&
        (await options.verify(token, caller, AbortSignal.timeout(5000)));
      check.setAttribute("turnstile.passed", passed);
      check.end();
      if (!passed) {
        finish("denied", 403);
        return json(403, "denied", "The check that you're a person failed.");
      }
    }

    const release = options.gate.enter();
    if (!release) {
      finish("busy", 503);
      const response = json(503, "busy", "Too many questions right now.");
      response.headers.set("Retry-After", "10");
      return response;
    }
    options.metrics.started();

    const searchSpan = options.tracer.startSpan("docs.search", {
      parent: span,
    });
    const { sources, text } = contextFor(options.pages, question);
    searchSpan.setAttribute("docs.pages", sources.length);
    searchSpan.end();
    facts.pages = sources.length;

    // Through the Gateway's nginx, which would otherwise keep the words
    // back until it had a buffer's worth.
    c.header("X-Accel-Buffering", "no");
    return streamSSE(c, async (stream: SSEStreamingApi) => {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort("timeout"),
        options.timeoutMs,
      );
      // Cloudflare closes a response that sends nothing for 100 seconds,
      // and the model can think for a while before its first word.
      const keepAlive = setInterval(
        () => void stream.write(": keep-alive\n\n"),
        options.keepAliveMs,
      );
      stream.onAbort(() => controller.abort("aborted"));

      let outcome: Outcome = "answered";
      try {
        await stream.writeSSE({
          event: "sources",
          data: JSON.stringify(sources),
        });
        if (sources.length === 0) {
          outcome = "no_match";
          await stream.writeSSE({
            event: "text",
            data: JSON.stringify({ text: noMatch }),
          });
        } else {
          outcome = await answer(stream, question, text, controller.signal);
        }
        if (outcome === "answered" || outcome === "no_match") {
          await stream.writeSSE({ event: "done", data: "{}" });
        }
      } catch (error) {
        outcome = controller.signal.aborted
          ? controller.signal.reason === "timeout"
            ? "timeout"
            : "aborted"
          : error instanceof ModelError
            ? error.code === "busy"
              ? "busy"
              : error.code === "filtered"
                ? "filtered"
                : "failed"
            : "failed";
        // What went wrong, from Azure or the credential, for whoever reads
        // the log. It's the error's own words and never the question's.
        if (outcome === "failed") {
          facts.error = (
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : String(error)
          ).slice(0, 300);
        }
        if (!stream.aborted) {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({ error: outcome }),
          });
        }
      } finally {
        clearTimeout(timeout);
        clearInterval(keepAlive);
        release();
        options.metrics.finished();
        finish(outcome, 200);
      }
    });

    async function answer(
      stream: SSEStreamingApi,
      question: string,
      docs: string,
      signal: AbortSignal,
    ): Promise<Outcome> {
      const call = options.tracer.startSpan("chat", {
        kind: "client",
        parent: span,
        attributes: {
          "gen_ai.operation.name": "chat",
          "gen_ai.system": "az.ai.openai",
          "gen_ai.request.model": options.model,
          "gen_ai.request.max_tokens": options.maxAnswerTokens,
        },
      });
      try {
        let outcome: Outcome = "answered";
        for await (const event of options.chat(messagesFor(question, docs), {
          maxTokens: options.maxAnswerTokens,
          signal,
        })) {
          if (event.type === "text") {
            await stream.writeSSE({
              event: "text",
              data: JSON.stringify({ text: event.text }),
            });
          } else if (event.type === "usage") {
            facts.prompt_tokens = event.promptTokens;
            facts.completion_tokens = event.completionTokens;
            call.setAttribute("gen_ai.usage.input_tokens", event.promptTokens);
            call.setAttribute(
              "gen_ai.usage.output_tokens",
              event.completionTokens,
            );
            options.metrics.tokens(event.promptTokens, event.completionTokens);
          } else if (event.type === "filtered") {
            outcome = "filtered";
            await stream.writeSSE({
              event: "error",
              data: JSON.stringify({ error: "filtered" }),
            });
          } else if (event.type === "end" && event.finishReason) {
            call.setAttribute(
              "gen_ai.response.finish_reasons",
              event.finishReason,
            );
          }
        }
        return outcome;
      } catch (error) {
        call.fail(error instanceof Error ? error.name : "error");
        throw error;
      } finally {
        call.end();
      }
    }
  });

  return app;
}
