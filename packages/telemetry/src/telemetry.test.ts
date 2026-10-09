import { afterEach, describe, expect, test, vi } from "vitest";
import {
  bucketOf,
  createReporter,
  markNavigation,
  metricsPayload,
  navigation,
  type Page,
  takeNavigation,
  vitals,
} from "./index";

// A page the tests drive by hand: what was sent, the timers that are
// waiting, and the listeners a reporter left.
function fakePage(over: Partial<Page> = {}) {
  const sent: { url: string; body: ReturnType<typeof metricsPayload> }[] = [];
  const timers: { callback: () => void; milliseconds: number }[] = [];
  const hiddenListeners: (() => void)[] = [];
  const restoredListeners: (() => void)[] = [];
  const state = { path: "/docs/forms", hidden: false, now: 1_700_000_005_000 };

  const page: Page = {
    now: () => state.now,
    origin: () => 1_700_000_000_000,
    path: () => state.path,
    hidden: () => state.hidden,
    framed: () => false,
    onHidden: (listener) => hiddenListeners.push(listener),
    onRestored: (listener) => restoredListeners.push(listener),
    later: (callback, milliseconds) => timers.push({ callback, milliseconds }),
    send: (url, body) => sent.push({ url, body: JSON.parse(body) }),
    ...over,
  };

  return {
    page,
    sent,
    timers,
    state,
    hide() {
      state.hidden = true;
      for (const listener of hiddenListeners) listener();
    },
    restore() {
      for (const listener of restoredListeners) listener();
    },
    hiddenListeners,
  };
}

const options = { endpoint: "/otlp", serviceName: "nuvui-test" };

const lcp = {
  id: "v3-1",
  name: "LCP",
  value: 1234.5,
  rating: "good",
  navigationType: "navigate",
};

// Every data point of the one payload that was sent, with its metric.
function points(sent: ReturnType<typeof fakePage>["sent"]) {
  return sent.flatMap(({ body }) =>
    body.resourceMetrics.flatMap((resource) =>
      resource.scopeMetrics.flatMap((scope) =>
        scope.metrics.flatMap((metric) =>
          metric.histogram.dataPoints.map((point) => ({
            name: metric.name,
            ...point,
            attributes: Object.fromEntries(
              point.attributes.map(({ key, value }) => [
                key,
                value.stringValue,
              ]),
            ),
          })),
        ),
      ),
    ),
  );
}

describe("bucketOf", () => {
  test("puts a value on an edge in the bucket below it", () => {
    expect(bucketOf([100, 200], 100)).toBe(0);
    expect(bucketOf([100, 200], 100.1)).toBe(1);
    expect(bucketOf([100, 200], 200)).toBe(1);
  });

  test("puts a value past every edge in the last bucket", () => {
    expect(bucketOf([100, 200], 200.1)).toBe(2);
    expect(bucketOf([], 5)).toBe(0);
  });
});

describe("instruments", () => {
  test.each([...Object.values(vitals), navigation])(
    "$name has edges that only go up",
    ({ bounds }) => {
      expect(bounds.length).toBeGreaterThan(0);
      expect([...bounds].sort((a, b) => a - b)).toEqual(bounds);
      expect(new Set(bounds).size).toBe(bounds.length);
    },
  );

  // A dashboard reads "good" and "poor" off these.
  test.each([
    ["TTFB", 800, 1800],
    ["FCP", 1800, 3000],
    ["LCP", 2500, 4000],
    ["INP", 200, 500],
    ["CLS", 0.1, 0.25],
  ])("%s has an edge at each of its thresholds", (name, good, poor) => {
    expect(vitals[name]?.bounds).toContain(good);
    expect(vitals[name]?.bounds).toContain(poor);
  });

  test("leaves out First Input Delay", () => {
    expect(vitals.FID).toBeUndefined();
  });
});

