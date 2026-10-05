"use client";

import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type DropdownMenuProps = MenuPrimitive.DropdownMenuProps;
export type DropdownMenuTriggerProps = MenuPrimitive.DropdownMenuTriggerProps;
export type DropdownMenuGroupProps = MenuPrimitive.DropdownMenuGroupProps;
export type DropdownMenuRadioGroupProps =
  MenuPrimitive.DropdownMenuRadioGroupProps;
export type DropdownMenuSubProps = MenuPrimitive.DropdownMenuSubProps;

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;
export const DropdownMenuSub = MenuPrimitive.Sub;

type ContentProps = ComponentPropsWithoutRef<typeof MenuPrimitive.Content>;
type PortalProps = MenuPrimitive.DropdownMenuPortalProps;

export interface DropdownMenuContentOwnProps {
  /**
   * Which edge of the trigger the menu lines up with.
   * @default "start"
   */
  align?: ContentProps["align"];
  /**
   * The gap between the trigger and the menu, in pixels.
   * @default 6
   */
  sideOffset?: ContentProps["sideOffset"];
  /**
   * How close the menu may get to the edge of the screen, in pixels. It moves
   * or flips to keep this much room.
   * @default 8
   */
  collisionPadding?: ContentProps["collisionPadding"];
  /**
   * The element the menu is rendered into. Set this when the menu should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: PortalProps["container"];
}

export interface DropdownMenuContentProps
  extends DropdownMenuContentOwnProps,
    Omit<ContentProps, keyof DropdownMenuContentOwnProps> {}

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof MenuPrimitive.Content>,
  DropdownMenuContentProps
>(function DropdownMenuContent(
  {
    align = "start",
    sideOffset = 6,
    collisionPadding = 8,
    container,
    className,
    ...props
  },
  ref,
) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Content
        ref={ref}
        className={cx("nuv-dropdown-menu", className)}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});

export interface DropdownMenuItemOwnProps {
  /**
   * Use `"danger"` for an action that destroys something.
   * @default "default"
   */
  intent?: "default" | "danger";
}

export interface DropdownMenuItemProps
  extends DropdownMenuItemOwnProps,
    ComponentPropsWithoutRef<typeof MenuPrimitive.Item> {}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof MenuPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem({ intent = "default", className, ...props }, ref) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cx(
        "nuv-dropdown-menu__item",
        intent === "danger" && "nuv-dropdown-menu__item--danger",
        className,
      )}
      {...props}
    />
  );
});

// Both marks are always here. The stylesheet shows the one that matches
// data-state, as in Checkbox.
function Indicator() {
  return (
    <MenuPrimitive.ItemIndicator className="nuv-dropdown-menu__indicator">
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
        <path className="nuv-dropdown-menu__check" d="M3.5 8.5l3 3 6-7" />
        <path className="nuv-dropdown-menu__dash" d="M4 8h8" />
      </svg>
    </MenuPrimitive.ItemIndicator>
  );
}

export type DropdownMenuCheckboxItemProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.CheckboxItem
>;

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof MenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      className={cx("nuv-dropdown-menu__item", className)}
      {...props}
    >
      {children}
      <Indicator />
    </MenuPrimitive.CheckboxItem>
  );
});

export type DropdownMenuRadioItemProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.RadioItem
>;

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof MenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.RadioItem
      ref={ref}
      className={cx("nuv-dropdown-menu__item", className)}
      {...props}
    >
      {children}
      <Indicator />
    </MenuPrimitive.RadioItem>
  );
});

export type DropdownMenuLabelProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Label
>;

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof MenuPrimitive.Label>,
  DropdownMenuLabelProps
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Label
      ref={ref}
      className={cx("nuv-dropdown-menu__label", className)}
      {...props}
    />
  );
});

export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Separator
>;

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof MenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Separator
      ref={ref}
      className={cx("nuv-dropdown-menu__separator", className)}
      {...props}
    />
  );
});

export type DropdownMenuSubTriggerProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.SubTrigger
>;

export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof MenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.SubTrigger
      ref={ref}
      className={cx("nuv-dropdown-menu__item", className)}
      {...props}
    >
      {children}
      <svg
        aria-hidden="true"
        className="nuv-dropdown-menu__chevron"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4l4 4-4 4" />
      </svg>
    </MenuPrimitive.SubTrigger>
  );
});

type SubContentProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.SubContent
>;

export interface DropdownMenuSubContentOwnProps {
  /**
   * How close the submenu may get to the edge of the screen, in pixels.
   * @default 8
   */
  collisionPadding?: SubContentProps["collisionPadding"];
  /**
   * The element the submenu is rendered into. Pass the same one as the
   * menu's.
   * @default document.body
   */
  container?: PortalProps["container"];
}

export interface DropdownMenuSubContentProps
  extends DropdownMenuSubContentOwnProps,
    Omit<SubContentProps, keyof DropdownMenuSubContentOwnProps> {}

export const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof MenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(function DropdownMenuSubContent(
  { collisionPadding = 8, container, className, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.SubContent
        ref={ref}
        className={cx("nuv-dropdown-menu", className)}
        collisionPadding={collisionPadding}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});
