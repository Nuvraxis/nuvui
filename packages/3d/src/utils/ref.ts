import type { ForwardedRef, MutableRefObject } from "react";

/** Gives `node` to a ref passed in, whichever kind it is. */
export function assignRef<T>(ref: ForwardedRef<T>, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as MutableRefObject<T | null>).current = node;
}
