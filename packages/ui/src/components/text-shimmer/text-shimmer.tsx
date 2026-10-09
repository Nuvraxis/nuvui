import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface TextShimmerOwnProps {
  /**
   * Whether the highlight is moving. Turn it off when the wait is over and
   * the text stays, and it becomes plain text in the same color.
   * @default true
   */
  active?: boolean;
}

export interface TextShimmerProps
  extends TextShimmerOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

/**
 * Text with a highlight that moves across it, for "Thinking" and other
 * short waits. It's still for a visitor who asked for less motion. The
 * text is ordinary text to a screen reader.
 */
export const TextShimmer = forwardRef<HTMLSpanElement, TextShimmerProps>(
  function TextShimmer({ active = true, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-state={active ? "active" : "still"}
        className={cx(
          "nuv-text-shimmer",
          active && "nuv-text-shimmer--active",
          className,
        )}
        {...props}
      />
    );
  },
);
