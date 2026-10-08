"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  type ComponentRef,
  createContext,
  forwardRef,
  useContext,
} from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";

// Radix throws when a tooltip has no provider above it. This records whether
// one is there, so a tooltip used on its own can bring its own.
const InsideProvider = createContext(false);

export type TooltipProviderProps = TooltipPrimitive.TooltipProviderProps;

export function TooltipProvider(props: TooltipProviderProps) {
  return (
    <InsideProvider.Provider value={true}>
      <TooltipPrimitive.Provider {...props} />
    </InsideProvider.Provider>
  );
}

export type TooltipProps = TooltipPrimitive.TooltipProps;

export function Tooltip(props: TooltipProps) {
  const insideProvider = useContext(InsideProvider);
  const root = <TooltipPrimitive.Root {...props} />;

  if (insideProvider) return root;
  return <TooltipPrimitive.Provider>{root}</TooltipPrimitive.Provider>;
}

export type TooltipTriggerProps = TooltipPrimitive.TooltipTriggerProps;

export const TooltipTrigger = TooltipPrimitive.Trigger;

type ContentProps = PartProps<typeof TooltipPrimitive.Content>;

export interface TooltipContentOwnProps {
  /**
   * Whether to draw the small arrow that points at the trigger.
   * @default true
   */
  showArrow?: boolean;
  /**
   * The gap between the trigger and the tooltip, in pixels. With the arrow
   * shown, it's measured from the arrow's tip.
   * @default 4
   */
  sideOffset?: ContentProps["sideOffset"];
  /**
   * How close the tooltip may get to the edge of the screen, in pixels.
   * @default 8
   */
  collisionPadding?: ContentProps["collisionPadding"];
  /**
   * The element the tooltip is rendered into. Set this when the tooltip
   * should pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: TooltipPrimitive.TooltipPortalProps["container"];
}

export interface TooltipContentProps
  extends TooltipContentOwnProps,
    Omit<ContentProps, keyof TooltipContentOwnProps> {}

export const TooltipContent = forwardRef<
  ComponentRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(function TooltipContent(
  {
    showArrow = true,
    sideOffset = 4,
    collisionPadding = 8,
    container,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        ref={ref}
        className={cx("nuv-tooltip", className)}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      >
        {children}
        {showArrow ? (
          <TooltipPrimitive.Arrow
            className="nuv-tooltip__arrow"
            width={10}
            height={5}
          />
        ) : null}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
