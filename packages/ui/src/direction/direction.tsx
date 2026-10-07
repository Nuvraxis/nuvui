"use client";

import * as DirectionPrimitive from "@radix-ui/react-direction";
import type { ReactNode } from "react";

export type Direction = "ltr" | "rtl";

export interface DirectionProviderProps {
  /** The reading direction of everything inside. */
  dir: Direction;
  children?: ReactNode;
}

/**
 * Tells every component inside which way the text reads. The styles follow
 * the `dir` attribute by themselves. This is for the behavior: which arrow
 * key moves to the next tab, which way a submenu opens, which end of a
 * slider is the start. Put it around the app, with the same value as the
 * `dir` attribute on `html`.
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return (
    <DirectionPrimitive.DirectionProvider dir={dir}>
      {children}
    </DirectionPrimitive.DirectionProvider>
  );
}

/**
 * The direction set by the nearest `DirectionProvider`, or `"ltr"` when
 * there is none. Pass a component's own `dir` prop and it wins when set.
 */
export function useDirection(dir?: Direction): Direction {
  return DirectionPrimitive.useDirection(dir);
}
