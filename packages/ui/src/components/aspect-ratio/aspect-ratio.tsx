import { type CSSProperties, forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface AspectRatioOwnProps {
  /**
   * Width divided by height: `16 / 9`, `4 / 3`, `1`. Leave it out to set
   * `--nuv-aspect-ratio-value` in CSS instead, where it can change at a
   * breakpoint.
   */
  ratio?: number;
}

export interface AspectRatioProps
  extends AspectRatioOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A box that keeps its shape at any width. What's inside fills it, and a
 * picture or a video is cropped to fit.
 */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  function AspectRatio({ ratio, className, style, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-aspect-ratio", className)}
        style={
          ratio === undefined
            ? style
            : ({ "--nuv-aspect-ratio-value": ratio, ...style } as CSSProperties)
        }
        {...props}
      />
    );
  },
);
