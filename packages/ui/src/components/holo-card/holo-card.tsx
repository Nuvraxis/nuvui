"use client";

import { forwardRef, type HTMLAttributes, type PointerEvent } from "react";
import { cx } from "../../utils/cx";

export interface HoloCardOwnProps {
  /**
   * Whether a shine is drawn across it under the pointer.
   * @default true
   */
  shine?: boolean;
  /**
   * It lies flat and doesn't follow the pointer.
   * @default false
   */
  disabled?: boolean;
}

export interface HoloCardProps
  extends HoloCardOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof HoloCardOwnProps> {}

const x = "--nuv-holo-card-pointer-x";
const y = "--nuv-holo-card-pointer-y";

const between = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A card that tilts toward the pointer, with a shine that follows it. It's
 * decoration: what's in it is ordinary content, and it lies flat for a
 * finger, for the keyboard and for a visitor who asked for less motion.
 */
export const HoloCard = forwardRef<HTMLDivElement, HoloCardProps>(
  function HoloCard(
    {
      shine = true,
      disabled = false,
      className,
      children,
      onPointerMove,
      onPointerLeave,
      onPointerCancel,
      ...props
    },
    ref,
  ) {
    // Where the pointer is goes straight to the element as two numbers
    // from 0 to 1, and the stylesheet does the rest. Nothing is drawn
    // again by React as the pointer moves.
    function follow(event: PointerEvent<HTMLDivElement>) {
      onPointerMove?.(event);
      // A finger on a card is on its way to scroll the page.
      if (disabled || event.pointerType === "touch") return;
      const card = event.currentTarget;
      const box = card.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      card.style.setProperty(
        x,
        between((event.clientX - box.left) / box.width).toFixed(3),
      );
      card.style.setProperty(
        y,
        between((event.clientY - box.top) / box.height).toFixed(3),
      );
      card.dataset.active = "";
    }

    function rest(card: HTMLDivElement) {
      card.style.removeProperty(x);
      card.style.removeProperty(y);
      delete card.dataset.active;
    }

    return (
      <div
        ref={ref}
        data-disabled={disabled ? "" : undefined}
        className={cx("nuv-holo-card", className)}
        onPointerMove={follow}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          rest(event.currentTarget);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          rest(event.currentTarget);
        }}
        {...props}
      >
        <div className="nuv-holo-card__surface">
          {children}
          {shine ? (
            <span aria-hidden="true" className="nuv-holo-card__shine" />
          ) : null}
        </div>
      </div>
    );
  },
);
