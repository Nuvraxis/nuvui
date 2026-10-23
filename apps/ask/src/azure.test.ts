import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  type ChatEvent,
  createTokenProvider,
  ModelError,
  streamChat,
} from "./azure.ts";

// A streamed answer as Azure sends it, in pieces that don't line up with
// its lines.
function streamed(lines: string[], pieces = 3) {
  const text = `${lines.join("\n")}\n`;
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

const chunk = (value: unknown) => `data: ${JSON.stringify(value)}\n`;

const options = (
  fetch: typeof globalThis.fetch,
  seen: { url?: string; init?: RequestInit } = {},
) => ({
  endpoint: "https://example.openai.azure.com",
  deployment: "gpt-4.1-mini",
  apiVersion: "2024-10-21",
  getToken: async () => "token",
  fetch: async (url: string | URL | Request, init?: RequestInit) => {
    seen.url = String(url);
    seen.init = init;
    return fetch(url, init);
  },
});

async function collect(events: AsyncIterable<ChatEvent>) {
  const all: ChatEvent[] = [];
  for await (const event of events) all.push(event);
  return all;
}

describe("streamChat", () => {
  test("asks the deployment with the token, and gives back the text, then the tokens it took", async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const body = streamed([
      chunk({ choices: [], prompt_filter_results: [] }),
      chunk({ choices: [{ delta: { content: "Use " } }] }),
      chunk({
        choices: [{ delta: { content: "Button." }, finish_reason: "stop" }],
      }),
      chunk({
        choices: [],
        usage: { prompt_tokens: 900, completion_tokens: 40 },
      }),
      "data: [DONE]",
    ]);
    const events = await collect(
      streamChat(
        options(async () => new Response(body), seen),
        [{ role: "user", content: "q" }],
        { maxTokens: 800 },
      ),
    );
    assert.equal(
      seen.url,
      "https://example.openai.azure.com/openai/deployments/gpt-4.1-mini/chat/completions?api-version=2024-10-21",
    );
    assert.equal(
      (seen.init?.headers as Record<string, string> | undefined)?.Authorization,
      "Bearer token",
    );
    const sent = JSON.parse(String(seen.init?.body));
    assert.equal(sent.stream, true);
    assert.equal(sent.max_tokens, 800);
    assert.deepEqual(events, [
      { type: "text", text: "Use " },
      { type: "text", text: "Button." },
      { type: "usage", promptTokens: 900, completionTokens: 40 },
      { type: "end", finishReason: "stop" },
    ]);
  });

  test("offers the tools, and puts together the calls the model sends in pieces", async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const body = streamed(
      [
        chunk({
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: "call-1",
                    function: { name: "search_docs", arguments: '{"que' },
                  },
                ],
              },
            },
          ],
        }),
        chunk({
          choices: [
            {
              delta: {
                tool_calls: [
                  { index: 0, function: { arguments: 'ry":"dark mode"}' } },
                  {
                    index: 1,
                    id: "call-2",
                    function: {
                      name: "get_page",
                      arguments: '{"page":"index"}',
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
        }),
        "data: [DONE]",
      ],
      5,
    );
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "search_docs",
          description: "Searches.",
          parameters: { type: "object" },
        },
      },
    ];
    const events = await collect(
      streamChat(
        options(async () => new Response(body), seen),
        [{ role: "user", content: "q" }],
        { maxTokens: 800, tools, toolChoice: "none" },
      ),
    );
    const sent = JSON.parse(String(seen.init?.body));
    assert.deepEqual(sent.tools, tools);
    assert.equal(sent.tool_choice, "none");
    assert.deepEqual(events, [
      {
        type: "tools",
        calls: [
          {
            id: "call-1",
            type: "function",
            function: {
              name: "search_docs",
              arguments: '{"query":"dark mode"}',
            },
          },
          {
            id: "call-2",
            type: "function",
            function: { name: "get_page", arguments: '{"page":"index"}' },
          },
        ],
      },
      { type: "end", finishReason: "tool_calls" },
    ]);
  });

  test("says so when the filter stops the answer partway", async () => {
    const body = streamed([
      chunk({
        choices: [
          { delta: { content: "Part" }, finish_reason: "content_filter" },
        ],
      }),
      "data: [DONE]",
    ]);
    const events = await collect(
      streamChat(
        options(async () => new Response(body)),
        [],
        { maxTokens: 10 },
      ),
    );
    assert.deepEqual(events.slice(-2), [
      { type: "filtered" },
      { type: "end", finishReason: "content_filter" },
    ]);
  });

  test("a question the filter won't take is a filtered error", async () => {
    const refused = async () =>
      new Response(JSON.stringify({ error: { code: "content_filter" } }), {
        status: 400,
      });
    await assert.rejects(
      collect(streamChat(options(refused), [], { maxTokens: 10 })),
      (error: unknown) =>
        error instanceof ModelError && error.code === "filtered",
    );
  });

  test("Azure's own limit is a busy error, with how long it asked to wait", async () => {
    const limited = async () =>
      new Response(JSON.stringify({ error: { code: "429" } }), {
        status: 429,
        headers: { "Retry-After": "7" },
      });
    await assert.rejects(
      collect(streamChat(options(limited), [], { maxTokens: 10 })),
      (error: unknown) =>
        error instanceof ModelError &&
        error.code === "busy" &&
        error.retryAfter === 7,
    );
  });
});

describe("createTokenProvider", () => {
  test("keeps a token until it has five minutes left", async () => {
    let time = 0;
    let asked = 0;
    const getToken = createTokenProvider(
      {
        async getToken() {
          asked += 1;
          return { token: `t${asked}`, expiresOnTimestamp: 60 * 60_000 };
        },
      },
      () => time,
    );
    assert.equal(await getToken(), "t1");
    time = 50 * 60_000;
    assert.equal(await getToken(), "t1");
    time = 56 * 60_000;
    assert.equal(await getToken(), "t2");
  });
});
