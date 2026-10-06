"use client";

import { Input } from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

const types = [
  "text",
  "email",
  "password",
  "number",
  "search",
  "tel",
  "url",
  "date",
] as const;
type Type = (typeof types)[number];

export function InputPlayground() {
  const [type, setType] = useState<Type>("text");
  const [placeholder, setPlaceholder] = useState("Type here");
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const props = [
    type !== "text" && `type="${type}"`,
    placeholder && `placeholder="${placeholder}"`,
    disabled && "disabled",
    readOnly && "readOnly",
    invalid && "aria-invalid",
  ].filter(Boolean);
  const code = `<Input aria-label="Example"${props.map((prop) => ` ${prop}`).join("")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="type"
            value={type}
            options={types}
            onChange={setType}
          />
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
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
          <CheckboxControl
            label="aria-invalid"
            checked={invalid}
            onChange={setInvalid}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 320 }}>
        <Input
          aria-label="Example"
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
        />
      </div>
    </Playground>
  );
}
