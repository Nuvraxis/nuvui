"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export interface AvatarOwnProps {
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /**
   * A circle suits a person. A rounded square suits a company, a team or a
   * project.
   * @default "circle"
   */
  shape?: "circle" | "square";
}

export interface AvatarProps
  extends AvatarOwnProps,
    ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {}

export const Avatar = forwardRef<
  ComponentRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(function Avatar({ size = "md", shape = "circle", className, ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cx(
        "nuv-avatar",
        `nuv-avatar--${size}`,
        shape === "square" && "nuv-avatar--square",
        className,
      )}
      {...props}
    />
  );
});

export type AvatarImageProps = ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Image
>;

/**
 * The picture. It's only on the page once it has loaded, so a broken or slow
 * image never shows as a broken icon. Give it an `alt`.
 */
export const AvatarImage = forwardRef<
  ComponentRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cx("nuv-avatar__image", className)}
      {...props}
    />
  );
});

export type AvatarFallbackProps = ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Fallback
>;

/**
 * What shows while there's no picture: initials, or an icon. `delayMs` holds
 * it back for a moment, so that it doesn't flash before a picture that loads
 * quickly.
 */
export const AvatarFallback = forwardRef<
  ComponentRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cx("nuv-avatar__fallback", className)}
      {...props}
    />
  );
});

export type AvatarGroupProps = HTMLAttributes<HTMLDivElement>;

/**
 * A row of avatars that overlap. Each one gets a ring in the page's color,
 * so that they can be told apart.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-avatar-group", className)} {...props} />
    );
  },
);
