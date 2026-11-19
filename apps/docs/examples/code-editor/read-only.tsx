"use client";

import { CodeEditor, CodeEditorContent } from "@nuvui/editor/code";

const query = `SELECT store, SUM(total) AS takings
FROM orders
WHERE placed_on >= DATE '2026-11-01'
GROUP BY store
ORDER BY takings DESC;
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      {/* The code alone, with no toolbar or status. */}
      <CodeEditor
        aria-label="Takings by store"
        language="sql"
        defaultValue={query}
        readOnly
        minLines={1}
      >
        <CodeEditorContent />
      </CodeEditor>
    </div>
  );
}
