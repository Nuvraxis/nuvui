import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type EmptyProps = HTMLAttributes<HTMLDivElement>;

/** What a screen shows when there's nothing to list. */
export const Empty = forwardRef<HTMLDivElement, EmptyProps>(function Empty(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cx("nuv-empty", className)} {...props} />;
});

export type EmptyMediaProps = HTMLAttributes<HTMLDivElement>;

/**
 * An icon or a small picture above the title. It's hidden from screen
 * readers, because the title says the same thing.
 */
export const EmptyMedia = forwardRef<HTMLDivElement, EmptyMediaProps>(
  function EmptyMedia({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cx("nuv-empty__media", className)}
        {...props}
      />
    );
  },
);

export interface EmptyTitleOwnProps {
  /**
   * Render the single child element instead of an `h3`, and give it the
   * title's class and props. This is how you pick the heading level that
   * fits the page.
   * @default false
   */
  asChild?: boolean;
}

export interface EmptyTitleProps
  extends EmptyTitleOwnProps,
    HTMLAttributes<HTMLHeadingElement> {}

export const EmptyTitle = forwardRef<HTMLHeadingElement, EmptyTitleProps>(
  function EmptyTitle({ asChild = false, className, ...props }, ref) {
    const Element = asChild ? Slot : "h3";
    return (
      <Element
        ref={ref}
        className={cx("nuv-empty__title", className)}
        {...props}
      />
    );
  },
);

export type EmptyDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const EmptyDescription = forwardRef<
  HTMLParagraphElement,
  EmptyDescriptionProps
>(function EmptyDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cx("nuv-empty__description", className)}
      {...props}
    />
  );
});

export type EmptyActionsProps = HTMLAttributes<HTMLDivElement>;

/** The buttons or links that get someone out of the empty state. */
export const EmptyActions = forwardRef<HTMLDivElement, EmptyActionsProps>(
  function EmptyActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-empty__actions", className)}
        {...props}
      />
    );
  },
);
