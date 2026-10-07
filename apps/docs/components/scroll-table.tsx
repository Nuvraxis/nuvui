"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";

// The box around a table written in Markdown. A table wider than the page
// scrolls sideways inside it, as it does in Fumadocs' own. What this adds:
// while the table scrolls, the box is a stop for the Tab key, with a role
// and a name. Someone who doesn't use a mouse scrolls a box by putting
// focus in it, and a table holds nothing else that takes focus. Chrome and
// Firefox make such a box a tab stop by themselves. Safari doesn't.
//
// A table that fits adds no tab stop.
export function ScrollTable(props: ComponentProps<"table">) {
  const box = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;

    // scrollWidth is rounded, so a table that fits can read as one pixel
    // too wide.
    const check = () =>
      setScrolls(element.scrollWidth > element.clientWidth + 1);
    check();

    const sizes = new ResizeObserver(check);
    sizes.observe(element);
    return () => sizes.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className="relative my-6 overflow-auto prose-no-margin"
      {...(scrolls
        ? { tabIndex: 0, role: "group", "aria-label": "Table" }
        : null)}
    >
      <table {...props} />
    </div>
  );
}
