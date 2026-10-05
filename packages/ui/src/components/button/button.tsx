import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "../../utils/cx";

export interface ButtonOwnProps {
  /**
   * How much visual weight the button carries. Use `primary` for the main
   * action in a view, and `danger` for actions that destroy something.
   * @default "primary"
   */
  intent?: "primary" | "secondary" | "ghost" | "danger";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /**
   * Render the single child element instead of a `button`, and give it the
   * button's classes and props. This is how you make a link look like a
   * button.
   * @default false
   */
  asChild?: boolean;
}

export interface ButtonProps
  extends ButtonOwnProps,
    ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      intent = "primary",
      size = "md",
      asChild = false,
      className,
      type,
      disabled,
      ...props
    },
    ref,
  ) {
    const classes = cx(
      "nuv-button",
      `nuv-button--${intent}`,
      `nuv-button--${size}`,
      className,
    );

    if (asChild) {
      // The child might be a link, which has no `disabled` attribute. Say it
      // with ARIA and take it out of the tab order instead.
      return (
        <Slot
          ref={ref}
          className={classes}
          data-disabled={disabled ? "" : undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          {...props}
        />
      );
    }

    return (
      <button
        ref={ref}
        // The HTML default is "submit", which fires a surrounding form.
        type={type ?? "button"}
        className={classes}
        disabled={disabled}
        data-disabled={disabled ? "" : undefined}
        {...props}
      />
    );
  },
);
