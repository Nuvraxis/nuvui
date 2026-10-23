import { randomBytes } from "node:crypto";

// Written by hand, as apps/mcp/src/metrics.ts writes its counts: the
// OpenTelemetry SDK would be the service's largest dependency, and it
// changes how pnpm resolves Vitest's optional peers for the whole
// workspace. A span is a few fields, sent as JSON to the collector's
// /v1/traces.

export type SpanKind = "internal" | "server" | "client";

// SPAN_KIND_*, in the protocol's numbers.
const kinds: Record<SpanKind, number> = { internal: 1, server: 2, client: 3 };

type Value = string | number | boolean;

export interface Span {
  readonly traceId: string;
  readonly spanId: string;
  setAttribute(key: string, value: Value | undefined): void;
  /** Marks the span as failed, with what went wrong in a word. */
  fail(message: string): void;
  end(): void;
}

export interface Parent {
  traceId: string;
  spanId: string;
}

/**
 * The trace a request is part of, from its W3C `traceparent` header, as the
 * Gateway or Cloudflare may send one. A header that isn't one starts a new
 * trace.
 */
export function parseTraceparent(header: string | null | undefined) {
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/.exec(
    header?.trim() ?? "",
  );
  if (!match?.[1] || !match[2]) return undefined;
  if (/^0+$/.test(match[1]) || /^0+$/.test(match[2])) return undefined;
  return { traceId: match[1], spanId: match[2] } satisfies Parent;
}

const nanoseconds = (milliseconds: number) =>
  `${Math.round(milliseconds * 1000)}000`;

interface Finished {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  start: number;
  end: number;
  attributes: Map<string, Value>;
  error?: string;
}

const attribute = (key: string, value: Value) => ({
  key,
  value:
    typeof value === "string"
      ? { stringValue: value }
      : typeof value === "boolean"
        ? { boolValue: value }
        : Number.isInteger(value)
          ? { intValue: String(value) }
          : { doubleValue: value },
});

/** The body of a POST to a collector's `/v1/traces`. */
export function tracesPayload(
  resource: Readonly<Record<string, string>>,
  spans: readonly Finished[],
) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: Object.entries(resource).map(([key, value]) =>
            attribute(key, value),
          ),
        },
        scopeSpans: [
          {
            scope: { name: "nuvui-ask" },
            spans: spans.map((span) => ({
              traceId: span.traceId,
              spanId: span.spanId,
              ...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}),
              name: span.name,
              kind: span.kind,
              startTimeUnixNano: nanoseconds(span.start),
              endTimeUnixNano: nanoseconds(span.end),
              attributes: [...span.attributes].map(([key, value]) =>
                attribute(key, value),
              ),
              // STATUS_CODE_ERROR is 2, and UNSET is left out.
              ...(span.error
                ? { status: { code: 2, message: span.error } }
                : {}),
            })),
          },
        ],
      },
    ],
  };
}

export interface TracerOptions {
  /** The collector, without `/v1/traces`. Without one, spans are only ids. */
  endpoint?: string;
  resource: Readonly<Record<string, string>>;
  intervalMs?: number;
  /** Past this, spans are sent at once. */
  batch?: number;
  fetch?: typeof globalThis.fetch;
  /** Milliseconds since the epoch, with a fraction. */
  now?: () => number;
}

export function createTracer({
  endpoint,
  resource,
  intervalMs = 5000,
  batch = 256,
  fetch = globalThis.fetch,
  now = () => performance.timeOrigin + performance.now(),
}: TracerOptions) {
  let queue: Finished[] = [];

  const send = async () => {
    if (!endpoint || queue.length === 0) return;
    const spans = queue;
    queue = [];
    try {
      await fetch(`${endpoint}/v1/traces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tracesPayload(resource, spans)),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // A collector that isn't there costs the traces, and nothing else.
    }
  };

  const timer = endpoint ? setInterval(() => void send(), intervalMs) : null;
  timer?.unref();

  return {
    startSpan(
      name: string,
      {
        kind = "internal",
        parent,
        attributes = {},
      }: {
        kind?: SpanKind;
        parent?: Parent;
        attributes?: Record<string, Value>;
      } = {},
    ): Span {
      const traceId = parent?.traceId ?? randomBytes(16).toString("hex");
      const spanId = randomBytes(8).toString("hex");
      const start = now();
      const values = new Map<string, Value>(Object.entries(attributes));
      let error: string | undefined;
      let ended = false;
      return {
        traceId,
        spanId,
        setAttribute(key, value) {
          if (value !== undefined) values.set(key, value);
        },
        fail(message) {
          error = message;
        },
        end() {
          if (ended) return;
          ended = true;
          if (!endpoint) return;
          queue.push({
            traceId,
            spanId,
            parentSpanId: parent?.spanId,
            name,
            kind: kinds[kind],
            start,
            end: now(),
            attributes: values,
            error,
          });
          if (queue.length >= batch) void send();
        },
      };
    },
    /** Sends what's left, as the pod stops. */
    async stop() {
      if (timer) clearInterval(timer);
      await send();
    },
  };
}

export type Tracer = ReturnType<typeof createTracer>;
