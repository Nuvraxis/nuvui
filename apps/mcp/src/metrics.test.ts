import { describe, expect, test, vi } from "vitest";
import { countsPayload, createCounts } from "./metrics";

const resource = { "service.name": "nuvui-mcp", "service.version": "1.2.3" };

describe("what's sent", () => {
  test("each tool's calls by how they ended, as a delta sum, and nothing about the caller", () => {
    const payload = countsPayload(
      resource,
      new Map([
        ["get_page ok", 3],
        ["get_page not_found", 1],
      ]),
      2,
      1_000,
      61_000,
    );
    const [scope] = payload.resourceMetrics[0]?.scopeMetrics ?? [];
    const [calls, limited] = scope?.metrics ?? [];

    expect(payload.resourceMetrics[0]?.resource.attributes).toContainEqual({
      key: "service.name",
      value: { stringValue: "nuvui-mcp" },
    });
    expect(calls).toMatchObject({
      name: "mcp.tool.calls",
      sum: { aggregationTemporality: 1, isMonotonic: true },
    });
    expect(calls?.sum.dataPoints).toEqual([
      {
        attributes: [
          { key: "mcp.tool", value: { stringValue: "get_page" } },
          { key: "mcp.outcome", value: { stringValue: "ok" } },
        ],
        startTimeUnixNano: "1000000000",
        timeUnixNano: "61000000000",
        asInt: "3",
      },
      expect.objectContaining({ asInt: "1" }),
    ]);
    expect(limited).toMatchObject({ name: "mcp.requests.limited" });
    expect(limited?.sum.dataPoints[0]).toMatchObject({
      attributes: [],
      asInt: "2",
    });
  });

  test("a metric with nothing to count is left out", () => {
    const payload = countsPayload(
      resource,
      new Map([["get_rules ok", 1]]),
      0,
      0,
      1,
    );

    expect(
      payload.resourceMetrics[0]?.scopeMetrics[0]?.metrics.map(
        (metric) => metric.name,
      ),
    ).toEqual(["mcp.tool.calls"]);
  });
});

describe("sending", () => {
  test("posts the counts to the collector's /v1/metrics, and starts again from none", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    const counts = createCounts({
      endpoint: "http://collector:4318/otlp/",
      resource,
      fetch,
    });

    counts.call("get_page", "ok");
    counts.call("get_page", "ok");
    counts.limited();
    await counts.flush();
    await counts.flush();
    await counts.stop();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://collector:4318/otlp/v1/metrics");
    expect(init.method).toBe("POST");
    expect(
      JSON.parse(String(init.body)).resourceMetrics[0].scopeMetrics[0].metrics,
    ).toHaveLength(2);
  });

  test("a collector that can't be reached is said once, and doesn't stop the server", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetch = vi.fn(async () => {
      throw new Error("refused");
    });
    const counts = createCounts({
      endpoint: "http://nowhere",
      resource,
      fetch,
    });

    counts.call("get_rules", "ok");
    await expect(counts.flush()).resolves.toBeUndefined();
    counts.call("get_rules", "ok");
    await counts.flush();
    await counts.stop();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
