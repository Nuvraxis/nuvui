import type { HttpBindings } from "@hono/node-server";
import { Hono } from "hono";
import { type SSEStreamingApi, streamSSE } from "hono/streaming";
import {
  type ChatEvent,
  type ChatMessage,
  type ChatOptions,
  ModelError,
  type ToolCall,
} from "./azure.ts";
import { callerOf, type createGate, type Verdict } from "./limit.ts";
import type { Logger } from "./log.ts";
import type { Metrics, Outcome } from "./metrics.ts";
import type { Page, Source } from "./pages.ts";
import { messagesFor, type Turn } from "./prompt.ts";
import type { Toolbox } from "./tools.ts";
import { parseTraceparent, type Span, type Tracer } from "./trace.ts";

export interface AppOptions {
  pages: readonly Page[];
  toolbox: Toolbox;
  trustedProxies: number;
  maxQuestionChars: number;
  maxAnswerTokens: number;
  /** How many times the model may ask for tools before it has to answer. */
  maxToolRounds: number;
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
    options: ChatOptions & { signal: AbortSignal },
  ) => AsyncIterable<ChatEvent>;
  tracer: Tracer;
  metrics: Metrics;
  log: Logger;
  now?: () => number;
}

/** What the panel sends. */
interface Question {
  question?: unknown;
  history?: unknown;
  turnstile?: unknown;
}

// The conversation the panel sends with a question: enough for a
// follow-up to make sense, and a bound on what one question can cost.
const maxTurns = 8;
const maxTurnChars = 4000;
const maxHistoryChars = 12_000;

// What one question can cost past that. The model runs at most this many
// tools a round, and once their results come to this many characters it's
// offered no more and has to answer.
const maxCallsPerRound = 4;
const maxToolChars = 48_000;

function historyOf(value: unknown): Turn[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxTurns) return undefined;
  const turns: Turn[] = [];
  let total = 0;
  for (const item of value) {
    if (typeof item !== "object" || item === null) return undefined;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if (role !== "user" && role !== "assistant") return undefined;
    if (typeof text !== "string" || text.length > maxTurnChars)
      return undefined;
    total += text.length;
    turns.push({ role, text });
  }
  return total > maxHistoryChars ? undefined : turns;
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
  const toolNames = new Set(
    options.toolbox.specs.map((spec) => spec.function.name),
  );
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
    const history = historyOf(body.history);
    if (!history) {
      finish("invalid", 400);
      return json(
        400,
        "invalid",
        `The conversation is at most ${maxTurns} turns of ${maxTurnChars} characters, and ${maxHistoryChars} in all.`,
      );
    }
    facts.history_turns = history.length;

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
        outcome = await answer(
          stream,
          messagesFor(history, question),
          controller.signal,
        );
        if (outcome === "answered") {
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

    // The model looks things up with the tools as often as it needs to, up
    // to the rounds it's given, and then answers. Whatever it writes is
    // sent on as it comes, and so is what it's looking up.
    async function answer(
      stream: SSEStreamingApi,
      messages: ChatMessage[],
      signal: AbortSignal,
    ): Promise<Outcome> {
      const sources: Source[] = [];
      let toolCalls = 0;
      let toolChars = 0;
      facts.prompt_tokens = 0;
      facts.completion_tokens = 0;
      for (let round = 0; ; round += 1) {
        facts.rounds = round + 1;
        const last =
          round >= options.maxToolRounds || toolChars >= maxToolChars;
        const reply = await chat(stream, messages, last, signal);
        if (reply.filtered) return "filtered";
        if (reply.calls.length === 0 || last) return "answered";

        // Azure wants a result for every call the assistant's turn names,
        // so the turn names only the ones that are run.
        const calls = reply.calls.slice(0, maxCallsPerRound);
        messages.push({
          role: "assistant",
          content: reply.text || null,
          tool_calls: calls,
        });
        for (const call of calls) {
          const { name, arguments: args } = call.function;
          // The name is the model's, and a label or a span's name made from
          // any it wrote would grow without end.
          const known = toolNames.has(name) ? name : "unknown";
          await stream.writeSSE({
            event: "status",
            data: JSON.stringify({
              text: options.toolbox.describe(name, args),
            }),
          });
          const used = options.tracer.startSpan(`execute_tool ${known}`, {
            parent: span,
            attributes: {
              "gen_ai.operation.name": "execute_tool",
              "gen_ai.tool.name": known,
            },
          });
          const result = options.toolbox.run(name, args);
          used.setAttribute("ask.tool.outcome", result.outcome);
          if (result.outcome === "error") used.fail("error");
          used.end();
          options.metrics.tool(known, result.outcome);
          toolCalls += 1;
          toolChars += result.text.length;
          facts.tool_calls = toolCalls;
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: result.text,
          });
          const found = result.source;
          if (found && !sources.some((s) => s.url === found.url)) {
            sources.push(found);
            facts.pages = sources.length;
            await stream.writeSSE({
              event: "sources",
              data: JSON.stringify(sources),
            });
          }
        }
      }
    }

    // One call to the model. On the last round it isn't offered the tools,
    // so it answers with what it has.
    async function chat(
      stream: SSEStreamingApi,
      messages: ChatMessage[],
      last: boolean,
      signal: AbortSignal,
    ) {
      const call: Span = options.tracer.startSpan("chat", {
        kind: "client",
        parent: span,
        attributes: {
          "gen_ai.operation.name": "chat",
          "gen_ai.system": "az.ai.openai",
          "gen_ai.request.model": options.model,
          "gen_ai.request.max_tokens": options.maxAnswerTokens,
        },
      });
      let text = "";
      let calls: ToolCall[] = [];
      let filtered = false;
      try {
        for await (const event of options.chat(messages, {
          maxTokens: options.maxAnswerTokens,
          signal,
          tools: options.toolbox.specs,
          toolChoice: last ? "none" : "auto",
        })) {
          if (event.type === "text") {
            text += event.text;
            await stream.writeSSE({
              event: "text",
              data: JSON.stringify({ text: event.text }),
            });
          } else if (event.type === "tools") {
            calls = event.calls;
          } else if (event.type === "usage") {
            facts.prompt_tokens =
              Number(facts.prompt_tokens ?? 0) + event.promptTokens;
            facts.completion_tokens =
              Number(facts.completion_tokens ?? 0) + event.completionTokens;
            call.setAttribute("gen_ai.usage.input_tokens", event.promptTokens);
            call.setAttribute(
              "gen_ai.usage.output_tokens",
              event.completionTokens,
            );
            options.metrics.tokens(event.promptTokens, event.completionTokens);
          } else if (event.type === "filtered") {
            filtered = true;
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
        return { text, calls, filtered };
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
