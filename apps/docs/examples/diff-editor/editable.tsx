"use client";

import { DiffEditor, type DiffEditorSummary } from "@nuvui/editor/code";
import { useState } from "react";

const before = `name: Restock reminders
schedule: "0 8 * * 1"
stores:
  - Harbor Street
  - Mill Lane
threshold: 12
notify: ops@example.com
`;

const proposed = `name: Restock reminders
schedule: "0 7 * * 1-5"
stores:
  - Harbor Street
  - Mill Lane
  - Quayside
threshold: 8
notify: ops@example.com
`;

export default function Example() {
  const [original, setOriginal] = useState(before);
  const [modified, setModified] = useState(proposed);
  const [summary, setSummary] = useState<DiffEditorSummary | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <DiffEditor
        aria-label="Proposed changes to restock.yaml"
        original={original}
        onOriginalChange={setOriginal}
        modified={modified}
        onModifiedChange={(next, now) => {
          setModified(next);
          setSummary(now);
        }}
        language="yaml"
        editable
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        {summary
          ? `${summary.changes} left to decide on.`
          : "Keep or undo each change beside it, or from the toolbar."}
      </p>
    </div>
  );
}
