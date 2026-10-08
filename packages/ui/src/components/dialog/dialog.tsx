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

export type DialogProps = DialogPrimitive.DialogProps;
export type DialogTriggerProps = DialogPrimitive.DialogTriggerProps;
export type DialogCloseProps = DialogPrimitive.DialogCloseProps;

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentOwnProps {
  /**
   * The widest the dialog gets once the screen is big enough to center it.
   * On a phone it's always a full-width sheet.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to render the close button in the corner. If you turn it off,
   * give people another visible way to close the dialog.
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
   * The element the dialog is rendered into. Set this when the dialog should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: DialogPrimitive.DialogPortalProps["container"];
}

export interface DialogContentProps
  extends DialogContentOwnProps,
    PartProps<typeof DialogPrimitive.Content> {}

export const DialogContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  {
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
      <DialogPrimitive.Overlay className="nuv-dialog__overlay" />
      <DialogPrimitive.Content
        ref={ref}
        className={cx("nuv-dialog", `nuv-dialog--${size}`, className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            className="nuv-dialog__close"
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

export type DialogTitleProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
>;

export const DialogTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cx("nuv-dialog__title", className)}
      {...props}
    />
  );
});

export type DialogDescriptionProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;

export const DialogDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cx("nuv-dialog__description", className)}
      {...props}
    />
  );
});

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  function DialogHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-dialog__header", className)}
        {...props}
      />
    );
  },
);

export type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  function DialogBody({ className, ...props }, ref) {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const scrollRegion = useScrollRegion(element);

    return (
      <div
        ref={useComposedRefs(ref, setElement)}
        className={cx("nuv-dialog__body", className)}
        {...scrollRegion}
        {...props}
      />
    );
  },
);

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  function DialogFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-dialog__footer", className)}
        {...props}
      />
    );
  },
);