describe("metricsPayload", () => {
  const sample = {
    instrument: vitals.LCP as (typeof vitals)[string],
    value: 2500,
    attributes: { "url.path": "/" },
    startTime: 1_700_000_000_000,
    time: 1_700_000_002_500,
  };

  test("writes a sample as a delta histogram of one value", () => {
    const payload = metricsPayload({ "service.name": "site" }, [sample]);
    const [resource] = payload.resourceMetrics;
    const metric = resource?.scopeMetrics[0]?.metrics[0];
    const point = metric?.histogram.dataPoints[0];

    expect(resource?.resource.attributes).toEqual([
      { key: "service.name", value: { stringValue: "site" } },
    ]);
    expect(metric).toMatchObject({
      name: "web_vital.lcp",
      unit: "ms",
      description: "Largest Contentful Paint",
    });
    expect(metric?.histogram.aggregationTemporality).toBe(1);
    expect(point).toMatchObject({
      count: "1",
      sum: 2500,
      min: 2500,
      max: 2500,
    });
    expect(point?.attributes).toEqual([
      { key: "url.path", value: { stringValue: "/" } },
    ]);
  });

  test("has one more bucket than edges, with the value in exactly one", () => {
    const payload = metricsPayload({}, [sample]);
    const point =
      payload.resourceMetrics[0]?.scopeMetrics[0]?.metrics[0]?.histogram
        .dataPoints[0];
    const bounds = vitals.LCP?.bounds ?? [];

    expect(point?.explicitBounds).toEqual(bounds);
    expect(point?.bucketCounts).toHaveLength(bounds.length + 1);
    expect(point?.bucketCounts.filter((count) => count === "1")).toHaveLength(
      1,
    );
    expect(point?.bucketCounts[bounds.indexOf(2500)]).toBe("1");
  });

  test("writes times as strings of nanoseconds", () => {
    const point = metricsPayload({}, [sample]).resourceMetrics[0]
      ?.scopeMetrics[0]?.metrics[0]?.histogram.dataPoints[0];

    expect(point?.startTimeUnixNano).toBe("1700000000000000000");
    expect(point?.timeUnixNano).toBe("1700000002500000000");
  });

  test("never starts a point after it ends", () => {
    const point = metricsPayload({}, [
      { ...sample, startTime: sample.time + 10 },
    ]).resourceMetrics[0]?.scopeMetrics[0]?.metrics[0]?.histogram.dataPoints[0];

    expect(point?.startTimeUnixNano).toBe(point?.timeUnixNano);
  });

  test("puts samples of one instrument under one metric", () => {
    const payload = metricsPayload({}, [
      sample,
      { ...sample, instrument: navigation, value: 80 },
      { ...sample, value: 900 },
    ]);
    const metrics = payload.resourceMetrics[0]?.scopeMetrics[0]?.metrics ?? [];

    expect(metrics.map((metric) => metric.name)).toEqual([
      "web_vital.lcp",
      "navigation.duration",
    ]);
    expect(metrics[0]?.histogram.dataPoints).toHaveLength(2);
    expect(metrics[1]?.histogram.dataPoints).toHaveLength(1);
  });
});

