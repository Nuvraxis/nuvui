"use client";

import { DiffEditor } from "@nuvui/editor/code";

// Forty lines of a style sheet, two of them changed.
const rows = Array.from(
  { length: 40 },
  (_, index) =>
    `.row-${index + 1} { padding: ${4 + (index % 4) * 2}px; color: var(--ink-${(index % 6) + 1}); }`,
);
const before = `${rows.join("\n")}\n`;
const after = `${rows
  .map((row, index) =>
    index === 8
      ? row.replace("padding: 4px", "padding: 6px")
      : index === 31
        ? `${row}\n.row-32-wide { padding-inline: 24px; }`
        : row,
  )
  .join("\n")}\n`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%" }}>
      <DiffEditor
        aria-label="Changes to rows.css"
        original={before}
        defaultModified={after}
        language="css"
        collapseUnchanged={{ margin: 2 }}
      />
    </div>
  );
}
