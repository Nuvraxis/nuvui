"use client";

import * as PasswordPrimitive from "@radix-ui/react-password-toggle-field";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  useId,
  useState,
} from "react";
import { cx } from "../../utils/cx";

type InputProps = ComponentPropsWithoutRef<typeof PasswordPrimitive.Input>;

export interface PasswordInputOwnProps {
  /** Whether the password can be read, when you control that yourself. */
  visible?: boolean;
  /**
   * Whether the password can be read at first, when you don't control it.
   * @default false
   */
  defaultVisible?: boolean;
  /** Called with the new state when the button is pressed. */
  onVisibilityChange?: (visible: boolean) => void;
  /**
   * Accessible name of the button while the password is hidden. Translate
   * it with the rest of your interface.
   * @default "Show password"
   */
  showLabel?: string;
  /**
   * Accessible name of the button while the password can be read.
   * @default "Hide password"
   */
  hideLabel?: string;
  /**
   * What the browser and password managers fill in. Use `"new-password"`
   * where someone is choosing one.
   * @default "current-password"
   */
  autoComplete?: InputProps["autoComplete"];
}

export interface PasswordInputProps
  extends PasswordInputOwnProps,
    Omit<InputProps, keyof PasswordInputOwnProps> {}

const eye =
  "M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z";

export const PasswordInput = forwardRef<
  ComponentRef<typeof PasswordPrimitive.Input>,
  PasswordInputProps
>(function PasswordInput(
  {
    visible: visibleProp,
    defaultVisible = false,
    onVisibilityChange,
    showLabel = "Show password",
    hideLabel = "Hide password",
    className,
    disabled,
    ...props
  },
  ref,
) {
  const [ownVisible, setOwnVisible] = useState(defaultVisible);
  const visible = visibleProp ?? ownVisible;
  // Radix gives the button the input's id when it has none of its own.
  const toggleId = useId();

  return (
    <PasswordPrimitive.Root
      visible={visible}
      onVisibilityChange={(next) => {
        setOwnVisible(next);
        onVisibilityChange?.(next);
      }}
    >
      {/* The class name goes on the box. Everything else is the input's. */}
      <span className={cx("nuv-password-input", className)}>
        <PasswordPrimitive.Input
          ref={ref}
          className="nuv-password-input__control"
          disabled={disabled}
          {...props}
        />
        <PasswordPrimitive.Toggle
          id={toggleId}
          className="nuv-password-input__toggle"
          aria-label={visible ? hideLabel : showLabel}
          disabled={disabled}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={eye} />
            <circle cx="8" cy="8" r="2" />
            {/* The line through the eye says pressing it hides the text. */}
            {visible ? <path d="M2.5 2.5l11 11" /> : null}
          </svg>
        </PasswordPrimitive.Toggle>
      </span>
    </PasswordPrimitive.Root>
  );
});
