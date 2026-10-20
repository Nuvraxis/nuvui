"use client";

import { forwardRef } from "react";
import {
  type BackgroundRootProps,
  CanvasBackground,
  type CanvasBackgroundOwnProps,
} from "../../core/background";
import { topographyScene } from "./topography-scene";

export type TopographyBackgroundOwnProps = CanvasBackgroundOwnProps;

export interface TopographyBackgroundProps
  extends TopographyBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * Contour lines of a land that shifts slowly, as on a map. The pointer
 * raises a hill where it is, and a press sends a wave across. `density` is
 * how many lines there are.
 */
export const TopographyBackground = forwardRef<
  HTMLDivElement,
  TopographyBackgroundProps
>(function TopographyBackground({ speed = 1, density = 1, ...props }, ref) {
  return (
    <CanvasBackground
      ref={ref}
      block="nuv-topography-background"
      settings={{ speed, density }}
      scene={() => topographyScene({ speed, density })}
      {...props}
    />
  );
});
