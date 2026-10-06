"use client";

import { Input, Label } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function LabelPlayground() {
  const [text, setText] = useState("Email");
  const [disabled, setDisabled] = useState(false);

  const code = `<Label htmlFor="email"${disabled ? ' data-disabled=""' : ""}>${text}</Label>
<Input id="email"${disabled ? " disabled" : ""} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="children" value={text} onChange={setText} />
          <CheckboxControl
            label="data-disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gap: 6,
          inlineSize: "100%",
          maxInlineSize: 320,
        }}
      >
        <Label
          htmlFor="playground-label"
          data-disabled={disabled ? "" : undefined}
        >
          {text}
        </Label>
        <Input id="playground-label" disabled={disabled} />
      </div>
    </Playground>
  );
}
