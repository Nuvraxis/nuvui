"use client";

import { CodeEditor, DiffEditor } from "@nuvui/editor/code";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const samples = {
  typescript: `export function total(lines: { price: number; count: number }[]) {
  return lines.reduce((sum, line) => sum + line.price * line.count, 0);
}
`,
  python: `def total(lines):
    return sum(line["price"] * line["count"] for line in lines)
`,
  css: `.receipt {
  display: grid;
  gap: 0.5rem;
}
`,
} as const;
type Sample = keyof typeof samples;
const languages = Object.keys(samples) as Sample[];

export function CodeEditorPlayground() {
  const [language, setLanguage] = useState<Sample>("typescript");
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [focus, setFocus] = useState(false);

  const code = `<CodeEditor
  aria-label="Totals"
  language="${language}"
  defaultValue={code}${lineNumbers ? "" : "\n  lineNumbers={false}"}${
    wrap ? "\n  wrap" : ""
  }${readOnly ? "\n  readOnly" : ""}${disabled ? "\n  disabled" : ""}${
    focus ? '\n  tabBehavior="focus"' : ""
  }
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="language"
            value={language}
            options={languages}
            onChange={setLanguage}
          />
          <CheckboxControl
            label="lineNumbers"
            checked={lineNumbers}
            onChange={setLineNumbers}
          />
          <CheckboxControl label="wrap" checked={wrap} onChange={setWrap} />
          <CheckboxControl
            label="readOnly"
            checked={readOnly}
            onChange={setReadOnly}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label='tabBehavior="focus"'
            checked={focus}
            onChange={setFocus}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
        <CodeEditor
          // A new sample for each language, so it opens with that one's code.
          key={language}
          aria-label="Totals"
          language={language}
          defaultValue={samples[language]}
          lineNumbers={lineNumbers}
          wrap={wrap}
          readOnly={readOnly}
          disabled={disabled}
          tabBehavior={focus ? "focus" : "indent"}
        />
      </div>
    </Playground>
  );
}

const before = `title: Spring sale
starts: 2026-03-02
discount: 10
stores:
  - Harbor Street
  - Mill Lane
`;

const after = `title: Spring sale
starts: 2026-03-09
discount: 15
stores:
  - Harbor Street
  - Mill Lane
  - Quayside
`;

const layouts = ["split", "unified"] as const;

export function DiffEditorPlayground() {
  const [layout, setLayout] = useState<(typeof layouts)[number]>("split");
  const [editable, setEditable] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);

  const code = `<DiffEditor
  aria-label="Changes to sale.yaml"
  original={before}
  defaultModified={after}
  language="yaml"
  layout="${layout}"${editable ? "\n  editable" : ""}${
    lineNumbers ? "" : "\n  lineNumbers={false}"
  }
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="layout"
            value={layout}
            options={layouts}
            onChange={setLayout}
          />
          <CheckboxControl
            label="editable"
            checked={editable}
            onChange={setEditable}
          />
          <CheckboxControl
            label="lineNumbers"
            checked={lineNumbers}
            onChange={setLineNumbers}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%" }}>
        <DiffEditor
          aria-label="Changes to sale.yaml"
          original={before}
          defaultModified={after}
          language="yaml"
          layout={layout}
          onLayoutChange={setLayout}
          editable={editable}
          lineNumbers={lineNumbers}
        />
      </div>
    </Playground>
  );
}
