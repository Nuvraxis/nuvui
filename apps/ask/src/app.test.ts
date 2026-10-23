import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";
import { describe, test } from "node:test";
import { type AppOptions, createApp } from "./app.ts";
import { type ChatEvent, ModelError } from "./azure.ts";
import { createGate, createLimiter } from "./limit.ts";
import { createLogger } from "./log.ts";
import { createMetrics } from "./metrics.ts";
import type { Page } from "./pages.ts";
import { createTracer } from "./trace.ts";

const pages: Page[] = [
  {
    id: "components/button",
    title: "Button",
    description: "A button.",
    group: "Components",
    package: "@nuvui/react",
    markdown: "## Variants\n\nSolid, outline and ghost.",
    sections: [
      {
        heading: "Variants",
        markdown: "## Variants\n\nSolid, outline and ghost.",
      },
    ],
  },
];

async function* says(...events: ChatEvent[]) {
  for (const event of events) yield event;
}

function setup(overrides: Partial<AppOptions> = {}) {
  const lines: string[] = [];
  const sent: { docs?: string } = {};
  const metrics = createMetrics();
  const app = createApp({
    pages,
    trustedProxies: 0,
    maxQuestionChars: 100,
    maxAnswerTokens: 50,
    timeoutMs: 5000,
    keepAliveMs: 60_000,
    model: "gpt-4.1-mini",
    limit: createLimiter({ perMinute: 10 }),
    gate: createGate(2),
    chat: (messages) => {
      sent.docs = messages[1]?.content;
      return says(
        { type: "text", text: "Use the " },
        { type: "text", text: "variant prop." },
        { type: "usage", promptTokens: 300, completionTokens: 5 },
        { type: "end", finishReason: "stop" },
      );
    },
    tracer: createTracer({ resource: {} }),
    metrics,
    log: createLogger((line) => lines.push(line)),
    ...overrides,
  });
  const incoming = {
    socket: { remoteAddress: "203.0.113.7" },
    headers: {},
  } as unknown as IncomingMessage;
  const ask = (body: unknown) =>
    app.request(
      "/api/ask",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
      { incoming },
    );
  return { app, ask, lines, sent, metrics };
}

/** The events in a server-sent event stream, in order. */
function eventsOf(text: string) {
  return text
    .split("\n\n")
    .filter((block) => block.includes("event:"))
    .map((block) => ({
      event: /^event: (.*)$/m.exec(block)?.[1],
      data: JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? "null"),
    }));
}

