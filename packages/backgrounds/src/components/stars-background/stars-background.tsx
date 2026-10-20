"use client";

import { forwardRef } from "react";
import {
  type BackgroundRootProps,
  CanvasBackground,
  type CanvasBackgroundOwnProps,
} from "../../core/background";
import { starsScene } from "./stars-scene";

export type StarsBackgroundOwnProps = CanvasBackgroundOwnProps;

export interface StarsBackgroundProps
  extends StarsBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * A starfield: dots of several sizes drifting the way the page reads, the
 * nearer ones larger and faster, leaning away from the pointer a little.
 */
export const StarsBackground = forwardRef<HTMLDivElement, StarsBackgroundProps>(
  function StarsBackground({ speed = 1, density = 1, ...props }, ref) {
    return (
      <CanvasBackground
        ref={ref}
        block="nuv-stars-background"
        settings={{ speed, density }}
        scene={() => starsScene({ speed, density })}
        {...props}
      />
    );
  },
);