describe("createReporter", () => {
  test.each([undefined, "", "   "])(
    "does nothing without an endpoint (%j)",
    (endpoint) => {
      const { page, sent, timers, hiddenListeners } = fakePage();
      const reporter = createReporter({ ...options, endpoint }, page);

      reporter.vital(lcp);
      reporter.navigation(120, "push");
      reporter.flush();

      expect(reporter.enabled).toBe(false);
      expect(sent).toEqual([]);
      expect(timers).toEqual([]);
      expect(hiddenListeners).toEqual([]);
    },
  );

  test("touches nothing on the page until there's a value", () => {
    const framed = vi.fn(() => false);
    const { page, hiddenListeners } = fakePage({ framed });

    const reporter = createReporter(options, page);

    expect(reporter.enabled).toBe(true);
    expect(framed).not.toHaveBeenCalled();
    expect(hiddenListeners).toEqual([]);
  });

  test("posts to /v1/metrics under the endpoint, with or without a slash", () => {
    for (const endpoint of ["/otlp", "/otlp/", "https://otel.example.com//"]) {
      const { page, sent } = fakePage();
      const reporter = createReporter({ ...options, endpoint }, page);
      reporter.vital(lcp);
      reporter.flush();
      expect(sent[0]?.url).toBe(`${endpoint.replace(/\/+$/, "")}/v1/metrics`);
    }
  });

  test("names the service, and its version when there is one", () => {
    const first = fakePage();
    const reporter = createReporter(options, first.page);
    reporter.vital(lcp);
    reporter.flush();
    expect(first.sent[0]?.body.resourceMetrics[0]?.resource.attributes).toEqual(
      [{ key: "service.name", value: { stringValue: "nuvui-test" } }],
    );

    const second = fakePage();
    const versioned = createReporter(
      { ...options, serviceVersion: "abc123" },
      second.page,
    );
    versioned.vital(lcp);
    versioned.flush();
    expect(
      second.sent[0]?.body.resourceMetrics[0]?.resource.attributes,
    ).toContainEqual({
      key: "service.version",
      value: { stringValue: "abc123" },
    });
  });

  test("waits for other values, then sends them together", () => {
    const { page, sent, timers } = fakePage();
    const reporter = createReporter({ ...options, flushAfter: 3000 }, page);

    reporter.vital({ ...lcp, id: "a", name: "TTFB", value: 90 });
    reporter.vital({ ...lcp, id: "b", name: "FCP", value: 400 });

    expect(sent).toEqual([]);
    expect(timers).toHaveLength(1);
    expect(timers[0]?.milliseconds).toBe(3000);

    timers[0]?.callback();

    expect(sent).toHaveLength(1);
    expect(points(sent).map((point) => point.name)).toEqual([
      "web_vital.ttfb",
      "web_vital.fcp",
    ]);
  });

  test("sets a new timer for what comes after a send", () => {
    const { page, sent, timers } = fakePage();
    const reporter = createReporter(options, page);

    reporter.vital({ ...lcp, id: "a" });
    timers[0]?.callback();
    reporter.vital({ ...lcp, id: "b", name: "FCP" });

    expect(timers).toHaveLength(2);
    timers[1]?.callback();
    expect(sent).toHaveLength(2);
  });

  test("sends what's waiting when the page is hidden", () => {
    const fake = fakePage();
    const reporter = createReporter(options, fake.page);

    reporter.vital(lcp);
    fake.hide();

    expect(fake.sent).toHaveLength(1);
    // The timer still fires, and finds nothing.
    fake.timers[0]?.callback();
    expect(fake.sent).toHaveLength(1);
  });

  test("sends at once a value that arrives on a hidden page", () => {
    const fake = fakePage();
    const reporter = createReporter(options, fake.page);
    fake.state.hidden = true;

    reporter.vital({ ...lcp, id: "c", name: "CLS", value: 0.02 });

    expect(fake.sent).toHaveLength(1);
    expect(fake.timers).toEqual([]);
  });

  test("gives a vital its rating, how the page was reached, and the page", () => {
    const { page, sent } = fakePage();
    const reporter = createReporter(options, page);

    reporter.vital(lcp);
    reporter.flush();

    expect(points(sent)[0]).toMatchObject({
      name: "web_vital.lcp",
      sum: 1234.5,
      attributes: {
        "url.path": "/docs/forms",
        "web_vital.rating": "good",
        "navigation.type": "navigate",
      },
      startTimeUnixNano: "1700000000000000000",
      timeUnixNano: "1700000005000000000",
    });
  });

  test("files a vital under the page that was loaded, not the one it's on now", () => {
    const fake = fakePage();
    const reporter = createReporter(options, fake.page);

    reporter.vital({ ...lcp, id: "a", name: "TTFB", value: 90 });
    fake.state.path = "/docs/theming";
    reporter.vital({ ...lcp, id: "b", name: "CLS", value: 0.3 });
    reporter.flush();

    expect(
      points(fake.sent).map((point) => point.attributes["url.path"]),
    ).toEqual(["/docs/forms", "/docs/forms"]);
  });

  test("takes the page again when the Back button brings one back whole", () => {
    const fake = fakePage();
    const reporter = createReporter(options, fake.page);

    reporter.vital({ ...lcp, id: "a" });
    fake.state.path = "/blocks";
    fake.restore();
    reporter.vital({ ...lcp, id: "b" });
    reporter.flush();

    expect(
      points(fake.sent).map((point) => point.attributes["url.path"]),
    ).toEqual(["/docs/forms", "/blocks"]);
  });

  test("counts a vital once, however often it's reported", () => {
    const { page, sent } = fakePage();
    const reporter = createReporter(options, page);

    reporter.vital({ ...lcp, id: "cls-1", name: "CLS", value: 0.01 });
    reporter.vital({ ...lcp, id: "cls-1", name: "CLS", value: 0.2 });
    reporter.vital({ ...lcp, id: "cls-2", name: "CLS", value: 0.05 });
    reporter.flush();

    expect(points(sent).map((point) => point.sum)).toEqual([0.01, 0.05]);
  });

  test.each([
    ["a metric it has no instrument for", { ...lcp, name: "FID" }],
    ["a value that isn't a number", { ...lcp, value: Number.NaN }],
    ["a value that has no end", { ...lcp, value: Number.POSITIVE_INFINITY }],
    ["a value below zero", { ...lcp, value: -1 }],
  ])("leaves out %s", (_, metric) => {
    const { page, sent, timers } = fakePage();
    const reporter = createReporter(options, page);

    reporter.vital(metric);
    reporter.flush();

    expect(sent).toEqual([]);
    expect(timers).toEqual([]);
  });

  test("leaves a rating and a navigation type out when there's none", () => {
    const { page, sent } = fakePage();
    const reporter = createReporter(options, page);

    reporter.vital({ id: "a", name: "LCP", value: 10 });
    reporter.flush();

    expect(points(sent)[0]?.attributes).toEqual({ "url.path": "/docs/forms" });
  });

  test("reports a navigation under the page it went to", () => {
    const fake = fakePage();
    const reporter = createReporter(options, fake.page);

    // The reporter first sees the page here, at /docs/forms.
    reporter.vital(lcp);
    fake.state.path = "/docs/theming/";
    reporter.navigation(180, "push");
    reporter.flush();

    const [, moved] = points(fake.sent);
    expect(moved).toMatchObject({
      name: "navigation.duration",
      sum: 180,
      attributes: { "url.path": "/docs/theming", "navigation.type": "push" },
      // 180 milliseconds before it ended.
      startTimeUnixNano: "1700000004820000000",
      timeUnixNano: "1700000005000000000",
    });
  });

  test.each([Number.NaN, -5, Number.POSITIVE_INFINITY])(
    "leaves out a navigation that took %s",
    (duration) => {
      const { page, sent } = fakePage();
      const reporter = createReporter(options, page);
      reporter.navigation(duration);
      reporter.flush();
      expect(sent).toEqual([]);
    },
  );

  test("writes the home page as / and cuts a very long path", () => {
    const fake = fakePage();
    fake.state.path = "/";
    const reporter = createReporter(options, fake.page);
    reporter.navigation(10);
    fake.state.path = `/${"a".repeat(500)}`;
    reporter.navigation(10);
    reporter.flush();

    const paths = points(fake.sent).map(
      (point) => point.attributes["url.path"],
    );
    expect(paths[0]).toBe("/");
    expect(paths[1]).toHaveLength(200);
  });

  test("measures nothing inside a frame", () => {
    const { page, sent, timers, hiddenListeners } = fakePage({
      framed: () => true,
    });
    const reporter = createReporter(options, page);

    reporter.vital(lcp);
    reporter.navigation(100);
    reporter.flush();

    expect(sent).toEqual([]);
    expect(timers).toEqual([]);
    expect(hiddenListeners).toEqual([]);
  });

  test("stops collecting when nothing is being sent", () => {
    const { page, sent } = fakePage();
    const reporter = createReporter(options, page);

    for (let index = 0; index < 80; index += 1) reporter.navigation(index);
    reporter.flush();

    expect(points(sent)).toHaveLength(50);
  });

  test("keeps going when sending throws", () => {
    const { page } = fakePage({
      send: () => {
        throw new Error("blocked");
      },
    });
    const reporter = createReporter(options, page);

    reporter.vital(lcp);
    expect(() => reporter.flush()).not.toThrow();
  });

  test("listens for the page being hidden once", () => {
    const { page, hiddenListeners } = fakePage();
    const reporter = createReporter(options, page);

    reporter.vital({ ...lcp, id: "a" });
    reporter.vital({ ...lcp, id: "b" });
    reporter.navigation(10);

    expect(hiddenListeners).toHaveLength(1);
  });
});

