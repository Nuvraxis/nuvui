"use client";

import * as MenuPrimitive from "@radix-ui/react-context-menu";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";

export type ContextMenuProps = MenuPrimitive.ContextMenuProps;
export type ContextMenuTriggerProps = MenuPrimitive.ContextMenuTriggerProps;
export type ContextMenuGroupProps = MenuPrimitive.ContextMenuGroupProps;
export type ContextMenuRadioGroupProps =
  MenuPrimitive.ContextMenuRadioGroupProps;
export type ContextMenuSubProps = MenuPrimitive.ContextMenuSubProps;

export const ContextMenu = MenuPrimitive.Root;
export const ContextMenuTrigger = MenuPrimitive.Trigger;
export const ContextMenuGroup = MenuPrimitive.Group;
export const ContextMenuRadioGroup = MenuPrimitive.RadioGroup;
export const ContextMenuSub = MenuPrimitive.Sub;

type ContentProps = ComponentPropsWithoutRef<typeof MenuPrimitive.Content>;
type PortalProps = MenuPrimitive.ContextMenuPortalProps;

export interface ContextMenuContentOwnProps {
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

export interface ContextMenuContentProps
  extends ContextMenuContentOwnProps,
    Omit<ContentProps, keyof ContextMenuContentOwnProps> {}

export const ContextMenuContent = forwardRef<
  ComponentRef<typeof MenuPrimitive.Content>,
  ContextMenuContentProps
>(function ContextMenuContent(
  { collisionPadding = 8, container, className, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Content
        ref={ref}
        className={cx("nuv-context-menu", className)}
        collisionPadding={collisionPadding}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});

export interface ContextMenuItemOwnProps {
  /**
   * Use `"danger"` for an action that destroys something.
   * @default "neutral"
   */
  intent?: "neutral" | "danger";
}

export interface ContextMenuItemProps
  extends ContextMenuItemOwnProps,
    ComponentPropsWithoutRef<typeof MenuPrimitive.Item> {}

export const ContextMenuItem = forwardRef<
  ComponentRef<typeof MenuPrimitive.Item>,
  ContextMenuItemProps
>(function ContextMenuItem({ intent = "neutral", className, ...props }, ref) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cx(
        "nuv-context-menu__item",
        intent === "danger" && "nuv-context-menu__item--danger",
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
    <MenuPrimitive.ItemIndicator className="nuv-context-menu__indicator">
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
        <path className="nuv-context-menu__check" d="M3.5 8.5l3 3 6-7" />
        <path className="nuv-context-menu__dash" d="M4 8h8" />
      </svg>
    </MenuPrimitive.ItemIndicator>
  );
}

export type ContextMenuCheckboxItemProps = PartProps<
  typeof MenuPrimitive.CheckboxItem
>;

export const ContextMenuCheckboxItem = forwardRef<
  ComponentRef<typeof MenuPrimitive.CheckboxItem>,
  ContextMenuCheckboxItemProps
>(function ContextMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      className={cx("nuv-context-menu__item", className)}
      {...props}
    >
      {children}
      <Indicator />
    </MenuPrimitive.CheckboxItem>
  );
});

export type ContextMenuRadioItemProps = PartProps<
  typeof MenuPrimitive.RadioItem
>;

export const ContextMenuRadioItem = forwardRef<
  ComponentRef<typeof MenuPrimitive.RadioItem>,
  ContextMenuRadioItemProps
>(function ContextMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.RadioItem
      ref={ref}
      className={cx("nuv-context-menu__item", className)}
      {...props}
    >
      {children}
      <Indicator />
    </MenuPrimitive.RadioItem>
  );
});

export type ContextMenuLabelProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Label
>;

export const ContextMenuLabel = forwardRef<
  ComponentRef<typeof MenuPrimitive.Label>,
  ContextMenuLabelProps
>(function ContextMenuLabel({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Label
      ref={ref}
      className={cx("nuv-context-menu__label", className)}
      {...props}
    />
  );
});

export type ContextMenuShortcutProps = HTMLAttributes<HTMLSpanElement>;

/**
 * The keys that do the same thing as an item, shown at the end of its row.
 * It only shows them: listening for the keys is up to you. It's hidden from
 * screen readers, so that it doesn't run into the item's name. Put the same
 * keys in `aria-keyshortcuts` on the item to have them announced.
 */
export const ContextMenuShortcut = forwardRef<
  HTMLSpanElement,
  ContextMenuShortcutProps
>(function ContextMenuShortcut({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-context-menu__shortcut", className)}
      {...props}
    />
  );
});

export type ContextMenuSeparatorProps = ComponentPropsWithoutRef<
  typeof MenuPrimitive.Separator
>;

export const ContextMenuSeparator = forwardRef<
  ComponentRef<typeof MenuPrimitive.Separator>,
  ContextMenuSeparatorProps
>(function ContextMenuSeparator({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Separator
      ref={ref}
      className={cx("nuv-context-menu__separator", className)}
      {...props}
    />
  );
});

export type ContextMenuSubTriggerProps = PartProps<
  typeof MenuPrimitive.SubTrigger
>;

export const ContextMenuSubTrigger = forwardRef<
  ComponentRef<typeof MenuPrimitive.SubTrigger>,
  ContextMenuSubTriggerProps
>(function ContextMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <MenuPrimitive.SubTrigger
      ref={ref}
      className={cx("nuv-context-menu__item", className)}
      {...props}
    >
      {children}
      <svg
        aria-hidden="true"
        className="nuv-context-menu__chevron"
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

export interface ContextMenuSubContentOwnProps {
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

export interface ContextMenuSubContentProps
  extends ContextMenuSubContentOwnProps,
    Omit<SubContentProps, keyof ContextMenuSubContentOwnProps> {}

export const ContextMenuSubContent = forwardRef<
  ComponentRef<typeof MenuPrimitive.SubContent>,
  ContextMenuSubContentProps
>(function ContextMenuSubContent(
  { collisionPadding = 8, container, className, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.SubContent
        ref={ref}
        className={cx("nuv-context-menu", className)}
        collisionPadding={collisionPadding}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});
