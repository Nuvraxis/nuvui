/** One thing that's measured, and how its values are sorted into buckets. */
export interface Instrument {
  name: string;
  /** A UCUM unit: "ms", or "1" for a number with no unit. */
  unit: string;
  description: string;
  /**
   * The upper edge of each bucket but the last, which has none. A value
   * equal to an edge is in the bucket below it.
   */
  bounds: readonly number[];
}

// The edges include each metric's two thresholds from web.dev, "good" up to
// the first and "poor" past the second, so a dashboard can read the share
// of page views on either side straight from the buckets.

// 800 and 1800 for the first byte, 1800 and 3000 for the first paint, 2500
// and 4000 for the largest.
const loading = [
  100, 200, 400, 600, 800, 1000, 1400, 1800, 2500, 3000, 4000, 5000, 7500,
  10000, 15000,
];
// 200 and 500.
const interaction = [50, 100, 150, 200, 300, 400, 500, 750, 1000, 2000];
// 0.1 and 0.25.
const shift = [0.01, 0.025, 0.05, 0.1, 0.15, 0.25, 0.5, 1];

/**
 * The web vitals, by the names the web-vitals library reports them under.
 * First Input Delay isn't here: Interaction to Next Paint replaced it.
 */
export const vitals: Readonly<Record<string, Instrument>> = {
  TTFB: {
    name: "web_vital.ttfb",
    unit: "ms",
    description: "Time to First Byte",
    bounds: loading,
  },
  FCP: {
    name: "web_vital.fcp",
    unit: "ms",
    description: "First Contentful Paint",
    bounds: loading,
  },
  LCP: {
    name: "web_vital.lcp",
    unit: "ms",
    description: "Largest Contentful Paint",
    bounds: loading,
  },
  INP: {
    name: "web_vital.inp",
    unit: "ms",
    description: "Interaction to Next Paint",
    bounds: interaction,
  },
  CLS: {
    name: "web_vital.cls",
    unit: "1",
    description: "Cumulative Layout Shift",
    bounds: shift,
  },
};

/**
 * A move from one page to another inside the app, which loads no document
 * and so has no web vitals of its own.
 */
export const navigation: Instrument = {
  name: "navigation.duration",
  unit: "ms",
  description:
    "From the start of a navigation inside the app to the new page's first paint",
  bounds: [50, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2500, 5000],
};
