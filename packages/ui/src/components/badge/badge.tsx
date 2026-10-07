import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface BadgeOwnProps {
  /**
   * What the badge says about the thing it's on. The color is extra: the
   * text has to carry the meaning by itself.
   * @default "neutral"
   */
  intent?: "neutral" | "primary" | "success" | "warning" | "danger";
  /**
   * `"solid"` is filled with the intent's color. `"outline"` has an edge in
   * that color on a plain background, for a row where many filled badges
   * would be too loud.
   * @default "solid"
   */
  variant?: "solid" | "outline";
}

export interface BadgeProps
  extends BadgeOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { intent = "neutral", variant = "solid", className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx(
        "nuv-badge",
        `nuv-badge--${intent}`,
        variant === "outline" && "nuv-badge--outline",
        className,
      )}
      {...props}
    />
  );
});
