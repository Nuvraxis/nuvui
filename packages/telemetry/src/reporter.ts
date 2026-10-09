import { navigation, vitals } from "./instruments";
import { metricsPayload, type Sample } from "./otlp";

export interface ReporterOptions {
  /**
   * Where the collector is, without `/v1/metrics`: a path on the site's own
   * origin such as `/otlp`, or a full address. Left out or empty, nothing
   * is measured and nothing is sent.
   */
  endpoint: string | undefined;
  /** The `service.name` the collector files the numbers under. */
  serviceName: string;
  /** The `service.version`, such as the commit the site was built from. */
  serviceVersion?: string;
  /** How long a value waits for others to be sent with, in milliseconds. */
  flushAfter?: number;
}

/** What the web-vitals library hands over, as far as it's used here. */
export interface VitalMetric {
  id: string;
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
}

export interface Reporter {
  /** Whether there's a collector to send to. */
  readonly enabled: boolean;
  vital(metric: VitalMetric): void;
  /** A navigation inside the app that took this long, in milliseconds. */
  navigation(duration: number, type?: string): void;
  /** Sends what's waiting, now. */
  flush(): void;
}

/**
 * What a reporter needs from the page. It's a parameter so the tests can
 * hand over one of their own.
 */
export interface Page {
  /** Milliseconds since 1970. */
  now(): number;
  /** When the document began to load, in milliseconds since 1970. */
  origin(): number;
  path(): string;
  hidden(): boolean;
  /** Whether the page is inside a frame of another page. */
  framed(): boolean;
  onHidden(listener: () => void): void;
  /** For a page brought back whole by the Back button. */
  onRestored(listener: () => void): void;
  later(callback: () => void, milliseconds: number): void;
  send(url: string, body: string): void;
}

const browser: Page = {
  now: () => Date.now(),
  origin: () => performance.timeOrigin,
  path: () => window.location.pathname,
  hidden: () => document.visibilityState === "hidden",
  framed: () => window.self !== window.top,
  onHidden(listener) {
    // Both: `pagehide` is the only one of the two some browsers fire when
    // a tab is closed, and `visibilitychange` the only one a phone fires
    // when the browser is put away.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") listener();
    });
    window.addEventListener("pagehide", listener);
  },
  onRestored(listener) {
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) listener();
    });
  },
  later: (callback, milliseconds) => {
    setTimeout(callback, milliseconds);
  },
  send(url, body) {
    // `keepalive` lets the request outlive the page, which is when the
    // last values arrive. No cookies go with it.
    fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      credentials: "omit",
      headers: { "content-type": "application/json" },
    }).catch(() => {
      // A collector that's down is not the visitor's problem.
    });
  },
};

// More than this waiting means nothing is being sent, and the page
// shouldn't keep collecting.
const most = 50;

const pathOf = (path: string) =>
  (path.replace(/\/+$/, "") || "/").slice(0, 200);

const off: Reporter = {
  enabled: false,
  vital() {},
  navigation() {},
  flush() {},
};

/**
 * Collects web vitals and navigation times and posts them to an
 * OpenTelemetry collector as histograms. Nothing identifies the visitor:
 * what's sent is the value, the page's path, and the service's name.
 *
 * Making one touches nothing in the browser, so a module that's also
 * loaded on the server can make it at the top.
 */
export function createReporter(
  { endpoint, serviceName, serviceVersion, flushAfter = 5000 }: ReporterOptions,
  page: Page = browser,
): Reporter {
  const base = endpoint?.trim().replace(/\/+$/, "");
  if (!base) return off;

  const url = `${base}/v1/metrics`;
  const resource = {
    "service.name": serviceName,
    ...(serviceVersion ? { "service.version": serviceVersion } : {}),
  };

  const waiting: Sample[] = [];
  const reported = new Set<string>();
  let state: "on" | "off" | undefined;
  let scheduled = false;
  // The page the document was loaded for. A web vital is about that load,
  // however far the visitor has moved inside the app when it's reported.
  let landing = "/";

  function flush() {
    scheduled = false;
    if (waiting.length === 0) return;
    const body = JSON.stringify(metricsPayload(resource, waiting.splice(0)));
    try {
      page.send(url, body);
    } catch {
      // Measuring must never break the page it measures.
    }
  }

  function ready() {
    if (state) return state === "on";
    // A block's preview is a page of the site inside a frame. Its numbers
    // would be counted as a visit to a page nobody opened.
    if (page.framed()) {
      state = "off";
      return false;
    }
    state = "on";
    landing = pathOf(page.path());
    page.onHidden(flush);
    page.onRestored(() => {
      landing = pathOf(page.path());
    });
    return true;
  }

  function add(sample: Sample) {
    if (waiting.length >= most) return;
    waiting.push(sample);
    // A hidden page may never run a timer again.
    if (page.hidden()) {
      flush();
    } else if (!scheduled) {
      scheduled = true;
      page.later(flush, flushAfter);
    }
  }

  return {
    enabled: true,

    vital({ id, name, value, rating, navigationType }) {
      const instrument = vitals[name];
      if (!instrument || !Number.isFinite(value) || value < 0) return;
      if (!ready()) return;
      // Layout shift and interaction delay are reported each time the page
      // is hidden, with the value so far. A histogram can't take a value
      // back, so only the first report of each is counted. That's the page
      // as it was when the visitor first left it.
      if (reported.has(id)) return;
      reported.add(id);

      const time = page.now();
      add({
        instrument,
        value,
        attributes: {
          "url.path": landing,
          ...(rating ? { "web_vital.rating": rating } : {}),
          ...(navigationType ? { "navigation.type": navigationType } : {}),
        },
        startTime: page.origin(),
        time,
      });
    },

    navigation(duration, type) {
      if (!Number.isFinite(duration) || duration < 0) return;
      if (!ready()) return;

      const time = page.now();
      add({
        instrument: navigation,
        value: duration,
        attributes: {
          "url.path": pathOf(page.path()),
          ...(type ? { "navigation.type": type } : {}),
        },
        startTime: time - duration,
        time,
      });
    },

    flush,
  };
}
