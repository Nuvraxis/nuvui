"use client";

import { forwardRef } from "react";
import {
  type BackgroundRootProps,
  CanvasBackground,
  type CanvasBackgroundOwnProps,
} from "../../core/background";
import { hexagonScene } from "./hexagon-scene";

export type HexagonBackgroundOwnProps = CanvasBackgroundOwnProps;

export interface HexagonBackgroundProps
  extends HexagonBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * A grid of hexagons. The ones under the pointer light up in the accent
 * color and fade after it, a press lights the ones around it, and now and
 * then one lights on its own. `density` makes the hexagons smaller.
 */
export const HexagonBackground = forwardRef<
  HTMLDivElement,
  HexagonBackgroundProps
>(function HexagonBackground({ speed = 1, density = 1, ...props }, ref) {
  return (
    <CanvasBackground
      ref={ref}
      block="nuv-hexagon-background"
      settings={{ speed, density }}
      scene={() => hexagonScene({ speed, density })}
      {...props}
    />
  );
});
