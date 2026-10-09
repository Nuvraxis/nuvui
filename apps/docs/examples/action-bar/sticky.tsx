"use client";

import {
  ActionBar,
  ActionBarSelection,
  Button,
  Checkbox,
  Label,
} from "@nuvui/react";
import { useState } from "react";

const files = Array.from({ length: 12 }, (_, index) => ({
  id: `file-${index + 1}`,
  name: `Report ${index + 1}.pdf`,
}));

export default function Example() {
  const [selected, setSelected] = useState<string[]>(["file-2", "file-3"]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );

  return (
    <section
      aria-label="Files"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable by keyboard
      tabIndex={0}
      style={{
        inlineSize: "100%",
        maxInlineSize: 360,
        blockSize: 260,
        overflow: "auto",
        paddingInline: 12,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      <ul
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          paddingBlock: 12,
          paddingInline: 0,
          listStyle: "none",
        }}
      >
        {files.map((file) => (
          <li
            key={file.id}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <Checkbox
              id={`action-bar-${file.id}`}
              checked={selected.includes(file.id)}
              onCheckedChange={() => toggle(file.id)}
            />
            <Label htmlFor={`action-bar-${file.id}`}>{file.name}</Label>
          </li>
        ))}
      </ul>
      <ActionBar
        open={selected.length > 0}
        position="sticky"
        aria-label="Selected files"
      >
        <ActionBarSelection>{selected.length} selected</ActionBarSelection>
        <Button intent="secondary" size="sm" onClick={() => setSelected([])}>
          Download
        </Button>
        <Button intent="danger" size="sm" onClick={() => setSelected([])}>
          Delete
        </Button>
      </ActionBar>
    </section>
  );
}
