import { useEffect, useState } from "react";

// What the Tab key can land on. It doesn't have to be exact: a miss either
// way costs one tab stop.
const tabbable = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "iframe",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface ScrollRegionProps {
  tabIndex?: 0;
  role?: "group";
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

const none: ScrollRegionProps = {};

function measure(element: HTMLElement): ScrollRegionProps {
  // scrollHeight is rounded, so content that fits can still read as one
  // pixel too tall.
  const scrolls =
    element.scrollHeight > element.clientHeight + 1 ||
    element.scrollWidth > element.clientWidth + 1;
  if (!scrolls || element.querySelector(tabbable)) return none;

  // The dialog or popover around it already has a name. Borrowing it tells a
  // screen reader user what the box they've landed on belongs to.
  const owner = element.closest('[role="dialog"], [role="alertdialog"]');
  const labelledBy = owner?.getAttribute("aria-labelledby");
  const label = owner?.getAttribute("aria-label");

  return {
    tabIndex: 0,
    role: "group",
    ...(labelledBy
      ? { "aria-labelledby": labelledBy }
      : label
        ? { "aria-label": label }
        : null),
  };
}

function same(a: ScrollRegionProps, b: ScrollRegionProps) {
  return (
    a.tabIndex === b.tabIndex &&
    a["aria-labelledby"] === b["aria-labelledby"] &&
    a["aria-label"] === b["aria-label"]
  );
}

/**
 * Props for a box that scrolls, so that it can be scrolled from the keyboard.
 *
 * Someone who doesn't use a mouse scrolls by moving focus to something inside
 * the box, or to the box itself. When nothing inside can take focus, the box
 * has to. Chrome and Firefox make it a tab stop on their own. Safari doesn't,
 * so this does it everywhere, and adds a role and a name for screen readers.
 * The props are empty while the content fits or holds a control.
 */
export function useScrollRegion(
  element: HTMLElement | null,
): ScrollRegionProps {
  const [props, setProps] = useState(none);

  useEffect(() => {
    if (!element) return;

    const check = () => {
      const next = measure(element);
      setProps((current) => (same(current, next) ? current : next));
    };
    check();

    // jsdom has neither this nor any layout to measure.
    if (typeof ResizeObserver === "undefined") return;

    // The box changes size with the screen. Its children change size when an
    // image loads or text wraps differently, which the box itself may not.
    const sizes = new ResizeObserver(check);
    const watchSizes = () => {
      sizes.disconnect();
      sizes.observe(element);
      for (const child of element.children) sizes.observe(child);
    };
    watchSizes();

    const content = new MutationObserver((records) => {
      if (records.some((record) => record.target === element)) watchSizes();
      check();
    });
    content.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled", "tabindex", "href", "contenteditable"],
    });

    return () => {
      sizes.disconnect();
      content.disconnect();
    };
  }, [element]);

  return props;
}