describe("markNavigation and takeNavigation", () => {
  afterEach(() => {
    performance.clearMarks();
    vi.restoreAllMocks();
  });

  test("has nothing to take before a navigation is marked", () => {
    expect(takeNavigation()).toBeUndefined();
  });

  test("gives how long ago the mark was made, and its type", () => {
    markNavigation("push");
    const started = performance.getEntriesByName("nuvui.navigation")[0];
    vi.spyOn(performance, "now").mockReturnValue(
      (started?.startTime ?? 0) + 250,
    );

    const taken = takeNavigation();

    expect(taken?.type).toBe("push");
    expect(taken?.duration).toBeCloseTo(250, 5);
  });

  test("takes a mark only once", () => {
    markNavigation("push");
    expect(takeNavigation()).toBeDefined();
    expect(takeNavigation()).toBeUndefined();
  });

  test("keeps only the newest mark", () => {
    markNavigation("push");
    markNavigation("traverse");

    expect(performance.getEntriesByName("nuvui.navigation")).toHaveLength(1);
    expect(takeNavigation()?.type).toBe("traverse");
  });

  test("has no type when none was given", () => {
    markNavigation();
    expect(takeNavigation()?.type).toBeUndefined();
  });

  test("doesn't throw where the browser can't mark", () => {
    vi.spyOn(performance, "mark").mockImplementation(() => {
      throw new Error("no marks");
    });
    expect(() => markNavigation("push")).not.toThrow();
    expect(takeNavigation()).toBeUndefined();
  });
});
