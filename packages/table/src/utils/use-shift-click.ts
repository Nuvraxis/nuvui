import { type KeyboardEvent, type MouseEvent, useRef } from "react";

/**
 * Whether Shift was held for a click, including a click made with the
 * keyboard.
 *
 * Space or Enter on a button gives a click event. Chromium and WebKit mark
 * that event with the Shift that was held. Firefox doesn't, so Shift and
 * Space would never select a range there. The key that's about to make the
 * click is watched, and its Shift is used for the click that follows.
 */
export function useShiftClick() {
  const held = useRef(false);
  return {
    props: {
      onKeyDown(event: KeyboardEvent) {
        if (event.key === " " || event.key === "Enter") {
          held.current = event.shiftKey;
        }
      },
      onBlur() {
        held.current = false;
      },
    },
    /** Call it once, in the click handler. */
    shift(event: MouseEvent): boolean {
      const shift = event.shiftKey || held.current;
      held.current = false;
      return shift;
    },
  };
}
