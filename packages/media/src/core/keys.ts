import type { KeyboardEvent } from "react";
import type { MediaLabels } from "./labels";
import type { SavedSettings } from "./persist";
import type { MediaStore } from "./store";

export interface PlayerKeys {
  store: MediaStore;
  root: HTMLElement | null;
  labels: MediaLabels;
  rates: readonly number[];
  /** Seconds J goes back and L goes ahead. */
  back: number;
  ahead: number;
  save: (change: SavedSettings) => void;
  /** The player's own keys, tried first. Each returns false when it didn't act. */
  extra?: Partial<Record<string, () => boolean>>;
}

/**
 * The keys both players answer while focus is anywhere in them. Returns
 * whether the key was used, and then nothing else on the page acts on it.
 */
export function handlePlayerKey(
  event: KeyboardEvent<HTMLElement>,
  { store, root, labels, rates, back, ahead, save, extra }: PlayerKeys,
): boolean {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)
    return false;
  const target = event.target as HTMLElement;
  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="menu"], [role="dialog"]',
    )
  ) {
    return false;
  }
  const onButton = target.closest("button") !== null;
  const state = store.getState();
  const rtl = root ? getComputedStyle(root).direction === "rtl" : false;
  const own = extra?.[event.key];
  let handled = true;
  if (own) {
    handled = own();
  } else {
    switch (event.key) {
      case " ":
      case "Enter":
        if (onButton) return false;
        store.toggle();
        break;
      case "k":
        store.toggle();
        break;
      case "j":
        store.skip(-back);
        break;
      case "l":
        store.skip(ahead);
        break;
      case "ArrowLeft":
        store.skip(rtl ? 5 : -5);
        break;
      case "ArrowRight":
        store.skip(rtl ? -5 : 5);
        break;
      // Read from the element, not the state: a held key repeats faster
      // than the element says it changed.
      case "ArrowUp":
      case "ArrowDown": {
        const media = store.media;
        if (!media) break;
        store.setVolume(
          media.volume + (event.key === "ArrowUp" ? 0.05 : -0.05),
        );
        save({ volume: media.volume, muted: media.muted });
        break;
      }
      case "m": {
        const muted = !store.media?.muted;
        store.setMuted(muted);
        save({ muted });
        break;
      }
      case "<":
      case ">": {
        const index = rates.indexOf(store.media?.playbackRate ?? state.rate);
        const next =
          rates[
            Math.min(
              rates.length - 1,
              Math.max(
                0,
                (index === -1 ? rates.indexOf(1) : index) +
                  (event.key === ">" ? 1 : -1),
              ),
            )
          ];
        if (next !== undefined) {
          store.setRate(next);
          store.say(
            labels.speedChanged(next === 1 ? labels.normalSpeed : `${next}×`),
          );
          save({ rate: next });
        }
        break;
      }
      default:
        if (/^[0-9]$/.test(event.key) && state.duration > 0) {
          store.seek((Number(event.key) / 10) * state.duration);
        } else handled = false;
    }
  }
  if (handled) {
    event.preventDefault();
    // The page's own shortcuts don't also act on a key the player used.
    event.stopPropagation();
  }
  return handled;
}
