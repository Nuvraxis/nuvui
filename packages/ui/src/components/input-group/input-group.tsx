"use client";

import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type PointerEvent,
} from "react";
import { cx } from "../../utils/cx";

export type InputGroupProps = HTMLAttributes<HTMLDivElement>;

// Whatever does something of its own when it's pressed.
const interactive = "button, a, input, select, textarea, label";

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup({ className, onPointerDown, ...props }, ref) {
    // The whole box reads as the field, so a press on the text or icon next
    // to the input puts the cursor in it.
    function focusInput(event: PointerEvent<HTMLDivElement>) {
      onPointerDown?.(event);
      if (event.defaultPrevented) return;
      if ((event.target as Element).closest(interactive)) return;

      const input = event.currentTarget.querySelector<HTMLElement>(
        "input:not(:disabled), textarea:not(:disabled)",
      );
      if (!input) return;
      // Otherwise the press takes focus away again as it finishes.
      event.preventDefault();
      input.focus();
    }

    return (
      <div
        ref={ref}
        className={cx("nuv-input-group", className)}
        onPointerDown={focusInput}
        {...props}
      />
    );
  },
);

export type InputGroupAddonProps = HTMLAttributes<HTMLDivElement>;

export const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
  function InputGroupAddon({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-input-group__addon", className)}
        {...props}
      />
    );
  },
);

export type InputGroupButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const InputGroupButton = forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(function InputGroupButton({ className, type, ...props }, ref) {
  return (
    <button
      ref={ref}
      // The HTML default is "submit", which fires a surrounding form.
      type={type ?? "button"}
      className={cx("nuv-input-group__button", className)}
      {...props}
    />
  );
});
