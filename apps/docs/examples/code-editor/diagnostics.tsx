"use client";

import { CodeEditor, type CodeEditorDiagnostic } from "@nuvui/editor/code";
import { useMemo, useState } from "react";

const start = `{
  "store": "Harbor Street",
  "opens": "08:00",
  "closes": "18:00",
  "staff": [ "Ines", "Tomas", ]
}
`;

// A check of the app's own: the JSON is read, and where it can't be, the
// problem is shown at the place the browser says it stopped.
function check(code: string): CodeEditorDiagnostic[] {
  try {
    const data = JSON.parse(code);
    return typeof data.closes === "string" && data.closes < data.opens
      ? [
          {
            from: code.indexOf('"closes"'),
            to: code.indexOf('"closes"') + 8,
            severity: "warning",
            message: "It closes before it opens.",
          },
        ]
      : [];
  } catch (error) {
    const at = Number(/position (\d+)/.exec(String(error))?.[1] ?? 0);
    return [
      {
        from: at,
        to: at + 1,
        severity: "error",
        message: "This isn't JSON that can be read.",
        source: "JSON",
      },
    ];
  }
}

// Formatting is the app's to give. Here, JSON is written out again.
const format = (code: string) =>
  `${JSON.stringify(JSON.parse(code), null, 2)}\n`;

export default function Example() {
  const [code, setCode] = useState(start);
  const diagnostics = useMemo(() => check(code), [code]);

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 720 }}>
      <CodeEditor
        aria-label="Store settings"
        language="json"
        value={code}
        onValueChange={setCode}
        diagnostics={diagnostics}
        format={format}
      />
    </div>
  );
}
