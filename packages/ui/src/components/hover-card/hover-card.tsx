"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type HoverCardProps = HoverCardPrimitive.HoverCardProps;

export const HoverCard = HoverCardPrimitive.Root;

export type HoverCardTriggerProps = ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Trigger
>;

export const HoverCardTrigger = forwardRef<
  ComponentRef<typeof HoverCardPrimitive.Trigger>,
  HoverCardTriggerProps
>(function HoverCardTrigger({ onTouchStart, ...props }, ref) {
  return (
    <HoverCardPrimitive.Trigger
      ref={ref}
      {...props}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        // Radix calls preventDefault on this event. React listens for it
        // passively, where that call can't prevent anything and makes
        // Chrome log an error on every tap. Radix leaves an event alone
        // once it reads as prevented, so this says that it is. The link
        // is still followed, as it was before.
        try {
          (event as { defaultPrevented: boolean }).defaultPrevented = true;
        } catch {
          // The field can't be set. Radix makes its call, as it would have.
        }
      }}
    />
  );
});

type ContentProps = ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>;

export interface HoverCardContentOwnProps {
  /**
   * The gap between the trigger and the card, in pixels.
   * @default 8
   */
  sideOffset?: ContentProps["sideOffset"];
  /**
   * How close the card may get to the edge of the screen, in pixels. It
   * moves or flips to keep this much room.
   * @default 8
   */
  collisionPadding?: ContentProps["collisionPadding"];
  /**
   * The element the card is rendered into. Set this when the card should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: HoverCardPrimitive.HoverCardPortalProps["container"];
}

export interface HoverCardContentProps
  extends HoverCardContentOwnProps,
    Omit<ContentProps, keyof HoverCardContentOwnProps> {}

export const HoverCardContent = forwardRef<
  ComponentRef<typeof HoverCardPrimitive.Content>,
  HoverCardContentProps
>(function HoverCardContent(
  { sideOffset = 8, collisionPadding = 8, container, className, ...props },
  ref,
) {
  return (
    <HoverCardPrimitive.Portal container={container}>
      <HoverCardPrimitive.Content
        ref={ref}
        className={cx("nuv-hover-card", className)}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
});
