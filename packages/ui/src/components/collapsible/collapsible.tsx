"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type CollapsibleProps = ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Root
>;

export const Collapsible = forwardRef<
  ComponentRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>(function Collapsible({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Root
      ref={ref}
      className={cx("nuv-collapsible", className)}
      {...props}
    />
  );
});

export type CollapsibleTriggerProps = ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Trigger
>;

/**
 * The button that shows and hides the content. It has no look of its own:
 * pass `asChild` and put a `Button` inside.
 */
export const CollapsibleTrigger = forwardRef<
  ComponentRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(function CollapsibleTrigger({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cx("nuv-collapsible__trigger", className)}
      {...props}
    />
  );
});

export type CollapsibleContentProps = ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Content
>;

export const CollapsibleContent = forwardRef<
  ComponentRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(function CollapsibleContent({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className={cx("nuv-collapsible__content", className)}
      {...props}
    />
  );
});
