"use client";

import {
  type CSSProperties,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useId,
  useMemo,
} from "react";
import { cx } from "../../utils/cx";
import { type ChartConfig, resolveSeries } from "./config";
import {
  ChartContext,
  type ChartContextValue,
  type ChartValueFormatter,
} from "./context";
import { Patterns } from "./patterns";

/**
 * What the chart is called. One of the two is required: a chart is a
 * picture, and the name is what a screen reader has to say for it.
 */
export type ChartName =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-label"?: string; "aria-labelledby": string };

export interface ChartContainerOwnProps {
  /** The series of the chart: a label, and optionally a color, for each. */
  config: ChartConfig;
  /**
   * One Recharts chart, such as `<BarChart>`. It's sized to the container
   * and given the container's name.
   */
  children: ReactElement;
  /**
   * The same numbers as a table, usually a `ChartTable`. It's drawn after
   * the chart.
   */
  table?: ReactNode;
  /**
   * Fills each series with a pattern of its own and dashes its line, so
   * that series can be told apart without color. Where the browser is
   * forcing colors this happens whatever is set here.
   * @default false
   */
  patterns?: boolean;
  /**
   * How a value is written in the tooltip and the table. Left out, a value
   * is shown as it is in the data.
   */
  formatValue?: ChartValueFormatter;
}

export type ChartContainerProps = ChartContainerOwnProps &
  ChartName &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof ChartContainerOwnProps | "aria-label" | "aria-labelledby"
  >;

// What the chart is given, unless it was written with its own.
interface ChartProps {
  responsive?: boolean;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const fill: CSSProperties = { width: "100%", height: "100%" };

export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  function ChartContainer(
    {
      config,
      children,
      table,
      patterns = false,
      formatValue,
      className,
      style,
      "aria-label": label,
      "aria-labelledby": labelledBy,
      ...props
    },
    ref,
  ) {
    // Colons, which older Reacts put in an id, can't be in a url().
    const id = `nuv-chart-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const series = useMemo(() => resolveSeries(config, id), [config, id]);

    const variables = useMemo(
      () => Object.assign({}, ...series.map((entry) => entry.variables)),
      [series],
    );

    const context = useMemo<ChartContextValue>(
      () => ({
        config,
        formatValue,
        name: { "aria-label": label, "aria-labelledby": labelledBy },
      }),
      [config, formatValue, label, labelledBy],
    );

    const chart = children as ReactElement<ChartProps>;

    return (
      <ChartContext.Provider value={context}>
        <div
          ref={ref}
          className={cx("nuv-chart", className)}
          data-patterns={patterns ? "" : undefined}
          style={{ ...variables, ...style }}
          {...props}
        >
          <Patterns series={series} />
          <div className="nuv-chart__plot">
            {cloneElement(chart, {
              responsive: chart.props.responsive ?? true,
              style: { ...fill, ...chart.props.style },
              "aria-label": chart.props["aria-label"] ?? label,
              "aria-labelledby": chart.props["aria-labelledby"] ?? labelledBy,
            })}
          </div>
          {table}
        </div>
      </ChartContext.Provider>
    );
  },
);
