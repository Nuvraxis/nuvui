"use client";

import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  useRef,
} from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";

export interface NavigationMenuOwnProps {
  /**
   * Which edge of the menu the open panel lines up with, on screens wide
   * enough for the panel to be narrower than the menu. `"start"` is the left
   * edge in a left-to-right layout.
   * @default "start"
   */
  align?: "start" | "center" | "end";
}

export interface NavigationMenuProps
  extends NavigationMenuOwnProps,
    PartProps<typeof NavigationMenuPrimitive.Root> {}

export const NavigationMenu = forwardRef<
  ComponentRef<typeof NavigationMenuPrimitive.Root>,
  NavigationMenuProps
>(function NavigationMenu(
  { align = "start", className, children, ...props },
  ref,
) {
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cx(
        "nuv-navigation-menu",
        `nuv-navigation-menu--${align}`,
        className,
      )}
      {...props}
    >
      {children}
      {/* Every item's content is shown in this one panel, so it can change
          size and stay in place as the pointer moves along the list. */}
      <div className="nuv-navigation-menu__frame">
        <NavigationMenuPrimitive.Viewport className="nuv-navigation-menu__viewport" />
      </div>
    </NavigationMenuPrimitive.Root>
  );
});

export type NavigationMenuListProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.List
>;

export const NavigationMenuList = forwardRef<
  ComponentRef<typeof NavigationMenuPrimitive.List>,
  NavigationMenuListProps
>(function NavigationMenuList({ className, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cx("nuv-navigation-menu__list", className)}
      {...props}
    />
  );
});

export type NavigationMenuItemProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Item
>;

export const NavigationMenuItem = forwardRef<
  ComponentRef<typeof NavigationMenuPrimitive.Item>,
  NavigationMenuItemProps
>(function NavigationMenuItem({ className, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Item
      ref={ref}
      className={cx("nuv-navigation-menu__item", className)}
      {...props}
    />
  );
});

export type NavigationMenuTriggerProps = PartProps<
  typeof NavigationMenuPrimitive.Trigger
>;

export const NavigationMenuTrigger = forwardRef<
  ComponentRef<typeof NavigationMenuPrimitive.Trigger>,
  NavigationMenuTriggerProps
>(function NavigationMenuTrigger(
  { className, children, onPointerEnter, onClick, ...props },
  ref,
) {
  // Whether the panel that's open now was opened by a press on this button.
  const pressedOpen = useRef(false);

  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cx("nuv-navigation-menu__trigger", className)}
      {...props}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        // Closed as the pointer arrives, so whatever opened it before no
        // longer counts.
        if (event.currentTarget.dataset.state !== "open") {
          pressedOpen.current = false;
        }
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (event.currentTarget.dataset.state !== "open") {
          pressedOpen.current = true;
          return;
        }
        if (pressedOpen.current) {
          pressedOpen.current = false;
          return;
        }
        // The panel is open because the pointer came to rest here. Radix
        // closes it on a click all the same, so someone who points and
        // then clicks sees it open and shut. Radix leaves a click alone
        // once it's been prevented, which keeps the panel open. The click
        // after this one closes it.
        event.preventDefault();
        pressedOpen.current = true;
      }}
    >
      {children}
      <svg
        aria-hidden="true"
        className="nuv-navigation-menu__chevron"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </NavigationMenuPrimitive.Trigger>
  );
});

export type NavigationMenuContentProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Content
>;

export const NavigationMenuContent = forwardRef<
  ComponentRef<typeof NavigationMenuPrimitive.Content>,
  NavigationMenuContentProps
>(function NavigationMenuContent({ className, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cx("nuv-navigation-menu__content", className)}
      {...props}
    />
  );
});

export type NavigationMenuLinkProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Link
>;

export const NavigationMenuLink = forwardRef<
  ComponentRef<typeof NavigationMenuPrimitive.Link>,
  NavigationMenuLinkProps
>(function NavigationMenuLink({ className, ...props }, ref) {
  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      className={cx("nuv-navigation-menu__link", className)}
      {...props}
    />
  );
});
