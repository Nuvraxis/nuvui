"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import { Button, type ButtonProps } from "../button/button";

export type AlertDialogProps = AlertDialogPrimitive.AlertDialogProps;
export type AlertDialogTriggerProps =
  AlertDialogPrimitive.AlertDialogTriggerProps;

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export interface AlertDialogContentOwnProps {
  /**
   * The widest the dialog gets once the screen is big enough to center it.
   * On a phone it's always a full-width sheet.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * The element the dialog is rendered into. Set this when the dialog should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: AlertDialogPrimitive.AlertDialogPortalProps["container"];
}

export interface AlertDialogContentProps
  extends AlertDialogContentOwnProps,
    ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {}

export const AlertDialogContent = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(function AlertDialogContent(
  { size = "md", container, className, ...props },
  ref,
) {
  return (
    <AlertDialogPrimitive.Portal container={container}>
      <AlertDialogPrimitive.Overlay className="nuv-alert-dialog__overlay" />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cx(
          "nuv-alert-dialog",
          `nuv-alert-dialog--${size}`,
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
});

export type AlertDialogTitleProps = ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Title
>;

export const AlertDialogTitle = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Title>,
  AlertDialogTitleProps
>(function AlertDialogTitle({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cx("nuv-alert-dialog__title", className)}
      {...props}
    />
  );
});

export type AlertDialogDescriptionProps = ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Description
>;

export const AlertDialogDescription = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Description>,
  AlertDialogDescriptionProps
>(function AlertDialogDescription({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cx("nuv-alert-dialog__description", className)}
      {...props}
    />
  );
});

export type AlertDialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const AlertDialogFooter = forwardRef<
  HTMLDivElement,
  AlertDialogFooterProps
>(function AlertDialogFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-alert-dialog__footer", className)}
      {...props}
    />
  );
});

// The two buttons are the library's Button, so they take its props. Radix's
// part goes around it and adds the closing. onClick goes to Radix's part,
// which leaves the dialog open when the handler calls preventDefault.

export type AlertDialogActionProps = ButtonProps;

export const AlertDialogAction = forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>(function AlertDialogAction({ onClick, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Action asChild onClick={onClick}>
      <Button ref={ref} {...props} />
    </AlertDialogPrimitive.Action>
  );
});

export type AlertDialogCancelProps = ButtonProps;

export const AlertDialogCancel = forwardRef<
  HTMLButtonElement,
  AlertDialogCancelProps
>(function AlertDialogCancel({ intent = "secondary", onClick, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Cancel asChild onClick={onClick}>
      <Button ref={ref} intent={intent} {...props} />
    </AlertDialogPrimitive.Cancel>
  );
});
