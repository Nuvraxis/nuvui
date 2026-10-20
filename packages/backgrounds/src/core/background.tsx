"use client";

import { forwardRef, useCallback, useEffect, useRef } from "react";
import { assignRef } from "../utils/ref";
import {
  type BackgroundOwnProps,
  type BackgroundRootProps,
  backgroundRoot,
  Scrim,
} from "./root";
import { type Mounted, mountScene, type Scene } from "./scene";

export type {
  BackgroundOwnProps,
  BackgroundRootProps,
  BackgroundScrim,
} from "./root";

/** What every background drawn on a canvas takes. */
export interface CanvasBackgroundOwnProps extends BackgroundOwnProps {
  /** Stops it on the frame it's at. */
  paused?: boolean;
  /** Whether it answers the pointer: a move, and a press on it. */
  interactive?: boolean;
  /** How fast it moves: 1 as designed, 0.5 half as fast. */
  speed?: number;
  /** How much of it there is: 1 as designed, 0.5 half as much. */
  density?: number;
}

interface CanvasBackgroundProps
  extends Omit<CanvasBackgroundOwnProps, "speed" | "density">,
    BackgroundRootProps {
  block: string;
  /**
   * Makes the scene. A new one is made when `settings` change, and the
   * old one is let go.
   */
  scene: () => Scene;
  settings: unknown;
}

/** A background drawn on a canvas, with what's laid on it over that. */
export const CanvasBackground = forwardRef<
  HTMLDivElement,
  CanvasBackgroundProps
>(function CanvasBackground(
  {
    block,
    scene,
    settings,
    children,
    scrim = "none",
    paused = false,
    interactive = true,
    className,
    ...props
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  const mounted = useRef<Mounted | null>(null);
  const options = useRef({ paused, interactive });
  options.current = { paused, interactive };
  const key = JSON.stringify(settings);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a scene is made again when its settings are other settings, and not each time a new function is passed
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const current = mountScene(root, canvas, scene(), options.current);
    mounted.current = current;
    return () => {
      current.destroy();
      mounted.current = null;
    };
  }, [key]);

  useEffect(() => {
    mounted.current?.update({ paused, interactive });
  }, [paused, interactive]);

  return (
    <div
      {...props}
      ref={setRoot}
      {...backgroundRoot(block, scrim, className)}
      data-paused={paused || undefined}
    >
      <span className="nuv-background__layer" aria-hidden="true">
        <canvas ref={canvasRef} className="nuv-background__canvas" />
      </span>
      <Scrim scrim={scrim} />
      {children}
    </div>
  );
});
