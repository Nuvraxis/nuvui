import type { Outcome } from "./server";

export interface CountsOptions {
  /** Where the collector is, without `/v1/metrics`. */
  endpoint: string;
  /** Sent as the resource's attributes, such as `service.name`. */
  resource: Readonly<Record<string, string>>;
  /** How often the counts are sent. */
  intervalMs?: number;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}

const keyValues = (attributes: Readonly<Record<string, string>>) =>
  Object.entries(attributes).map(([key, value]) => ({
    key,
    value: { stringValue: value },
  }));

// The protocol's JSON writes a 64-bit integer as a string. A time in
// nanoseconds doesn't fit in a JavaScript number.
const nanoseconds = (milliseconds: number) =>
  `${Math.round(milliseconds)}000000`;

// AGGREGATION_TEMPORALITY_DELTA: each report has what happened since the
// last one, and adding them up is the collector's job.
const delta = 1;

/**
 * The body of a POST to a collector's `/v1/metrics`: how many times each
 * tool was called, by how the call ended, and how many requests were
 * refused for coming too often, between `start` and `end`. Nothing in it
 * says who asked, or what they asked for.
 */
export function countsPayload(
  resource: Readonly<Record<string, string>>,
  calls: ReadonlyMap<string, number>,
  limited: number,
  start: number,
  end: number,
) {
  const point = (attributes: Record<string, string>, value: number) => ({
    attributes: keyValues(attributes),
    startTimeUnixNano: nanoseconds(start),
    timeUnixNano: nanoseconds(end),
    asInt: String(value),
  });
  const sum = (dataPoints: ReturnType<typeof point>[]) => ({
    aggregationTemporality: delta,
    isMonotonic: true,
    dataPoints,
  });

  const metrics = [];
  if (calls.size > 0) {
    metrics.push({
      name: "mcp.tool.calls",
      unit: "{call}",
      description: "Tool calls, by tool and by how they ended.",
      sum: sum(
        [...calls].map(([key, value]) => {
          const [tool = "", outcome = ""] = key.split(" ");
          return point({ "mcp.tool": tool, "mcp.outcome": outcome }, value);
        }),
      ),
    });
  }
  if (limited > 0) {
    metrics.push({
      name: "mcp.requests.limited",
      unit: "{request}",
      description: "Requests refused because their caller asked too often.",
      sum: sum([point({}, limited)]),
    });
  }

  return {
    resourceMetrics: [
      {
        resource: { attributes: keyValues(resource) },
        scopeMetrics: [{ scope: { name: "@nuvui/mcp" }, metrics }],
      },
    ],
  };
}

/** Counts what's asked for and sends the counts to a collector each minute. */
export function createCounts({
  endpoint,
  resource,
  intervalMs = 60_000,
  fetch = globalThis.fetch,
  now = Date.now,
}: CountsOptions) {
  const url = `${endpoint.trim().replace(/\/+$/, "")}/v1/metrics`;
  let calls = new Map<string, number>();
  let limited = 0;
  let start = now();
  let warned = false;

  async function flush() {
    if (calls.size === 0 && limited === 0) return;
    const end = now();
    const body = JSON.stringify(
      countsPayload(resource, calls, limited, start, end),
    );
    calls = new Map();
    limited = 0;
    start = end;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      // Counts that can't be sent are dropped. Saying so once is enough to
      // find a collector that isn't there.
      if (!warned) {
        warned = true;
        console.warn(`[nuvui-mcp] couldn't send counts to ${url}:`, error);
      }
    }
  }

  const timer = setInterval(() => void flush(), intervalMs);
  timer.unref();

  return {
    call(tool: string, outcome: Outcome) {
      const key = `${tool} ${outcome}`;
      calls.set(key, (calls.get(key) ?? 0) + 1);
    },
    limited() {
      limited += 1;
    },
    flush,
    async stop() {
      clearInterval(timer);
      await flush();
    },
  };
}
