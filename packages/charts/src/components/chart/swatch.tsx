import { chartColor, chartDash, chartFill } from "./config";

/**
 * `"square"` shows a series' fill, pattern included. `"line"` shows its
 * line, dashes included, and suits a line chart.
 */
export type ChartIndicator = "square" | "line";

interface SwatchProps {
  /** The series, when the chart's config has it. */
  series: string | undefined;
  /** The color Recharts reports for the item, for one the config lacks. */
  color: string | undefined;
  indicator: ChartIndicator;
}

// The sample of a series next to its name. It's drawn from the same
// variables as the series itself, so it shows the same pattern or dashes.
export function Swatch({ series, color, indicator }: SwatchProps) {
  if (indicator === "line") {
    return (
      <svg
        className="nuv-chart__swatch nuv-chart__swatch--line"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 12"
      >
        <line
          x1="0"
          y1="6"
          x2="24"
          y2="6"
          strokeWidth="2"
          stroke={series ? chartColor(series) : color}
          strokeDasharray={series ? chartDash(series) : undefined}
        />
      </svg>
    );
  }

  return (
    <svg
      className="nuv-chart__swatch"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 12 12"
    >
      <rect
        width="12"
        height="12"
        rx="2"
        fill={series ? chartFill(series) : color}
      />
    </svg>
  );
}
