"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export const Label = forwardRef<
  ComponentRef<typeof LabelPrimitive.Root>,
  LabelProps
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cx("nuv-label", className)}
      {...props}
    />
  );
});
