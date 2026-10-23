import { describe, expect, test } from "vitest";
import { AskError, askQuestion } from "./client";

// A stream of server-sent events, in pieces that don't line up with them.
function streamOf(text: string, pieces = 4) {
  const size = Math.ceil(text.length / pieces);
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let at = 0; at < text.length; at += size) {
        controller.enqueue(encoder.encode(text.slice(at, at + size)));
      }
      controller.close();
    },
  });
}

const sse = (...events: [string, unknown][]) =>
  events
    .map(
      ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    )
    .join("");

const answering = (response: Response, sent: { body?: unknown } = {}) =>
  (async (_url: string | URL | Request, init?: RequestInit) => {
    sent.body = JSON.parse(String(init?.body));
    return response;
  }) as typeof globalThis.fetch;

describe("askQuestion", () => {
  test("sends the question, the conversation and the token, and hands over what's looked up, the pages, then the answer as it comes", async () => {
    const sent: { body?: unknown } = {};
    const sources: unknown[] = [];
    const statuses: string[] = [];
    let text = "";
    const history = [
      { role: "user" as const, text: "Tables?" },
      { role: "assistant" as const, text: "Which part of them?" },
    ];
    await askQuestion({
      endpoint: "/api/ask",
      question: "Sortable tables?",
      history,
      turnstile: "t",
      onSources: (found) => sources.push(found),
      onStatus: (said) => statuses.push(said),
      onText: (piece) => {
        text += piece;
      },
      fetch: answering(
        new Response(
          streamOf(
            `: keep-alive\n\n${sse(
              ["status", { text: 'Searching the docs for "sorting"' }],
              [
                "sources",
                [{ title: "Sorting", url: "https://x/docs/table/sorting" }],
              ],
              ["text", { text: "Turn on " }],
              ["text", { text: "sorting." }],
              ["done", {}],
            )}`,
          ),
        ),
        sent,
      ),
    });
    expect(sent.body).toEqual({
      question: "Sortable tables?",
      history,
      turnstile: "t",
    });
    expect(statuses).toEqual(['Searching the docs for "sorting"']);
    expect(sources).toEqual([
      [{ title: "Sorting", url: "https://x/docs/table/sorting" }],
    ]);
    expect(text).toBe("Turn on sorting.");
  });

  test("a question turned away is an error with its code and how long to wait", async () => {
    const response = new Response(JSON.stringify({ error: "limited" }), {
      status: 429,
      headers: { "Retry-After": "40" },
    });
    await expect(
      askQuestion({
        endpoint: "/api/ask",
        question: "q",
        fetch: answering(response),
      }),
    ).rejects.toMatchObject({ code: "limited", retryAfter: 40 });
  });

  test("an error partway through the stream is an error with its code", async () => {
    const response = new Response(
      streamOf(
        sse(
          ["sources", []],
          ["text", { text: "Part" }],
          ["error", { error: "filtered" }],
        ),
      ),
    );
    let text = "";
    const asking = askQuestion({
      endpoint: "/api/ask",
      question: "q",
      onText: (piece) => {
        text += piece;
      },
      fetch: answering(response),
    });
    await expect(asking).rejects.toBeInstanceOf(AskError);
    await expect(asking).rejects.toMatchObject({ code: "filtered" });
    expect(text).toBe("Part");
  });

  test("a stream that ends without saying it's done is a failure", async () => {
    const response = new Response(
      streamOf(sse(["sources", []], ["text", { text: "Pa" }])),
    );
    await expect(
      askQuestion({
        endpoint: "/api/ask",
        question: "q",
        fetch: answering(response),
      }),
    ).rejects.toMatchObject({ code: "failed" });
  });

  test("a code it doesn't know is a failure, not something to show", async () => {
    const response = new Response(JSON.stringify({ error: "<script>" }), {
      status: 500,
    });
    await expect(
      askQuestion({
        endpoint: "/api/ask",
        question: "q",
        fetch: answering(response),
      }),
    ).rejects.toMatchObject({ code: "failed" });
  });
});
