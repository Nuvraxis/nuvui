"use client";

import { Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [value, setValue] = useState(["reports/q3.pdf"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Tree
        aria-label="Files to share"
        selectionMode="multiple"
        value={value}
        onValueChange={setValue}
        defaultExpanded={["reports"]}
      >
        <TreeItem value="reports" label="Reports">
          <TreeItem value="reports/q1.pdf" label="q1.pdf" />
          <TreeItem value="reports/q2.pdf" label="q2.pdf" />
          <TreeItem value="reports/q3.pdf" label="q3.pdf" />
          <TreeItem value="reports/q4.pdf" label="q4.pdf" disabled />
        </TreeItem>
        <TreeItem value="invoices" label="Invoices">
          <TreeItem value="invoices/october.pdf" label="october.pdf" />
        </TreeItem>
        <TreeItem value="notes.md" label="notes.md" />
      </Tree>
      <p style={{ margin: 0, fontSize: 14 }}>{value.length} selected</p>
    </div>
  );
}
