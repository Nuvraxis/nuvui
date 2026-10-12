"use client";

import { RichTextEditor } from "@nuvui/editor";
import { useState } from "react";
import { CheckboxControl, Playground } from "./controls";

export function RichTextEditorPlayground() {
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [limited, setLimited] = useState(false);
  const [hinted, setHinted] = useState(true);

  const code = `<RichTextEditor
  aria-label="Notes"${hinted ? '\n  placeholder="Write a note"' : ""}${
    limited ? "\n  maxLength={140}" : ""
  }${disabled ? "\n  disabled" : ""}${readOnly ? "\n  readOnly" : ""}
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="placeholder"
            checked={hinted}
            onChange={setHinted}
          />
          <CheckboxControl
            label="maxLength"
            checked={limited}
            onChange={setLimited}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="readOnly"
            checked={readOnly}
            onChange={setReadOnly}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 560 }}>
        <RichTextEditor
          aria-label="Notes"
          placeholder={hinted ? "Write a note" : undefined}
          maxLength={limited ? 140 : undefined}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
    </Playground>
  );
}
