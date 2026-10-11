"use client";

import { Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const modes = ["none", "single", "multiple"] as const;

export function ListViewPlayground() {
  const [mode, setMode] = useState<(typeof modes)[number]>("single");
  const [disabled, setDisabled] = useState(false);

  const code = `<ListView aria-label="Invoices"${
    mode === "none" ? "" : ` selectionMode="${mode}"`
  }>
  <ListViewItem value="INV-2041">
    INV-2041
    <Button size="sm">Open</Button>
  </ListViewItem>
  <ListViewItem value="INV-2042"${disabled ? " disabled" : ""}>
    INV-2042
  </ListViewItem>
</ListView>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="selectionMode"
            value={mode}
            options={modes}
            onChange={setMode}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <ListView
        // A list keeps what's selected. Starting again when the mode
        // changes keeps what's shown and the code in step.
        key={mode}
        aria-label="Invoices"
        selectionMode={mode}
        style={{ inlineSize: "100%", maxInlineSize: 360 }}
      >
        <ListViewItem value="INV-2041">
          <span style={{ flex: 1 }}>INV-2041</span>
          <Button size="sm" intent="secondary" aria-label="Open INV-2041">
            Open
          </Button>
        </ListViewItem>
        <ListViewItem value="INV-2042" disabled={disabled}>
          <span style={{ flex: 1 }}>INV-2042</span>
        </ListViewItem>
      </ListView>
    </Playground>
  );
}
