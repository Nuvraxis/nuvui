"use client";

import {
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { MediaLabels } from "./labels";
import type { SavedSettings } from "./persist";
import { initialState, type MediaState, type MediaStore } from "./store";

export interface MediaContextValue {
  /** Which player the parts are in. An audio player has no captions to size. */
  kind: "video" | "audio";
  store: MediaStore;
  labels: MediaLabels;
  /** The player's outer element: where menus and the shortcuts sheet open, so they're seen in fullscreen. */
  root: RefObject<HTMLElement | null>;
  rates: readonly number[];
  /** How far the skip buttons and the J and L keys go. */
  skip: number;
  /** Keeps a setting between visits, when the player was given `persist`. */
  save: (change: SavedSettings) => void;
  /** Opens the shortcuts sheet. */
  showShortcuts: () => void;
}

export const MediaContext = createContext<MediaContextValue | null>(null);

export function useMediaContext(part: string): MediaContextValue {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error(`${part} must be inside a VideoPlayer or an AudioPlayer.`);
  }
  return context;
}

/**
 * A part of the player's state. The component renders again only when
 * what `select` returns changes, so return one value, not a new object.
 */
export function useMediaState<T>(
  store: MediaStore,
  select: (state: MediaState) => T,
): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.getState()),
    () => select(initialState),
  );
}

export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The latest value, for a listener that shouldn't be added again each render. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
