import { useMemo, useRef } from "react";

/**
 * Gives focus back to whatever had it before a dialog opened.
 *
 * Radix's dialog returns focus to its own trigger part when it closes. A
 * dialog that's opened some other way, by a shortcut or by a button
 * elsewhere on the page, has no such part, and focus is then left on the
 * page as a whole: the next Tab starts again from the top.
 *
 * `remember` goes on the dialog's `onOpenAutoFocus`, which runs before focus
 * has moved, and `restore` on its `onCloseAutoFocus`.
 */
export function useReturnFocus() {
  const from = useRef<Element | null>(null);

  return useMemo(
    () => ({
      remember: () => {
        from.current = document.activeElement;
      },
      restore: () => {
        const element = from.current;
        from.current = null;
        // It may have gone in the meantime, as a menu item has once its
        // menu closes.
        if (element instanceof HTMLElement && element.isConnected) {
          element.focus();
        }
      },
    }),
    [],
  );
}
