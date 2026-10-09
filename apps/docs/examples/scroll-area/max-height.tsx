"use client";

import { Button, ScrollArea } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [count, setCount] = useState(3);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 260 }}>
      <Button intent="secondary" size="sm" onClick={() => setCount(count + 3)}>
        Add three rows
      </Button>
      <ScrollArea
        aria-label="Rows"
        style={{
          maxHeight: "10rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <ul
          style={{
            margin: 0,
            padding: "8px 16px",
            listStyle: "none",
            fontSize: 14,
          }}
        >
          {Array.from({ length: count }, (_, index) => `Row ${index + 1}`).map(
            (row) => (
              <li key={row} style={{ paddingBlock: 6 }}>
                {row}
              </li>
            ),
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
