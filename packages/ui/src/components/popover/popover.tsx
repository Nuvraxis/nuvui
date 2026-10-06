"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { useScrollRegion } from "../../utils/use-scroll-region";

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
   * Whether to draw an arrow that points at the trigger.
   * @default false
   */
  showArrow?: boolean;
  /**
   * The gap between the trigger and the popover, in pixels. With the arrow
   * shown, it's measured from the arrow's tip.
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
   * How far the arrow keeps from the panel's corners, in pixels. It stops the
   * arrow sitting on the rounded part when the trigger is near a corner.
   * @default 12
   */
  arrowPadding?: ContentProps["arrowPadding"];
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
  ComponentRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(function PopoverContent(
  {
    showArrow = false,
    sideOffset = 8,
    collisionPadding = 8,
    arrowPadding = 12,
    container,
    className,
    children,
    ...props
  },
  ref,
) {
  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const scrollRegion = useScrollRegion(body);

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        className={cx("nuv-popover", className)}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        arrowPadding={arrowPadding}
        {...props}
      >
        <div ref={setBody} className="nuv-popover__body" {...scrollRegion}>
          {children}
        </div>
        {showArrow ? (
          <span className="nuv-popover__arrow-frame">
            <PopoverPrimitive.Arrow asChild>
              {/* Drawn from one pixel inside the panel's edge. The filled
                  shape covers the panel's border where the arrow joins it,
                  and the line carries that border on around the tip. */}
              <svg
                aria-hidden="true"
                className="nuv-popover__arrow"
                viewBox="0 0 12 6"
                width="12"
                height="6"
              >
                <path d="M0 -1H12V-0.5L6 5.5L0 -0.5Z" stroke="none" />
                <path d="M0 -0.5L6 5.5L12 -0.5" fill="none" />
              </svg>
            </PopoverPrimitive.Arrow>
          </span>
        ) : null}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
