"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type PopoverProps = PopoverPrimitive.PopoverProps;
export type PopoverTriggerProps = PopoverPrimitive.PopoverTriggerProps;
export type PopoverAnchorProps = PopoverPrimitive.PopoverAnchorProps;
export type PopoverCloseProps = PopoverPrimitive.PopoverCloseProps;

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

type ContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

export interface PopoverContentOwnProps {
  /**
   * The gap between the trigger and the popover, in pixels.
   * @default 8
   */
  sideOffset?: ContentProps["sideOffset"];
  /**
   * How close the popover may get to the edge of the screen, in pixels. It
   * moves or flips to keep this much room.
   * @default 8
   */
  collisionPadding?: ContentProps["collisionPadding"];
  /**
   * The element the popover is rendered into. Set this when the popover
   * should pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: PopoverPrimitive.PopoverPortalProps["container"];
}

export interface PopoverContentProps
  extends PopoverContentOwnProps,
    Omit<ContentProps, keyof PopoverContentOwnProps> {}

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(function PopoverContent(
  { sideOffset = 8, collisionPadding = 8, container, className, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        className={cx("nuv-popover", className)}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
