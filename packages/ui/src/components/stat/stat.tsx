import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface StatOwnProps {
  /**
   * `"card"` draws a surface with an edge around the figure. `"plain"`
   * draws nothing, for a figure that's already inside a card or a table.
   * @default "card"
   */
  variant?: "card" | "plain";
}

export interface StatProps
  extends StatOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * One figure: what it counts, the number, and what to make of it. Put the
 * label first. A screen reader reads the parts in the order they're in.
 */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  { variant = "card", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        "nuv-stat",
        variant === "card" && "nuv-stat--card",
        className,
      )}
      {...props}
    />
  );
});

export type StatLabelProps = HTMLAttributes<HTMLDivElement>;

/** What the number counts, such as "Revenue". */
export const StatLabel = forwardRef<HTMLDivElement, StatLabelProps>(
  function StatLabel({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-stat__label", className)} {...props} />
    );
  },
);

export type StatValueProps = HTMLAttributes<HTMLDivElement>;

/** The number itself, large. */
export const StatValue = forwardRef<HTMLDivElement, StatValueProps>(
  function StatValue({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-stat__value", className)} {...props} />
    );
  },
);

export type StatDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

/**
 * A line under the number: how it changed, and against what. A `Trend`
 * goes here, with the words that say what it's compared to.
 */
export const StatDescription = forwardRef<
  HTMLParagraphElement,
  StatDescriptionProps
>(function StatDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cx("nuv-stat__description", className)}
      {...props}
    />
  );
});

export type StatChartProps = HTMLAttributes<HTMLDivElement>;

/**
 * Room for a small chart of how the number got here. It has a height and
 * nothing else: the chart is yours, from any library.
 */
export const StatChart = forwardRef<HTMLDivElement, StatChartProps>(
  function StatChart({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-stat__chart", className)} {...props} />
    );
  },
);

export type StatGroupProps = HTMLAttributes<HTMLDivElement>;

/**
 * Several figures side by side, as many to a row as fit. On a phone that's
 * one.
 */
export const StatGroup = forwardRef<HTMLDivElement, StatGroupProps>(
  function StatGroup({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-stat-group", className)} {...props} />
    );
  },
);
