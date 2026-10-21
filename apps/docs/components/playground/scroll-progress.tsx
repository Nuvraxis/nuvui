"use client";

import { ScrollProgress } from "@nuvui/react";
import { type CSSProperties, useRef, useState } from "react";
import { Playground, SelectControl } from "./controls";

const sizes = { "2px": "2px", "4px": "0.25rem", "8px": "0.5rem" } as const;

export function ScrollProgressPlayground() {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const [size, setSize] = useState<keyof typeof sizes>("4px");
  const box = useRef<HTMLElement>(null);
  const vertical = orientation === "vertical";

  const props = [
    "target={box}",
    vertical ? 'orientation="vertical"' : null,
    size === "4px"
      ? null
      : `style={{ "--nuv-scroll-progress-size": "${sizes[size]}" }}`,
  ].filter(Boolean);
  const code = `const box = useRef<HTMLElement>(null);

<ScrollProgress ${props.join(" ")} />
<section ref={box} style={{ overflowY: "auto" }}>…</section>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="orientation"
            value={orientation}
            options={["horizontal", "vertical"]}
            onChange={setOrientation}
          />
          <SelectControl
            label="thickness"
            value={size}
            options={Object.keys(sizes) as (keyof typeof sizes)[]}
            onChange={setSize}
          />
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: vertical ? "row" : "column",
          gap: 8,
          inlineSize: "100%",
          maxInlineSize: 420,
          blockSize: 220,
        }}
      >
        <ScrollProgress
          target={box}
          orientation={orientation}
          style={
            {
              "--nuv-scroll-progress-size": sizes[size],
              "--nuv-scroll-progress-track": "var(--color-muted)",
            } as CSSProperties
          }
        />
        <section
          ref={box}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable with the keyboard
          tabIndex={0}
          aria-label="Text to scroll"
          style={{ flex: 1, minBlockSize: 0, overflowY: "auto" }}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index} style={{ marginBlock: "0 12px" }}>
              Paragraph {index + 1}. Scroll this box and the bar follows how far
              through it you are.
            </p>
          ))}
        </section>
      </div>
    </Playground>
  );
}
