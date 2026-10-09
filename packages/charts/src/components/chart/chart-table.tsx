"use client";

import { forwardRef, type ReactNode, type TableHTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import { type ChartValueFormatter, show, useChart } from "./context";

export interface ChartTableOwnProps {
  /** The rows the chart was drawn from. */
  data: ReadonlyArray<object>;
  /**
   * The field that names each row, such as the month. It's the heading of
   * the row.
   */
  category: string;
  /** The heading of that column. */
  categoryLabel: ReactNode;
  /**
   * The fields to show, in order. Left out, it's every key of the chart's
   * config.
   */
  series?: string[];
  /**
   * Shows the table under the chart. Without it the table is there for
   * screen readers only.
   * @default false
   */
  visible?: boolean;
  /**
   * A caption for the table. Without one the table has the chart's name.
   */
  caption?: ReactNode;
  /** How a category is written. */
  formatCategory?: (value: number | string) => ReactNode;
  /** How a value is written. The container's `formatValue` by default. */
  formatValue?: ChartValueFormatter;
}

export interface ChartTableProps
  extends ChartTableOwnProps,
    Omit<TableHTMLAttributes<HTMLTableElement>, keyof ChartTableOwnProps> {}

/**
 * The numbers of a chart as a table. A chart is a picture, and this is its
 * text: what a screen reader reads, and what anyone can read a number off.
 * It goes in the container's `table`.
 */
export const ChartTable = forwardRef<HTMLTableElement, ChartTableProps>(
  function ChartTable(
    {
      data,
      category,
      categoryLabel,
      series,
      visible = false,
      caption,
      formatCategory,
      formatValue,
      className,
      ...props
    },
    ref,
  ) {
    const chart = useChart("ChartTable");
    const format = formatValue ?? chart.formatValue;
    const columns = series ?? Object.keys(chart.config);
    const rows = data as ReadonlyArray<Record<string, unknown>>;

    return (
      // A table is never narrower than what's in it, so it can't be hidden
      // by its own size. The box around it can.
      <div
        className={cx("nuv-chart__data", !visible && "nuv-chart__data--hidden")}
      >
        <table
          ref={ref}
          className={cx("nuv-chart__table", className)}
          {...(caption ? null : chart.name)}
          {...props}
        >
          {caption ? <caption>{caption}</caption> : null}
          <thead>
            <tr>
              <th scope="col">{categoryLabel}</th>
              {columns.map((key) => (
                <th key={key} scope="col">
                  {chart.config[key]?.label ?? key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: two rows can have the same category, and the rows of a chart are drawn in the order given
              <tr key={index}>
                <th scope="row">
                  {show(row[category], category, formatCategory)}
                </th>
                {columns.map((key) => (
                  <td key={key}>{show(row[key], key, format)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
