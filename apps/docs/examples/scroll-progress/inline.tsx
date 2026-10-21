"use client";

import { ScrollProgress } from "@nuvui/react";
import { type CSSProperties, useRef } from "react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Example() {
  const row = useRef<HTMLUListElement>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 480,
      }}
    >
      <ul
        ref={row}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable with the keyboard
        tabIndex={0}
        aria-label="Months"
        style={{
          display: "flex",
          gap: 8,
          margin: 0,
          padding: "0 0 8px",
          overflowX: "auto",
          listStyle: "none",
        }}
      >
        {months.map((month) => (
          <li
            key={month}
            style={{
              flex: "none",
              inlineSize: 120,
              padding: 12,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {month}
          </li>
        ))}
      </ul>
      <ScrollProgress
        target={row}
        axis="inline"
        style={
          {
            "--nuv-scroll-progress-track": "var(--color-muted)",
            "--nuv-scroll-progress-radius": "var(--radius-full)",
          } as CSSProperties
        }
      />
    </div>
  );
}
