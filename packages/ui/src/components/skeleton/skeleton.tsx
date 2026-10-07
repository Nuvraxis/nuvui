import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface SkeletonOwnProps {
  /**
   * `"block"` is a rounded box you give a size. `"text"` is as tall as a
   * line of the text around it. `"circle"` is round, for an avatar.
   * @default "block"
   */
  shape?: "block" | "text" | "circle";
}

export interface SkeletonProps
  extends SkeletonOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A gray box in the shape of content that's still loading. It's hidden from
 * screen readers. Say that something is loading on the region around it,
 * with `aria-busy`.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ shape = "block", className, ...props }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cx("nuv-skeleton", `nuv-skeleton--${shape}`, className)}
        {...props}
      />
    );
  },
);
