import { useEffect, useRef } from "react";

/**
 * Calls `handler` when the key is pressed with Ctrl, or with Command on a
 * Mac. Pass `null` for no shortcut.
 *
 * It listens on the page, after everything in it. So an editor that uses
 * the same keys and says so, by calling `preventDefault`, keeps them. Text
 * that's edited in place with `contenteditable` keeps them as well, because
 * there the browser has uses of its own for them, such as bold for Ctrl+B,
 * and doesn't say so.
 */
export function useShortcut(
  key: string | null | undefined,
  handler: () => void,
): void {
  // The newest handler, without listening again each time it changes.
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!key) return;
    const wanted = key.toLowerCase();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }
      if (event.key.toLowerCase() !== wanted) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.isContentEditable
      ) {
        return;
      }
      // Otherwise the browser acts on it as well. Ctrl+K in Firefox moves
      // focus to its search bar.
      event.preventDefault();
      latest.current();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key]);
}
