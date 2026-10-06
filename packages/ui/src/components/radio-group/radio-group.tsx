"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type RadioGroupProps = ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

export const RadioGroup = forwardRef<
  ComponentRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cx("nuv-radio-group", className)}
      {...props}
    />
  );
});

export type RadioGroupItemProps = ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
>;

export const RadioGroupItem = forwardRef<
  ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cx("nuv-radio-group__item", className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="nuv-radio-group__indicator">
        {/* Drawn in the text color, so it's still there where the browser
            forces its own colors and drops backgrounds. */}
        <svg
          aria-hidden="true"
          className="nuv-radio-group__dot"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="8" cy="8" r="4" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
