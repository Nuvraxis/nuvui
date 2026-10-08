import type { ReactNode } from "react";

/**
 * A fill that tells a series apart without its color. `"solid"` is no
 * pattern.
 */
export type ChartPattern =
  | "solid"
  | "diagonal"
  | "dots"
  | "reverse-diagonal"
  | "horizontal"
  | "cross"
  | "vertical"
  | "grid";

/** How a series' line is drawn. `"solid"` is an unbroken line. */
export type ChartDash =
  | "solid"
  | "dashed"
  | "dotted"
  | "dash-dot"
  | "long-dash"
  | "short-dash"
  | "dash-dot-dot"
  | "long-short";

export interface ChartSeries {
  /** The name shown in the tooltip, the legend and the table. */
  label?: ReactNode;
  /**
   * Any CSS color. Left out, the series takes the next of the theme's eight
   * chart colors, `--color-chart-1` to `--color-chart-8`, by its place in
   * the config.
   */
  color?: string;
  /**
   * The fill of this series, always. Left out, the series is filled with
   * its color, and with a pattern of its own when the container has
   * `patterns` or the browser is forcing colors.
   */
  pattern?: ChartPattern;
  /** The same for its line. */
  dash?: ChartDash;
}

/**
 * The series of a chart, by key. The key is what the series is called in
 * the data, and what its CSS variables are named after.
 */
export type ChartConfig = Record<string, ChartSeries>;

// In the order they're handed out, so the first series stays plain and
// neighbours differ as much as they can.
export const patterns: ChartPattern[] = [
  "solid",
  "diagonal",
  "dots",
  "reverse-diagonal",
  "horizontal",
  "cross",
  "vertical",
  "grid",
];

export const dashes: Record<ChartDash, string> = {
  solid: "none",
  dashed: "6 4",
  dotted: "2 3",
  "dash-dot": "8 3 2 3",
  "long-dash": "12 4",
  "short-dash": "4 2",
  "dash-dot-dot": "8 3 2 3 2 3",
  "long-short": "12 3 4 3",
};

const dashOrder = Object.keys(dashes) as ChartDash[];

// How many chart colors the theme has.
const colors = 8;

/**
 * A series key as it's written in a CSS variable's name. Anything that
 * can't be in one becomes a hyphen.
 */
export function seriesName(key: string) {
  return key.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** The color of a series: `stroke={chartColor("sales")}`. */
export function chartColor(key: string) {
  return `var(--chart-${seriesName(key)})`;
}

/**
 * The fill of a series, which is its color or its pattern:
 * `fill={chartFill("sales")}`.
 */
export function chartFill(key: string) {
  return `var(--chart-${seriesName(key)}-fill)`;
}

/**
 * The dashes of a series' line, for `strokeDasharray`:
 * `strokeDasharray={chartDash("sales")}`.
 */
export function chartDash(key: string) {
  return `var(--chart-${seriesName(key)}-dash)`;
}

export interface ResolvedSeries {
  key: string;
  name: string;
  /** The id of its pattern element, when it has one to draw. */
  patternId: string | undefined;
  pattern: ChartPattern;
  variables: Record<string, string>;
}

// `var(--nuv-chart-patterns, A) var(--nuv-chart-solid, B)` comes out as A
// while patterns are on and as B while they're off. The stylesheet sets the
// two switches, which is how a media query can turn patterns on for a chart
// whose variables are written inline.
function either(patterned: string, solid: string) {
  return `var(--nuv-chart-patterns, ${patterned}) var(--nuv-chart-solid, ${solid})`;
}

export function resolveSeries(config: ChartConfig, id: string) {
  return Object.entries(config).map(([key, series], index): ResolvedSeries => {
    const name = seriesName(key);
    const color = series.color ?? `var(--color-chart-${(index % colors) + 1})`;
    const pattern = series.pattern ?? patterns[index % patterns.length];
    const dash = series.dash ?? dashOrder[index % dashOrder.length];
    const patternId = pattern === "solid" ? undefined : `${id}-${name}`;
    const own = `var(--chart-${name})`;
    const patterned = patternId ? `url(#${patternId})` : own;

    return {
      key,
      name,
      patternId,
      pattern: pattern ?? "solid",
      variables: {
        // The stylesheet sets the forced color where the browser is forcing
        // colors, and nowhere else.
        [`--chart-${name}`]: `var(--nuv-chart-forced-color, ${color})`,
        [`--chart-${name}-fill`]: series.pattern
          ? patterned
          : either(patterned, own),
        [`--chart-${name}-dash`]: series.dash
          ? dashes[series.dash]
          : either(dashes[dash ?? "solid"], "none"),
      },
    };
  });
}
