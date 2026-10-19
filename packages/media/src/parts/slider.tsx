"use client";

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
} from "react";
import { useIsomorphicLayoutEffect, useLatest } from "../core/context";
import { cx } from "../utils/cx";

export interface MediaSliderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  label: string;
  /** Read on every update. */
  value: () => number;
  max: () => number;
  /** Words for the value, said by a screen reader. */
  valueText: (value: number, max: number) => string;
  /** Calls `update` whenever the value may have changed. */
  subscribe: (update: () => void) => () => void;
  /** A change from a pointer or a key. `done` is false while a drag goes on. */
  onValueChange: (value: number, done: boolean) => void;
  /** The value under a pointer that hovers, and where it is across, or null when it leaves. */
  onHover?: (value: number | null, fraction: number) => void;
  /** Draws what's inside, from the value and the max, at every update. */
  paint?: (value: number, max: number) => void;
  step: number;
  bigStep: number;
  disabled?: boolean;
  children?: ReactNode;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/**
 * A horizontal slider whose value changes without React rendering: a fill
 * fraction in a custom property, and its ARIA value, written straight to
 * the element. It runs from the inline start, so it's mirrored on a
 * right-to-left page, and the arrow keys move it where they point.
 */
export function MediaSlider({
  label,
  value,
  max,
  valueText,
  subscribe,
  onValueChange,
  onHover,
  paint,
  step,
  bigStep,
  disabled = false,
  className,
  children,
  ...props
}: MediaSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);
  const latest = useLatest({ value, max, valueText, paint, onValueChange });
  // The words are written only when they'd change, at most once a second
  // for a time, so a screen reader isn't handed a new value every frame.
  const spoken = useRef("");

  const draw = (shown: number) => {
    const element = ref.current;
    if (!element) return;
    const { max, valueText, paint } = latest.current;
    const top = Math.max(0, max());
    const at = clamp(shown, 0, top || 0);
    element.style.setProperty(
      "--nuv-media-fill",
      String(top > 0 ? at / top : 0),
    );
    element.setAttribute("aria-valuemax", String(Math.round(top)));
    element.setAttribute("aria-valuenow", String(Math.round(at)));
    const text = valueText(at, top);
    if (text !== spoken.current) {
      spoken.current = text;
      element.setAttribute("aria-valuetext", text);
    }
    paint?.(at, top);
  };

  useIsomorphicLayoutEffect(() => {
    const update = () => draw(dragging.current ?? latest.current.value());
    update();
    return subscribe(update);
  }, [subscribe]);

  const fractionAt = (clientX: number) => {
    const element = ref.current;
    if (!element) return 0;
    const box = element.getBoundingClientRect();
    const across = box.width > 0 ? (clientX - box.left) / box.width : 0;
    const rtl = getComputedStyle(element).direction === "rtl";
    return clamp(rtl ? 1 - across : across, 0, 1);
  };

  const valueAt = (clientX: number) =>
    fractionAt(clientX) * latest.current.max();

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || (event.pointerType === "mouse" && event.button !== 0))
      return;
    event.preventDefault();
    ref.current?.focus({ preventScroll: true });
    try {
      ref.current?.setPointerCapture(event.pointerId);
    } catch {
      // Not an active pointer. The drag still works while it stays over the bar.
    }
    dragging.current = valueAt(event.clientX);
    ref.current?.setAttribute("data-dragging", "");
    draw(dragging.current);
    latest.current.onValueChange(dragging.current, false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const fraction = fractionAt(event.clientX);
    const at = fraction * latest.current.max();
    if (dragging.current !== null) {
      dragging.current = at;
      draw(at);
      latest.current.onValueChange(at, false);
    }
    if (event.pointerType !== "touch" || dragging.current !== null) {
      onHover?.(at, fraction);
    }
  };

  const end = (commit: boolean) => {
    const at = dragging.current;
    dragging.current = null;
    ref.current?.removeAttribute("data-dragging");
    if (at !== null && commit) latest.current.onValueChange(at, true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const element = ref.current;
    const rtl = element ? getComputedStyle(element).direction === "rtl" : false;
    const current = latest.current.value();
    const top = latest.current.max();
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        next = current + (rtl ? -step : step);
        break;
      case "ArrowLeft":
        next = current + (rtl ? step : -step);
        break;
      case "ArrowUp":
        next = current + step;
        break;
      case "ArrowDown":
        next = current - step;
        break;
      case "PageUp":
        next = current + bigStep;
        break;
      case "PageDown":
        next = current - bigStep;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = top;
        break;
    }
    if (next === null) return;
    event.preventDefault();
    // The player's own keys don't also act on this one.
    event.stopPropagation();
    const at = clamp(next, 0, top);
    draw(at);
    latest.current.onValueChange(at, true);
  };

  return (
    <div
      {...props}
      ref={ref}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={0}
      aria-valuenow={0}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      className={cx("nuv-media-slider", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      onLostPointerCapture={() => end(true)}
      onPointerLeave={(event) => {
        if (dragging.current === null && event.pointerType !== "touch") {
          onHover?.(null, 0);
        }
      }}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
