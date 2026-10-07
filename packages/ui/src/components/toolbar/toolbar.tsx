"use client";

import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type ToolbarProps = ComponentPropsWithoutRef<
  typeof ToolbarPrimitive.Root
>;

/**
 * A row of controls that is one stop for the Tab key. The arrow keys move
 * between the controls. Name it with `aria-label`.
 */
export const Toolbar = forwardRef<
  ComponentRef<typeof ToolbarPrimitive.Root>,
  ToolbarProps
>(function Toolbar({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Root
      ref={ref}
      className={cx("nuv-toolbar", className)}
      {...props}
    />
  );
});

export type ToolbarButtonProps = ComponentPropsWithoutRef<
  typeof ToolbarPrimitive.Button
>;

export const ToolbarButton = forwardRef<
  ComponentRef<typeof ToolbarPrimitive.Button>,
  ToolbarButtonProps
>(function ToolbarButton({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Button
      ref={ref}
      className={cx("nuv-toolbar__button", className)}
      {...props}
    />
  );
});

export type ToolbarLinkProps = ComponentPropsWithoutRef<
  typeof ToolbarPrimitive.Link
>;

export const ToolbarLink = forwardRef<
  ComponentRef<typeof ToolbarPrimitive.Link>,
  ToolbarLinkProps
>(function ToolbarLink({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Link
      ref={ref}
      className={cx("nuv-toolbar__link", className)}
      {...props}
    />
  );
});

export type ToolbarSeparatorProps = ComponentPropsWithoutRef<
  typeof ToolbarPrimitive.Separator
>;

/** A line between two groups of controls. Screen readers announce it. */
export const ToolbarSeparator = forwardRef<
  ComponentRef<typeof ToolbarPrimitive.Separator>,
  ToolbarSeparatorProps
>(function ToolbarSeparator({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Separator
      ref={ref}
      className={cx("nuv-toolbar__separator", className)}
      {...props}
    />
  );
});

export type ToolbarToggleGroupProps = ComponentPropsWithoutRef<
  typeof ToolbarPrimitive.ToggleGroup
>;

/**
 * Buttons that stay pressed. `type="single"` lets one be pressed at a time,
 * `type="multiple"` any number. Name the group with `aria-label`.
 */
export const ToolbarToggleGroup = forwardRef<
  ComponentRef<typeof ToolbarPrimitive.ToggleGroup>,
  ToolbarToggleGroupProps
>(function ToolbarToggleGroup({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.ToggleGroup
      ref={ref}
      className={cx("nuv-toolbar__toggle-group", className)}
      // Radix makes a group of toggles a toolbar of its own. Inside a
      // toolbar that's one within another, so here it's a plain group. A
      // group where one is picked at a time stays a radio group.
      {...(props.type === "multiple" ? { role: "group" } : null)}
      {...props}
    />
  );
});

export type ToolbarToggleItemProps = ComponentPropsWithoutRef<
  typeof ToolbarPrimitive.ToggleItem
>;

export const ToolbarToggleItem = forwardRef<
  ComponentRef<typeof ToolbarPrimitive.ToggleItem>,
  ToolbarToggleItemProps
>(function ToolbarToggleItem({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.ToggleItem
      ref={ref}
      className={cx("nuv-toolbar__toggle-item", className)}
      {...props}
    />
  );
});
