"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import {
  forwardRef,
  type HTMLAttributes,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { cx } from "../../utils/cx";

export interface ScrollProgressOwnProps {
  /**
   * The box whose scrolling it follows. Left out, it follows the page.
   */
  target?: RefObject<HTMLElement | null>;
  /**
   * Which scrolling it follows: `"block"` is down the page, `"inline"`
   * along the line, counted from where a line starts, in a box that reads
   * right to left too.
   * @default "block"
   */
  axis?: "block" | "inline";
  /**
   * Which way the bar runs: `"horizontal"` fills from where a line
   * starts, and `"vertical"` from the top.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

export interface ScrollProgressProps
  extends ScrollProgressOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {}

// How far through its scrolling a box is, from 0 to 1. A box with nothing
// to scroll is at the start.
function progressOf(box: Element, axis: "block" | "inline") {
  if (axis === "block") {
    const range = box.scrollHeight - box.clientHeight;
    return range > 0 ? box.scrollTop / range : 0;
  }
  const range = box.scrollWidth - box.clientWidth;
  // In a box that reads right to left, scrollLeft runs from 0 down to
  // minus the range.
  return range > 0 ? Math.abs(box.scrollLeft) / range : 0;
}

/**
 * A bar that fills as the page, or a box, is scrolled, to show how far
 * through it the reader is. It's drawn for the eye only: a screen reader
 * already knows where it is.
 */
export const ScrollProgress = forwardRef<HTMLDivElement, ScrollProgressProps>(
  function ScrollProgress(
    { target, axis = "block", orientation = "horizontal", className, ...props },
    ref,
  ) {
    const ownRef = useRef<HTMLDivElement>(null);
    const merged = useComposedRefs(ref, ownRef);

    useEffect(() => {
      const root = ownRef.current;
      const box = target ? target.current : document.scrollingElement;
      if (!root || !box) return;
      // The page scrolls on the window, not on its element.
      const source: EventTarget = target ? box : window;

      // Written straight to the element, so a scroll renders nothing in
      // React and lays nothing out again. Through the CSSOM, which a
      // strict Content Security Policy allows.
      let frame = 0;
      const update = () => {
        frame = 0;
        const value = Math.min(1, Math.max(0, progressOf(box, axis)));
        root.style.setProperty("--nuv-scroll-progress-value", String(value));
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };

      update();
      source.addEventListener("scroll", schedule, { passive: true });
      // The content can grow or shrink with no scroll at all: an image
      // that loads, a section that opens.
      const resize = new ResizeObserver(schedule);
      resize.observe(box);
      for (const child of Array.from(box.children)) resize.observe(child);
      return () => {
        cancelAnimationFrame(frame);
        source.removeEventListener("scroll", schedule);
        resize.disconnect();
      };
    }, [target, axis]);

    return (
      <div
        ref={merged}
        aria-hidden="true"
        data-orientation={orientation}
        className={cx("nuv-scroll-progress", className)}
        {...props}
      >
        <span className="nuv-scroll-progress__bar" />
      </div>
    );
  },
);
