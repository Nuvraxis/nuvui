import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface VisuallyHiddenOwnProps {
  /**
   * Show the content while it, or something inside it, has keyboard focus.
   * This is what a "Skip to content" link needs.
   * @default false
   */
  focusable?: boolean;
  /**
   * Render the single child element instead of a `span`, and give it the
   * class and props.
   * @default false
   */
  asChild?: boolean;
}

export interface VisuallyHiddenProps
  extends VisuallyHiddenOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

/** Content that screen readers read and nobody sees. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden(
    { focusable = false, asChild = false, className, ...props },
    ref,
  ) {
    const Element = asChild ? Slot : "span";
    return (
      <Element
        ref={ref}
        className={cx(
          "nuv-visually-hidden",
          focusable && "nuv-visually-hidden--focusable",
          className,
        )}
        {...props}
      />
    );
  },
);
