"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export interface ToggleOwnProps {
  /**
   * `"ghost"` has no edge until it's pressed, which suits a row of them in
   * a toolbar. `"outline"` has one, for a toggle that stands alone.
   * @default "ghost"
   */
  variant?: "ghost" | "outline";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
}

export interface ToggleProps
  extends ToggleOwnProps,
    ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {}

export const Toggle = forwardRef<
  ComponentRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(function Toggle(
  { variant = "ghost", size = "md", className, ...props },
  ref,
) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cx(
        "nuv-toggle",
        `nuv-toggle--${variant}`,
        `nuv-toggle--${size}`,
        className,
      )}
      {...props}
    />
  );
});
