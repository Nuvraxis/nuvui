"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type SelectProps = SelectPrimitive.SelectProps;
export type SelectGroupProps = SelectPrimitive.SelectGroupProps;

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;

function Chevron({ d }: { d: string }) {
  return (
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
      <path d={d} />
    </svg>
  );
}

const down = "M4 6l4 4 4-4";
const up = "M4 10l4-4 4 4";

export type SelectTriggerProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
>;

export const SelectTrigger = forwardRef<
  ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(function SelectTrigger({ className, children, ...props }, ref) {
  // Field passes `required` to whatever control it holds. On a select it
  // belongs on Select, where the form value lives, and a button has no such
  // attribute.
  const { required: _required, ...triggerProps } = props as typeof props & {
    required?: boolean;
  };

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cx("nuv-select", className)}
      {...triggerProps}
    >
      {children}
      <SelectPrimitive.Icon className="nuv-select__icon">
        <Chevron d={down} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export type SelectValueProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Value
>;

export const SelectValue = forwardRef<
  ComponentRef<typeof SelectPrimitive.Value>,
  SelectValueProps
>(function SelectValue({ className, ...props }, ref) {
  return (
    // Radix ignores className on its Value part, because it measures that
    // element to line the list up. The wrapper is what cuts long text short.
    <span className={cx("nuv-select__value", className)}>
      <SelectPrimitive.Value ref={ref} {...props} />
    </span>
  );
});

type ContentProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

export interface SelectContentOwnProps {
  /**
   * `"popper"` opens the list under the trigger, like a menu.
   * `"item-aligned"` lays it over the trigger with the selected option on
   * top of it, the way a native select does on a Mac.
   * @default "popper"
   */
  position?: ContentProps["position"];
  /**
   * The gap between the trigger and the list, in pixels. Only applies with
   * `position="popper"`.
   * @default 6
   */
  sideOffset?: ContentProps["sideOffset"];
  /**
   * How close the list may get to the edge of the screen, in pixels. Only
   * applies with `position="popper"`.
   * @default 8
   */
  collisionPadding?: ContentProps["collisionPadding"];
  /**
   * The element the list is rendered into. Set this when the list should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: SelectPrimitive.SelectPortalProps["container"];
}

export interface SelectContentProps
  extends SelectContentOwnProps,
    Omit<ContentProps, keyof SelectContentOwnProps> {}

export const SelectContent = forwardRef<
  ComponentRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(function SelectContent(
  {
    position = "popper",
    sideOffset = 6,
    collisionPadding = 8,
    container,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        ref={ref}
        className={cx("nuv-select__content", className)}
        position={position}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      >
        {/* Radix hides the list's scrollbar. These two show that there's
            more above or below, and scroll while the pointer is on them. */}
        <SelectPrimitive.ScrollUpButton className="nuv-select__scroll-button">
          <Chevron d={up} />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="nuv-select__viewport">
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="nuv-select__scroll-button">
          <Chevron d={down} />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export type SelectItemProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Item
>;

export const SelectItem = forwardRef<
  ComponentRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cx("nuv-select__item", className)}
      {...props}
    >
      {/* ItemText is the part Radix copies into the trigger once the option
          is chosen, so the check mark has to stay outside it. */}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="nuv-select__indicator">
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
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

export type SelectLabelProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Label
>;

export const SelectLabel = forwardRef<
  ComponentRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cx("nuv-select__label", className)}
      {...props}
    />
  );
});

export type SelectSeparatorProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Separator
>;

export const SelectSeparator = forwardRef<
  ComponentRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cx("nuv-select__separator", className)}
      {...props}
    />
  );
});
