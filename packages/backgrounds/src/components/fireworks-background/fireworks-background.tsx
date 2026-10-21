"use client";

import { forwardRef } from "react";
import {
  type BackgroundRootProps,
  CanvasBackground,
  type CanvasBackgroundOwnProps,
} from "../../core/background";
import { fireworksScene } from "./fireworks-scene";

export type FireworksBackgroundOwnProps = CanvasBackgroundOwnProps;

export interface FireworksBackgroundProps
  extends FireworksBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * Rockets that rise from the bottom and burst into sparks in the theme's
 * chart colors, which fall and fade. A press bursts one where it lands.
 * `density` is how many sparks a burst has.
 */
export const FireworksBackground = forwardRef<
  HTMLDivElement,
  FireworksBackgroundProps
>(function FireworksBackground({ speed = 1, density = 1, ...props }, ref) {
  return (
    <CanvasBackground
      ref={ref}
      block="nuv-fireworks-background"
      settings={{ speed, density }}
      scene={() => fireworksScene({ speed, density })}
      {...props}
    />
  );
});
