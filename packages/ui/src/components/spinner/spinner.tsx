import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface SpinnerOwnProps {
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /**
   * What a screen reader says. It's in the page as text nobody sees.
   * Translate it with the rest of your interface. Pass an empty string where
   * text next to the spinner already says it: the spinner is then hidden
   * from screen readers.
   * @default "Loading"
   */
  label?: string;
}

export interface SpinnerProps
  extends SpinnerOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

/**
 * A ring that turns while something loads. It has `role="status"`, so a
 * screen reader reads its label when it's added to the page. With an empty
 * label it's decoration, with no role.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  function Spinner(
    { size = "md", label = "Loading", className, ...props },
    ref,
  ) {
    return (
      <span
        ref={ref}
        {...(label ? { role: "status" } : { "aria-hidden": true })}
        className={cx("nuv-spinner", `nuv-spinner--${size}`, className)}
        {...props}
      >
        <svg
          aria-hidden="true"
          className="nuv-spinner__ring"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle className="nuv-spinner__track" cx="10" cy="10" r="7.5" />
          <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" />
        </svg>
        {label ? <span className="nuv-spinner__label">{label}</span> : null}
      </span>
    );
  },
);
