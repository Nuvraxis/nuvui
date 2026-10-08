"use client";

import * as MenuPrimitive from "@radix-ui/react-menubar";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type FunctionComponent,
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";

export type MenubarMenuProps = MenuPrimitive.MenubarMenuProps;
export type MenubarGroupProps = MenuPrimitive.MenubarGroupProps;
export type MenubarRadioGroupProps = MenuPrimitive.MenubarRadioGroupProps;
export type MenubarSubProps = MenuPrimitive.MenubarSubProps;

// Annotated, because the type Radix gives it names a package of Radix's own
// that the built type declarations couldn't point at.
export const MenubarMenu: FunctionComponent<MenubarMenuProps> =
  MenuPrimitive.Menu;
export const MenubarGroup = MenuPrimitive.Group;
export const MenubarRadioGroup = MenuPrimitive.RadioGroup;
export const MenubarSub = MenuPrimitive.Sub;

export type MenubarProps = ComponentPropsWithoutRef<typeof MenuPrimitive.Root>;

export const Menubar = forwardRef<
  ComponentRef<typeof MenuPrimitive.Root>,
  MenubarProps
>(function Menubar({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Root
      ref={ref}
      className={cx("nuv-menubar", className)}
      {...props}
    />
  );
});

export type MenubarTriggerProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Trigger
>;

export const MenubarTrigger = forwardRef<
  ComponentRef<typeof MenuPrimitive.Trigger>,
  MenubarTriggerProps
>(function MenubarTrigger({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Trigger
      ref={ref}
      className={cx("nuv-menubar__trigger", className)}
      {...props}
    />
  );
});

type ContentProps = ComponentPropsWithoutRef<typeof MenuPrimitive.Content>;
type PortalProps = MenuPrimitive.MenubarPortalProps;

export interface MenubarContentOwnProps {
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

export interface MenubarContentProps
  extends MenubarContentOwnProps,
    Omit<ContentProps, keyof MenubarContentOwnProps> {}

export const MenubarContent = forwardRef<
  ComponentRef<typeof MenuPrimitive.Content>,
  MenubarContentProps
>(function MenubarContent(
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
        className={cx("nuv-menubar__content", className)}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});

export interface MenubarItemOwnProps {
  /**
   * Use `"danger"` for an action that destroys something.
   * @default "neutral"
   */
  intent?: "neutral" | "danger";
}

export interface MenubarItemProps
  extends MenubarItemOwnProps,
    ComponentPropsWithoutRef<typeof MenuPrimitive.Item> {}

export const MenubarItem = forwardRef<
  ComponentRef<typeof MenuPrimitive.Item>,
  MenubarItemProps
>(function MenubarItem({ intent = "neutral", className, ...props }, ref) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cx(
        "nuv-menubar__item",
        intent === "danger" && "nuv-menubar__item--danger",
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
    <MenuPrimitive.ItemIndicator className="nuv-menubar__indicator">
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
        <path className="nuv-menubar__check" d="M3.5 8.5l3 3 6-7" />
        <path className="nuv-menubar__dash" d="M4 8h8" />
      </svg>
    </MenuPrimitive.ItemIndicator>
  );
}

export type MenubarCheckboxItemProps = PartProps<
  typeof MenuPrimitive.CheckboxItem
>;

export const MenubarCheckboxItem = forwardRef<
  ComponentRef<typeof MenuPrimitive.CheckboxItem>,
  MenubarCheckboxItemProps
>(function MenubarCheckboxItem({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      className={cx("nuv-menubar__item", className)}
      {...props}
    >
      {children}
      <Indicator />
    </MenuPrimitive.CheckboxItem>
  );
});

export type MenubarRadioItemProps = PartProps<typeof MenuPrimitive.RadioItem>;

export const MenubarRadioItem = forwardRef<
  ComponentRef<typeof MenuPrimitive.RadioItem>,
  MenubarRadioItemProps
>(function MenubarRadioItem({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.RadioItem
      ref={ref}
      className={cx("nuv-menubar__item", className)}
      {...props}
    >
      {children}
      <Indicator />
    </MenuPrimitive.RadioItem>
  );
});

export type MenubarLabelProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Label
>;

export const MenubarLabel = forwardRef<
  ComponentRef<typeof MenuPrimitive.Label>,
  MenubarLabelProps
>(function MenubarLabel({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Label
      ref={ref}
      className={cx("nuv-menubar__label", className)}
      {...props}
    />
  );
});

export type MenubarShortcutProps = HTMLAttributes<HTMLSpanElement>;

/**
 * The keys that do the same thing as an item, shown at the end of its row.
 * It only shows them: listening for the keys is up to you. It's hidden from
 * screen readers, so that it doesn't run into the item's name. Put the same
 * keys in `aria-keyshortcuts` on the item to have them announced.
 */
export const MenubarShortcut = forwardRef<
  HTMLSpanElement,
  MenubarShortcutProps
>(function MenubarShortcut({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-menubar__shortcut", className)}
      {...props}
    />
  );
});

export type MenubarSeparatorProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Separator
>;

export const MenubarSeparator = forwardRef<
  ComponentRef<typeof MenuPrimitive.Separator>,
  MenubarSeparatorProps
>(function MenubarSeparator({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Separator
      ref={ref}
      className={cx("nuv-menubar__separator", className)}
      {...props}
    />
  );
});

export type MenubarSubTriggerProps = PartProps<typeof MenuPrimitive.SubTrigger>;

export const MenubarSubTrigger = forwardRef<
  ComponentRef<typeof MenuPrimitive.SubTrigger>,
  MenubarSubTriggerProps
>(function MenubarSubTrigger({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.SubTrigger
      ref={ref}
      className={cx("nuv-menubar__item", className)}
      {...props}
    >
      {children}
      <svg
        aria-hidden="true"
        className="nuv-menubar__chevron"
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

export interface MenubarSubContentOwnProps {
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

export interface MenubarSubContentProps
  extends MenubarSubContentOwnProps,
    Omit<SubContentProps, keyof MenubarSubContentOwnProps> {}

export const MenubarSubContent = forwardRef<
  ComponentRef<typeof MenuPrimitive.SubContent>,
  MenubarSubContentProps
>(function MenubarSubContent(
  { collisionPadding = 8, container, className, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.SubContent
        ref={ref}
        className={cx("nuv-menubar__content", className)}
        collisionPadding={collisionPadding}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});
