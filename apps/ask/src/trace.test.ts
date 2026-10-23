import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createTracer, parseTraceparent } from "./trace.ts";

describe("parseTraceparent", () => {
  test("reads the trace and the parent from a W3C header", () => {
    assert.deepEqual(
      parseTraceparent(
        "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      ),
      {
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
      },
    );
  });

  test("starts a new trace for anything else", () => {
    assert.equal(parseTraceparent(undefined), undefined);
    assert.equal(parseTraceparent("garbage"), undefined);
    assert.equal(
      parseTraceparent(
        "00-00000000000000000000000000000000-00f067aa0ba902b7-01",
      ),
      undefined,
    );
  });
});

describe("createTracer", () => {
  test("sends finished spans to /v1/traces, a child under its parent", async () => {
    const posts: { url: string; body: unknown }[] = [];
    let time = 1_000;
    const tracer = createTracer({
      endpoint: "http://alloy.monitoring:4318",
      resource: { "service.name": "nuvui-ask" },
      now: () => time,
      fetch: async (url, init) => {
        posts.push({ url: String(url), body: JSON.parse(String(init?.body)) });
        return new Response(null, { status: 200 });
      },
    });
    const request = tracer.startSpan("POST /api/ask", { kind: "server" });
    const call = tracer.startSpan("chat", { kind: "client", parent: request });
    call.setAttribute("gen_ai.usage.input_tokens", 900);
    call.fail("ModelError");
    time = 1_500;
    call.end();
    request.end();
    await tracer.stop();

    assert.equal(posts.length, 1);
    assert.equal(posts[0]?.url, "http://alloy.monitoring:4318/v1/traces");
    const body = posts[0]?.body as
      | {
          resourceSpans: {
            scopeSpans: { spans: Record<string, unknown>[] }[];
          }[];
        }
      | undefined;
    const spans = body?.resourceSpans[0]?.scopeSpans[0]?.spans;
    assert.equal(spans?.length, 2);
    const [child, parent] = spans ?? [];
    assert.equal(child?.traceId, request.traceId);
    assert.equal(child?.parentSpanId, request.spanId);
    assert.equal(child?.kind, 3);
    assert.equal(child?.startTimeUnixNano, "1000000000");
    assert.equal(child?.endTimeUnixNano, "1500000000");
    assert.deepEqual(child?.status, { code: 2, message: "ModelError" });
    assert.deepEqual(child?.attributes, [
      { key: "gen_ai.usage.input_tokens", value: { intValue: "900" } },
    ]);
    assert.equal(parent?.parentSpanId, undefined);
    assert.equal(parent?.kind, 2);
  });

  test("without a collector, a span still has ids for the log and nothing is sent", async () => {
    let sent = 0;
    const tracer = createTracer({
      resource: {},
      fetch: async () => {
        sent += 1;
        return new Response(null);
      },
    });
    const span = tracer.startSpan("x");
    span.end();
    await tracer.stop();
    assert.match(span.traceId, /^[0-9a-f]{32}$/);
    assert.match(span.spanId, /^[0-9a-f]{16}$/);
    assert.equal(sent, 0);
  });
});
