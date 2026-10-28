import { type RefObject, useEffect, useLayoutEffect, useState } from "react";

// React 18 warns about a layout effect on the server, where it never runs.
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * How wide an element is, followed as it changes. `fallback` until the
 * browser has measured it, which is what the server draws with.
 */
export function useWidth(
  element: RefObject<HTMLElement | null>,
  fallback: number,
): number {
  const [width, setWidth] = useState(fallback);
  useIsomorphicLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [element]);
  return width;
}
