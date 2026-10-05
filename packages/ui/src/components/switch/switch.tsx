"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cx("nuv-switch", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="nuv-switch__thumb" />
    </SwitchPrimitive.Root>
  );
});
