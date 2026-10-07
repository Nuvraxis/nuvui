import { useSyncExternalStore } from "react";

// The width at which @nuvui/react's Dialog stops being a sheet across the
// bottom of the screen. It's the "sm" breakpoint, written out because a
// script can't read a Sass variable.
const wide = "(min-width: 40rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(wide);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether the screen is narrow enough that the calendar should open as a
 * sheet. On the server it's `false`: nothing is open there, and the answer
 * is only needed once something is.
 */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !window.matchMedia(wide).matches,
    () => false,
  );
}
