"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export interface ProgressOwnProps {
  /**
   * How far along it is, from 0 to `max`. Pass `null`, or leave it out,
   * while the amount isn't known: the bar then moves from side to side.
   */
  value?: number | null;
  /** @default 100 */
  max?: number;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /**
   * The text a screen reader says for the value. By default it's the
   * percentage, such as "40%".
   */
  getValueLabel?: (value: number, max: number) => string;
}

export interface ProgressProps
  extends ProgressOwnProps,
    Omit<
      ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
      keyof ProgressOwnProps
    > {}

/**
 * A bar that fills as a task gets done. Name it with `aria-label` or
 * `aria-labelledby`.
 */
export const Progress = forwardRef<
  ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(function Progress(
  { value = null, max = 100, size = "md", className, ...props },
  ref,
) {
  // Radix treats a value outside 0 to max as unknown. Holding it to the
  // range is kinder to a caller whose arithmetic lands on 100.4.
  const known =
    typeof value === "number" && Number.isFinite(value) && max > 0
      ? Math.min(Math.max(value, 0), max)
      : null;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={known}
      max={max}
      className={cx("nuv-progress", `nuv-progress--${size}`, className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="nuv-progress__indicator"
        style={
          known === null ? undefined : { inlineSize: `${(known / max) * 100}%` }
        }
      />
    </ProgressPrimitive.Root>
  );
});
