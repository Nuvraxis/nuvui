import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import {
  type FormatNumberOptions,
  formatNumber,
} from "../formatted-number/formatted-number";

export interface TrendOwnProps {
  /**
   * The change, as a ratio: 0.12 is a rise of 12%. Its sign says which way
   * the arrow points, and zero is no change.
   */
  value: number;
  /**
   * Which way is the good news. A rise is, for revenue. A fall is, for
   * costs and for errors: pass `"down"`. It only chooses the color.
   * @default "up"
   */
  good?: "up" | "down";
  /**
   * `"outline"` puts an edge around it, in the same color, for a trend
   * that stands by itself.
   * @default "plain"
   */
  variant?: "plain" | "outline";
  /**
   * How the amount is written, when you don't write it yourself as
   * children. A percentage with at most one decimal unless you say
   * otherwise.
   */
  format?: FormatNumberOptions;
  /**
   * What a screen reader says before the amount of a rise. The arrow is a
   * picture, and the color can't be heard. Translate it with the rest of
   * your interface.
   * @default "Up"
   */
  upLabel?: string;
  /**
   * What a screen reader says before the amount of a fall. Translate it
   * with the rest of your interface.
   * @default "Down"
   */
  downLabel?: string;
  /**
   * What a screen reader says when the value is zero, in place of the
   * amount. Translate it with the rest of your interface.
   * @default "No change"
   */
  flatLabel?: string;
}

export interface TrendProps
  extends TrendOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

const arrows = {
  up: "M3 9l6-6M4.5 3H9v4.5",
  down: "M3 3l6 6M4.5 9H9V4.5",
  flat: "M2.5 6h7",
};

/**
 * Which way a number moved and by how much: an arrow, the amount, and the
 * direction in words for a screen reader. The amount is written without
 * its sign, because the arrow and the words carry it.
 */
export const Trend = forwardRef<HTMLSpanElement, TrendProps>(function Trend(
  {
    value,
    good = "up",
    variant = "plain",
    format,
    upLabel = "Up",
    downLabel = "Down",
    flatLabel = "No change",
    className,
    children,
    ...props
  },
  ref,
) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const tone =
    direction === "flat" ? "neutral" : direction === good ? "good" : "bad";
  const label = { up: upLabel, down: downLabel, flat: flatLabel }[direction];
  const amount =
    children ??
    formatNumber(Math.abs(value), {
      format: "percent",
      maximumFractionDigits: 1,
      ...format,
    });

  return (
    <span
      ref={ref}
      data-direction={direction}
      className={cx(
        "nuv-trend",
        `nuv-trend--${tone}`,
        variant === "outline" && "nuv-trend--outline",
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="nuv-trend__icon"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={arrows[direction]} />
      </svg>
      {label ? <span className="nuv-trend__label">{label} </span> : null}
      {/* With no change the words are all there is to say. The zero is
          still drawn, for the eye. */}
      {direction === "flat" && label ? (
        <span aria-hidden="true">{amount}</span>
      ) : (
        amount
      )}
    </span>
  );
});
