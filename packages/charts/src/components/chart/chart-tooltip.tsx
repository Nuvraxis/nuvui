"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  type TooltipContentProps,
  type TooltipPayloadEntry,
  type TooltipProps,
} from "recharts";
import { cx } from "../../utils/cx";
import type { ChartConfig } from "./config";
import { type ChartValueFormatter, show, useChart } from "./context";
import { type ChartIndicator, Swatch } from "./swatch";

type Value = number | string | ReadonlyArray<number | string>;
type Name = number | string;

// Which series of the config an item of Recharts' belongs to. A tooltip's
// item has the name its series was given, which for a pie is the slice's. A
// legend's item has that name as its value, where a tooltip's item has the
// number. Both have the key the value was read from, which is tried last:
// every slice of a pie is read from the same key.
export function seriesOf(
  config: ChartConfig,
  item: {
    name?: unknown;
    dataKey?: unknown;
    value?: unknown;
    payload?: unknown;
  },
  nameKey: string | undefined,
  from: "tooltip" | "legend" = "tooltip",
) {
  const row =
    typeof item.payload === "object" && item.payload !== null
      ? (item.payload as Record<string, unknown>)
      : undefined;
  const candidates = [
    nameKey ? (row?.[nameKey] ?? item[nameKey as "name"]) : undefined,
    from === "legend" ? item.value : item.name,
    item.dataKey,
  ];
  for (const candidate of candidates) {
    if (
      (typeof candidate === "string" || typeof candidate === "number") &&
      Object.hasOwn(config, candidate)
    ) {
      return String(candidate);
    }
  }
  return undefined;
}

export interface ChartTooltipContentOwnProps {
  /**
   * The sample drawn next to each series.
   * @default "square"
   */
  indicator?: ChartIndicator;
  /**
   * Leaves out the line that says which point this is, for a chart where
   * each row already says it.
   * @default false
   */
  hideLabel?: boolean;
  /**
   * The field of a data row that holds the series' key. Only needed when
   * neither the series' name nor its data key is a key of the config.
   */
  nameKey?: string;
  /** How a value is written. The container's `formatValue` by default. */
  formatValue?: ChartValueFormatter;
  className?: string;
}

export type ChartTooltipContentProps = ChartTooltipContentOwnProps &
  Partial<TooltipContentProps<Value, Name>>;

/**
 * What's inside a chart's tooltip. `ChartTooltip` draws it by itself. Use it
 * directly to pass Recharts' `Tooltip` a `content` of your own making.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  indicator = "square",
  hideLabel = false,
  nameKey,
  formatValue,
  className,
}: ChartTooltipContentProps) {
  const chart = useChart("ChartTooltipContent");
  const format = formatValue ?? chart.formatValue;
  const items = (payload ?? []).filter(
    (item) => item.type !== "none" && !item.hide,
  );
  const shown = active && items.length > 0;

  let heading: ReactNode = null;
  if (shown && !hideLabel) {
    heading = labelFormatter
      ? labelFormatter(label, items)
      : typeof label === "string" && Object.hasOwn(chart.config, label)
        ? (chart.config[label]?.label ?? label)
        : label;
  }

  return (
    // Recharts' own content is a live region, and so is this: it's how a
    // screen reader hears the point the arrow keys have moved to. It stays
    // in the page while empty, because a region that arrives with its text
    // already in it isn't read.
    <div
      className={cx("nuv-chart__tooltip", className)}
      role="status"
      aria-live="assertive"
      hidden={!shown}
    >
      {heading !== null && heading !== undefined && heading !== "" ? (
        <div className="nuv-chart__tooltip-label">{heading}</div>
      ) : null}
      {shown ? (
        <ul className="nuv-chart__tooltip-items">
          {items.map((item, index) => (
            <Item
              key={`${item.graphicalItemId}-${String(item.dataKey)}-${String(item.name)}`}
              item={item}
              index={index}
              items={items}
              config={chart.config}
              nameKey={nameKey}
              indicator={indicator}
              format={format}
              formatter={formatter}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface ItemProps {
  item: TooltipPayloadEntry<Value, Name>;
  index: number;
  items: ReadonlyArray<TooltipPayloadEntry<Value, Name>>;
  config: ChartConfig;
  nameKey: string | undefined;
  indicator: ChartIndicator;
  format: ChartValueFormatter | undefined;
  formatter: ChartTooltipContentProps["formatter"];
}

function Item({
  item,
  index,
  items,
  config,
  nameKey,
  indicator,
  format,
  formatter,
}: ItemProps) {
  const series = seriesOf(config, item, nameKey);
  let name: ReactNode = (series && config[series]?.label) ?? item.name;
  let value: ReactNode = show(item.value, series ?? String(item.name), format);

  // Recharts' own way to format, on the series or on the tooltip. It may
  // give back the value alone, or the value and the name.
  const own = item.formatter ?? formatter;
  if (own) {
    const result = own(item.value, item.name, item, index, items);
    if (Array.isArray(result)) [value, name] = result;
    else value = result;
  }

  return (
    <li className="nuv-chart__tooltip-item">
      <Swatch
        series={series}
        color={item.color ?? item.fill}
        indicator={indicator}
      />
      <span className="nuv-chart__tooltip-name">{name}</span>
      <span className="nuv-chart__tooltip-value">
        {value}
        {item.unit}
      </span>
    </li>
  );
}

export type ChartTooltipProps = ChartTooltipContentOwnProps &
  TooltipProps<Value, Name>;

/**
 * Recharts' `Tooltip`, drawn like the rest of the library. It takes
 * everything `Tooltip` does.
 */
export function ChartTooltip({
  indicator,
  hideLabel,
  nameKey,
  formatValue,
  className,
  content,
  ...props
}: ChartTooltipProps) {
  return (
    <Tooltip
      content={
        content ?? (
          <ChartTooltipContent
            indicator={indicator}
            hideLabel={hideLabel}
            nameKey={nameKey}
            formatValue={formatValue}
            className={className}
          />
        )
      }
      {...props}
    />
  );
}
