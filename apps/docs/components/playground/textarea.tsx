"use client";

import { Textarea } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function TextareaPlayground() {
  const [autoResize, setAutoResize] = useState(false);
  const [placeholder, setPlaceholder] = useState("Type a few lines");
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const props = [
    autoResize && "autoResize",
    placeholder && `placeholder="${placeholder}"`,
    disabled && "disabled",
    invalid && "aria-invalid",
  ].filter(Boolean);
  const code = `<Textarea aria-label="Example"${props.map((prop) => ` ${prop}`).join("")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
          />
          <CheckboxControl
            label="autoResize"
            checked={autoResize}
            onChange={setAutoResize}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="aria-invalid"
            checked={invalid}
            onChange={setInvalid}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 400 }}>
        <Textarea
          aria-label="Example"
          autoResize={autoResize}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
        />
      </div>
    </Playground>
  );
}