describe("POST /api/ask", () => {
  test("streams the pages, the answer as it's written, and the end", async () => {
    const { ask, sent, lines } = setup();
    const response = await ask({ question: "What button variants are there?" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    assert.equal(response.headers.get("x-accel-buffering"), "no");
    assert.deepEqual(eventsOf(await response.text()), [
      {
        event: "sources",
        data: [
          {
            title: "Button",
            url: "https://nuvui.nuvraxis.com/docs/components/button",
          },
        ],
      },
      { event: "text", data: { text: "Use the " } },
      { event: "text", data: { text: "variant prop." } },
      { event: "done", data: {} },
    ]);
    // The model got the docs, and the question between its own tags.
    assert.match(sent.docs ?? "", /Solid, outline and ghost/);
    assert.match(
      sent.docs ?? "",
      /<question>\nWhat button variants are there\?\n<\/question>/,
    );

    // One line for the question, with what it cost and not what it said.
    const entry = JSON.parse(lines.at(-1) ?? "{}");
    assert.equal(entry.msg, "ask");
    assert.equal(entry.outcome, "answered");
    assert.equal(entry.question_length, 31);
    assert.equal(entry.prompt_tokens, 300);
    assert.equal(entry.completion_tokens, 5);
    assert.match(entry.trace_id, /^[0-9a-f]{32}$/);
    assert.ok(!lines.join("").includes("variants are there"));
  });

  test("doesn't ask the model when the docs have nothing on it", async () => {
    let asked = false;
    const { ask } = setup({
      chat: () => {
        asked = true;
        return says();
      },
    });
    const events = eventsOf(
      await (await ask({ question: "quantum espresso" })).text(),
    );
    assert.equal(asked, false);
    assert.deepEqual(events[0], { event: "sources", data: [] });
    assert.match(events[1]?.data.text, /couldn't find anything/);
    assert.equal(events[2]?.event, "done");
  });

  test("turns away a question that's empty, too long, or not JSON", async () => {
    const { ask } = setup();
    assert.equal((await ask({ question: "   " })).status, 400);
    assert.equal((await ask({ question: "x".repeat(101) })).status, 400);
    assert.equal((await ask("not json")).status, 400);
    const body = await (await ask({})).json();
    assert.equal(body.error, "invalid");
  });

  test("says when to try again once a visitor has asked too often", async () => {
    const { ask } = setup({ limit: createLimiter({ perMinute: 1 }) });
    await (await ask({ question: "button" })).text();
    const response = await ask({ question: "button" });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get("retry-after")) > 0);
  });

  test("needs a Turnstile token that passes, once it's turned on", async () => {
    const tokens: string[] = [];
    const { ask } = setup({
      verify: async (token) => {
        tokens.push(token);
        return token === "good";
      },
    });
    assert.equal((await ask({ question: "button" })).status, 403);
    assert.equal(
      (await ask({ question: "button", turnstile: "bad" })).status,
      403,
    );
    const response = await ask({ question: "button", turnstile: "good" });
    assert.equal(response.status, 200);
    await response.text();
    // No token isn't sent to Cloudflare at all.
    assert.deepEqual(tokens, ["bad", "good"]);
  });

  test("turns a question away while as many as it allows are being answered", async () => {
    const gate = createGate(1);
    const taken = gate.enter();
    const { ask } = setup({ gate });
    const response = await ask({ question: "button" });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "10");
    taken?.();
  });

  test("says the answer was filtered, and a model that fails, in the stream", async () => {
    const filtered = setup({
      chat: () => ({
        [Symbol.asyncIterator]: async function* () {
          yield* [];
          throw new ModelError("filtered", "filtered");
        },
      }),
    });
    const events = eventsOf(
      await (await filtered.ask({ question: "button" })).text(),
    );
    assert.deepEqual(events.at(-1), {
      event: "error",
      data: { error: "filtered" },
    });
    assert.equal(JSON.parse(filtered.lines.at(-1) ?? "{}").outcome, "filtered");

    const failing = setup({
      chat: () => ({
        [Symbol.asyncIterator]: async function* () {
          yield* [];
          throw new Error("socket hang up");
        },
      }),
    });
    const failed = eventsOf(
      await (await failing.ask({ question: "button" })).text(),
    );
    assert.deepEqual(failed.at(-1), {
      event: "error",
      data: { error: "failed" },
    });
    // The log says why, for whoever looks into it.
    assert.equal(
      JSON.parse(failing.lines.at(-1) ?? "{}").error,
      "Error: socket hang up",
    );
  });

  test("counts each question by how it ended", async () => {
    const { ask, metrics } = setup();
    await (await ask({ question: "button" })).text();
    await ask({ question: "" });
    const text = metrics.render();
    assert.match(text, /outcome="answered"\} 1/);
    assert.match(text, /outcome="invalid"\} 1/);
    assert.match(text, /^nuvui_ask_in_flight 0$/m);
  });
});

describe("the probes", () => {
  test("answer while the pages are loaded", async () => {
    const { app } = setup();
    assert.equal((await app.request("/healthz")).status, 200);
    assert.equal((await app.request("/readyz")).status, 200);
    const { app: empty } = setup({ pages: [] });
    assert.equal((await empty.request("/readyz")).status, 503);
  });
});
