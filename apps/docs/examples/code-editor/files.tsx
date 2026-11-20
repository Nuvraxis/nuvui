"use client";

import { CodeEditor } from "@nuvui/editor/code";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { useState } from "react";

const start: Record<string, string> = {
  "index.html": `<main>\n  <h1>Harbor Street</h1>\n  <p class="hours">Open 8 to 6</p>\n</main>\n`,
  "styles.css": `.hours {\n  color: teal;\n  font-weight: 600;\n}\n`,
  "app.js": `document.querySelector(".hours").title = "Every day";\n`,
};

export default function Example() {
  const [files, setFiles] = useState(start);
  const [open, setOpen] = useState("index.html");

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 720,
      }}
    >
      <ToggleGroup
        type="single"
        aria-label="Files"
        value={open}
        onValueChange={(next) => {
          if (next) setOpen(next);
        }}
      >
        {Object.keys(files).map((path) => (
          <ToggleGroupItem key={path} value={path}>
            {path}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* One editor. Each file keeps its own undo history, selection and
          scroll, and its language comes from its name. */}
      <CodeEditor
        aria-label={open}
        path={open}
        value={files[open]}
        onValueChange={(code) =>
          setFiles((before) => ({ ...before, [open]: code }))
        }
      />
    </div>
  );
}
