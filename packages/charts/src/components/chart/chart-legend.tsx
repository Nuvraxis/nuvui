"use client";

import {
  type DefaultLegendContentProps,
  Legend,
  type LegendProps,
} from "recharts";
import { cx } from "../../utils/cx";
import { seriesOf } from "./chart-tooltip";
import { useChart } from "./context";
import { type ChartIndicator, Swatch } from "./swatch";

export interface ChartLegendContentOwnProps {
  /**
   * The sample drawn next to each series.
   * @default "square"
   */
  indicator?: ChartIndicator;
  /**
   * The field of a data row that holds the series' key. Only needed when
   * neither the series' name nor its data key is a key of the config.
   */
  nameKey?: string;
  className?: string;
}

export type ChartLegendContentProps = ChartLegendContentOwnProps &
  Pick<DefaultLegendContentProps, "payload">;

/**
 * What's inside a chart's legend. `ChartLegend` draws it by itself. Use it
 * directly to pass Recharts' `Legend` a `content` of your own making.
 */
export function ChartLegendContent({
  payload,
  indicator = "square",
  nameKey,
  className,
}: ChartLegendContentProps) {
  const { config } = useChart("ChartLegendContent");
  const keys = Object.keys(config);
  // In the config's order. Recharts sorts a legend by name, which puts the
  // series in a different order from the one they're drawn and listed in.
  const items = (payload ?? [])
    .filter((item) => item.type !== "none")
    .map((item) => {
      const series = seriesOf(config, item, nameKey, "legend");
      return {
        item,
        series,
        place: series ? keys.indexOf(series) : keys.length,
      };
    })
    .sort((a, b) => a.place - b.place);
  if (items.length === 0) return null;

  return (
    <ul className={cx("nuv-chart__legend", className)}>
      {items.map(({ item, series }) => {
        return (
          <li
            key={`${String(item.dataKey)}-${String(item.value)}`}
            className={cx(
              "nuv-chart__legend-item",
              item.inactive && "nuv-chart__legend-item--inactive",
            )}
          >
            <Swatch series={series} color={item.color} indicator={indicator} />
            {(series && config[series]?.label) ?? item.value}
          </li>
        );
      })}
    </ul>
  );
}

export type ChartLegendProps = ChartLegendContentOwnProps & LegendProps;

/**
 * Recharts' `Legend`, drawn like the rest of the library. It takes
 * everything `Legend` does.
 */
export function ChartLegend({
  indicator,
  nameKey,
  className,
  content,
  ...props
}: ChartLegendProps) {
  return (
    <Legend
      content={
        content ?? (
          <ChartLegendContent
            indicator={indicator}
            nameKey={nameKey}
            className={className}
          />
        )
      }
      {...props}
    />
  );
}
