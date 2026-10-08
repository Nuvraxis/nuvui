"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { type ComponentRef, forwardRef, type Ref, useState } from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";
import { useScrollRegion } from "../../utils/use-scroll-region";

export interface ScrollAreaOwnProps {
  /**
   * Which way the content scrolls.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal" | "both";
  /**
   * When the scrollbar shows. `"auto"` shows it whenever there's more
   * content than fits, `"always"` even when there isn't, `"scroll"` only
   * while scrolling, and `"hover"` while scrolling or under the pointer.
   * @default "auto"
   */
  type?: "auto" | "always" | "scroll" | "hover";
  /**
   * A ref to the element that scrolls, for reading or setting its scroll
   * position. The component's own `ref` is the box around it.
   */
  viewportRef?: Ref<HTMLDivElement>;
  /**
   * Hiding the browser's own scrollbar takes a `style` element. A page with
   * a content security policy that asks for a nonce passes it here.
   */
  nonce?: string;
}

export interface ScrollAreaProps
  extends ScrollAreaOwnProps,
    Omit<
      PartProps<typeof ScrollAreaPrimitive.Root>,
      keyof ScrollAreaOwnProps
    > {}

/**
 * A box that scrolls, with a scrollbar drawn the same in every browser.
 * Scrolling itself is still the browser's own. Give it a height, and an
 * `aria-label` that says what's in it.
 */
export const ScrollArea = forwardRef<
  ComponentRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(function ScrollArea(
  {
    orientation = "vertical",
    type = "auto",
    viewportRef,
    nonce,
    className,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
  },
  ref,
) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const viewportRefs = useComposedRefs(viewportRef, setViewport);
  // A tab stop while the content scrolls and holds nothing that takes focus.
  // That's when the name is needed too, and a name on a box with no role
  // isn't valid, so it's only passed on with the role. Inside a dialog the
  // hook borrows the dialog's name, which a name given here replaces.
  const region = useScrollRegion(viewport);
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      type={type}
      className={cx("nuv-scroll-area", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRefs}
        nonce={nonce}
        disableImplicitContentElement
        className="nuv-scroll-area__viewport"
        {...region}
        {...(region.tabIndex === 0 && named
          ? { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy }
          : null)}
      >
        <ScrollAreaPrimitive.Content
          // Radix lays the content out as a table, which is as wide as its
          // longest line. That's what scrolling sideways needs, and it's
          // what stops text from wrapping when it shouldn't scroll sideways.
          style={horizontal ? undefined : { display: "block" }}
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      {vertical ? (
        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="nuv-scroll-area__scrollbar"
        >
          <ScrollAreaPrimitive.Thumb className="nuv-scroll-area__thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {horizontal ? (
        <ScrollAreaPrimitive.Scrollbar
          orientation="horizontal"
          className="nuv-scroll-area__scrollbar"
        >
          <ScrollAreaPrimitive.Thumb className="nuv-scroll-area__thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {vertical && horizontal ? (
        <ScrollAreaPrimitive.Corner className="nuv-scroll-area__corner" />
      ) : null}
    </ScrollAreaPrimitive.Root>
  );
});
