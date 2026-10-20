"use client";

import { forwardRef } from "react";
import {
  type BackgroundRootProps,
  CanvasBackground,
  type CanvasBackgroundOwnProps,
} from "../../core/background";
import { holeScene } from "./hole-scene";

export type HoleBackgroundOwnProps = CanvasBackgroundOwnProps;

export interface HoleBackgroundProps
  extends HoleBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * A tunnel of rings receding into the distance, with motes rising through
 * it toward the viewer. The far end leans toward the pointer, and a press
 * speeds it up for a moment. `density` is how many motes there are.
 */
export const HoleBackground = forwardRef<HTMLDivElement, HoleBackgroundProps>(
  function HoleBackground({ speed = 1, density = 1, ...props }, ref) {
    return (
      <CanvasBackground
        ref={ref}
        block="nuv-hole-background"
        settings={{ speed, density }}
        scene={() => holeScene({ speed, density })}
        {...props}
      />
    );
  },
);
