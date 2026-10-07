import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";

type Intent = "info" | "success" | "warning" | "danger";

// One shape per intent, so the meaning doesn't rest on the color.
const paths: Record<Intent, ReactNode> = {
  info: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9.25v4M10 6.5v.01" />
    </>
  ),
  success: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
    </>
  ),
  warning: (
    <>
      <path d="M10 3.25l7.5 13H2.5z" />
      <path d="M10 8.5v3.5M10 14.25v.01" />
    </>
  ),
  danger: (
    <>
      <path d="M6.9 2.75h6.2l4.15 4.15v6.2l-4.15 4.15H6.9L2.75 13.1V6.9z" />
      <path d="M10 6.75v4M10 13.5v.01" />
    </>
  ),
};

export interface AlertOwnProps {
  /**
   * What kind of message it is. It sets the icon and the color, and the
   * default `role`.
   * @default "info"
   */
  intent?: Intent;
  /**
   * An icon to draw in place of the intent's own. Pass `null` or `false`
   * for none.
   */
  icon?: ReactNode;
}

export interface AlertProps
  extends AlertOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A message that sits in the page. `warning` and `danger` have
 * `role="alert"`, which a screen reader reads out at once if the message is
 * added to the page after it loads. `info` and `success` have
 * `role="status"`, which waits for a pause. Pass `role` to change either.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { intent = "info", icon, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={intent === "warning" || intent === "danger" ? "alert" : "status"}
      className={cx("nuv-alert", `nuv-alert--${intent}`, className)}
      {...props}
    >
      {icon === null || icon === false ? null : (
        <span className="nuv-alert__icon" aria-hidden="true">
          {icon ?? (
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {paths[intent]}
            </svg>
          )}
        </span>
      )}
      <div className="nuv-alert__body">{children}</div>
    </div>
  );
});

export interface AlertTitleOwnProps {
  /**
   * Render the single child element instead of a `div`, and give it the
   * title's class and props. Use it to make the title a heading.
   * @default false
   */
  asChild?: boolean;
}

export interface AlertTitleProps
  extends AlertTitleOwnProps,
    HTMLAttributes<HTMLDivElement> {}

export const AlertTitle = forwardRef<HTMLDivElement, AlertTitleProps>(
  function AlertTitle({ asChild = false, className, ...props }, ref) {
    const Element = asChild ? Slot : "div";
    return (
      <Element
        ref={ref}
        className={cx("nuv-alert__title", className)}
        {...props}
      />
    );
  },
);

export type AlertDescriptionProps = HTMLAttributes<HTMLDivElement>;

export const AlertDescription = forwardRef<
  HTMLDivElement,
  AlertDescriptionProps
>(function AlertDescription({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-alert__description", className)}
      {...props}
    />
  );
});

export type AlertActionsProps = HTMLAttributes<HTMLDivElement>;

/** A row of buttons or links under the message. */
export const AlertActions = forwardRef<HTMLDivElement, AlertActionsProps>(
  function AlertActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-alert__actions", className)}
        {...props}
      />
    );
  },
);
