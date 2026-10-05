"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type CheckboxProps = ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
>;

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cx("nuv-checkbox", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="nuv-checkbox__indicator">
        {/* Both marks are always here. The stylesheet shows the one that
            matches data-state, so there's no state to read in JS. */}
        <svg
          aria-hidden="true"
          className="nuv-checkbox__icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="nuv-checkbox__check" d="M3.5 8.5l3 3 6-7" />
          <path className="nuv-checkbox__dash" d="M4 8h8" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
