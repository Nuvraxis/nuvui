"use client";

import { forwardRef } from "react";
import {
  type BackgroundRootProps,
  CanvasBackground,
  type CanvasBackgroundOwnProps,
} from "../../core/background";
import { glyphScene } from "./glyph-scene";

export interface GlyphBackgroundOwnProps extends CanvasBackgroundOwnProps {
  /** The characters it's made of, picked at random, such as `"01"`. */
  glyphs?: string;
}

export interface GlyphBackgroundProps
  extends GlyphBackgroundOwnProps,
    BackgroundRootProps {}

/**
 * A field of characters lit by glows that wander over it. The pointer
 * leaves a trail of light, a press sends a ring of it outward, and now and
 * then a character changes. `density` makes the characters smaller.
 */
export const GlyphBackground = forwardRef<HTMLDivElement, GlyphBackgroundProps>(
  function GlyphBackground(
    { speed = 1, density = 1, glyphs = "0123456789abcdef", ...props },
    ref,
  ) {
    return (
      <CanvasBackground
        ref={ref}
        block="nuv-glyph-background"
        settings={{ speed, density, glyphs }}
        scene={() => glyphScene({ speed, density, glyphs })}
        {...props}
      />
    );
  },
);
