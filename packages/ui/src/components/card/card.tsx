import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cx("nuv-card", className)} {...props} />;
});

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

/**
 * The title and description, with room at the end for `CardAction`.
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-card__header", className)} {...props} />
    );
  },
);

export interface CardTitleOwnProps {
  /**
   * Render the single child element instead of an `h3`, and give it the
   * title's class and props. This is how you pick the heading level that
   * fits the page.
   * @default false
   */
  asChild?: boolean;
}

export interface CardTitleProps
  extends CardTitleOwnProps,
    HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ asChild = false, className, ...props }, ref) {
    const Element = asChild ? Slot : "h3";
    return (
      <Element
        ref={ref}
        className={cx("nuv-card__title", className)}
        {...props}
      />
    );
  },
);

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cx("nuv-card__description", className)}
      {...props}
    />
  );
});

export type CardActionProps = HTMLAttributes<HTMLDivElement>;

/**
 * Something to do with the whole card, such as a menu button. It goes inside
 * `CardHeader` and sits at the end of it, level with the title.
 */
export const CardAction = forwardRef<HTMLDivElement, CardActionProps>(
  function CardAction({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-card__action", className)} {...props} />
    );
  },
);

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-card__content", className)}
        {...props}
      />
    );
  },
);

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-card__footer", className)} {...props} />
    );
  },
);
