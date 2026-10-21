"use client";

import { forwardRef, useCallback, useEffect, useRef } from "react";
import {
  type BackgroundOwnProps,
  type BackgroundRootProps,
  backgroundRoot,
  Scrim,
} from "../../core/root";
import { assignRef } from "../../utils/ref";

export interface GridBackgroundOwnProps extends BackgroundOwnProps {
  /** Lines between the cells, or a dot where they cross. */
  variant?: "lines" | "dots";
  /** Whether it lights up under the pointer. */
  interactive?: boolean;
  /** Whether the grid fades out toward the edges. */
  fade?: boolean;
}

export interface GridBackgroundProps
  extends GridBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * A grid of lines or dots that fades out from the middle, with a soft
 * light under the pointer that lights the lines near it. The grid is drawn
 * in CSS, and only the light needs a script.
 */
export const GridBackground = forwardRef<HTMLDivElement, GridBackgroundProps>(
  function GridBackground(
    {
      children,
      scrim = "none",
      variant = "lines",
      interactive = true,
      fade = true,
      className,
      ...props
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const setRoot = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    useEffect(() => {
      const root = rootRef.current;
      if (!root || !interactive) return;
      // Where the light is, set from script once a frame at most. A script
      // may set a style where a Content Security Policy forbids a style
      // attribute.
      let frame = 0;
      let at: { x: number; y: number } | null = null;
      const show = () => {
        frame = 0;
        if (!at) {
          delete root.dataset.lit;
          return;
        }
        root.style.setProperty("--nuv-background-x", `${at.x}px`);
        root.style.setProperty("--nuv-background-y", `${at.y}px`);
        root.dataset.lit = "";
      };
      const later = () => {
        if (frame === 0) frame = requestAnimationFrame(show);
      };
      const onMove = (event: PointerEvent) => {
        const box = root.getBoundingClientRect();
        at = { x: event.clientX - box.left, y: event.clientY - box.top };
        later();
      };
      const onLeave = () => {
        at = null;
        later();
      };
      const listen = { passive: true } as const;
      root.addEventListener("pointermove", onMove, listen);
      root.addEventListener("pointerdown", onMove, listen);
      root.addEventListener("pointerleave", onLeave, listen);
      root.addEventListener("pointercancel", onLeave, listen);
      return () => {
        cancelAnimationFrame(frame);
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerdown", onMove);
        root.removeEventListener("pointerleave", onLeave);
        root.removeEventListener("pointercancel", onLeave);
        delete root.dataset.lit;
      };
    }, [interactive]);

    return (
      <div
        {...props}
        ref={setRoot}
        {...backgroundRoot("nuv-grid-background", scrim, className)}
        data-variant={variant}
        data-fade={fade ? "" : undefined}
      >
        <span className="nuv-background__layer" aria-hidden="true">
          <span className="nuv-grid-background__pattern" />
          {interactive && (
            <span className="nuv-grid-background__pattern nuv-grid-background__pattern--lit" />
          )}
        </span>
        <Scrim scrim={scrim} />
        {children}
      </div>
    );
  },
);
