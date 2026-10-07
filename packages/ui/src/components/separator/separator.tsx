"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export interface SeparatorOwnProps {
  /** @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /**
   * Whether the line is only there to look at. A decorative line is hidden
   * from screen readers. Pass `false` where the line is the only thing that
   * says one group has ended and another begun.
   * @default true
   */
  decorative?: boolean;
}

export interface SeparatorProps
  extends SeparatorOwnProps,
    Omit<
      ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
      keyof SeparatorOwnProps
    > {}

export const Separator = forwardRef<
  ComponentRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(function Separator(
  { orientation = "horizontal", decorative = true, className, ...props },
  ref,
) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cx("nuv-separator", className)}
      {...props}
    />
  );
});
