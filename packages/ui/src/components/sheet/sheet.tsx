"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";
import { useScrollRegion } from "../../utils/use-scroll-region";

export type SheetProps = DialogPrimitive.DialogProps;
export type SheetTriggerProps = DialogPrimitive.DialogTriggerProps;
export type SheetCloseProps = DialogPrimitive.DialogCloseProps;

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export interface SheetContentOwnProps {
  /**
   * The edge of the screen the sheet is attached to. `"start"` is the left
   * edge in a left-to-right layout and the right edge in a right-to-left
   * one, and `"end"` is the other.
   * @default "end"
   */
  side?: "start" | "end" | "top" | "bottom";
  /**
   * How wide a sheet on the start or end edge is. It's never wider than the
   * screen. A sheet on the top or bottom edge is as wide as the screen and
   * as tall as its content, whatever the size.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to render the close button in the corner. If you turn it off,
   * give people another visible way to close the sheet.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Accessible name of the close button. Translate it with the rest of your
   * interface.
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * The element the sheet is rendered into. Set this when the sheet should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: DialogPrimitive.DialogPortalProps["container"];
}

export interface SheetContentProps
  extends SheetContentOwnProps,
    PartProps<typeof DialogPrimitive.Content> {}

export const SheetContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent(
  {
    side = "end",
    size = "md",
    showCloseButton = true,
    closeLabel = "Close",
    container,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="nuv-sheet__overlay" />
      <DialogPrimitive.Content
        ref={ref}
        className={cx(
          "nuv-sheet",
          `nuv-sheet--${side}`,
          `nuv-sheet--${size}`,
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            className="nuv-sheet__close"
            aria-label={closeLabel}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3.5 3.5l9 9m0-9l-9 9" />
            </svg>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export type SheetTitleProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
>;

export const SheetTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  SheetTitleProps
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cx("nuv-sheet__title", className)}
      {...props}
    />
  );
});

export type SheetDescriptionProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;

export const SheetDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  SheetDescriptionProps
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cx("nuv-sheet__description", className)}
      {...props}
    />
  );
});

export type SheetHeaderProps = HTMLAttributes<HTMLDivElement>;

export const SheetHeader = forwardRef<HTMLDivElement, SheetHeaderProps>(
  function SheetHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sheet__header", className)}
        {...props}
      />
    );
  },
);

export type SheetBodyProps = HTMLAttributes<HTMLDivElement>;

export const SheetBody = forwardRef<HTMLDivElement, SheetBodyProps>(
  function SheetBody({ className, ...props }, ref) {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const scrollRegion = useScrollRegion(element);

    return (
      <div
        ref={useComposedRefs(ref, setElement)}
        className={cx("nuv-sheet__body", className)}
        {...scrollRegion}
        {...props}
      />
    );
  },
);

export type SheetFooterProps = HTMLAttributes<HTMLDivElement>;

export const SheetFooter = forwardRef<HTMLDivElement, SheetFooterProps>(
  function SheetFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sheet__footer", className)}
        {...props}
      />
    );
  },
);
