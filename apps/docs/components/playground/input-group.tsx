"use client";

import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function InputGroupPlayground() {
  const [before, setBefore] = useState("https://");
  const [after, setAfter] = useState("");
  const [button, setButton] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const props = [disabled && "disabled", invalid && "aria-invalid"].filter(
    Boolean,
  );
  const code = `<InputGroup>${before ? `\n  <InputGroupAddon>${before}</InputGroupAddon>` : ""}
  <Input aria-label="Site"${props.map((prop) => ` ${prop}`).join("")} />${after ? `\n  <InputGroupAddon>${after}</InputGroupAddon>` : ""}${button ? `\n  <InputGroupButton${disabled ? " disabled" : ""}>Copy</InputGroupButton>` : ""}
</InputGroup>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="before" value={before} onChange={setBefore} />
          <TextControl label="after" value={after} onChange={setAfter} />
          <CheckboxControl
            label="InputGroupButton"
            checked={button}
            onChange={setButton}
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
      <InputGroup style={{ maxInlineSize: 360 }}>
        {before ? <InputGroupAddon>{before}</InputGroupAddon> : null}
        <Input
          aria-label="Site"
          disabled={disabled}
          aria-invalid={invalid || undefined}
        />
        {after ? <InputGroupAddon>{after}</InputGroupAddon> : null}
        {button ? (
          <InputGroupButton disabled={disabled}>Copy</InputGroupButton>
        ) : null}
      </InputGroup>
    </Playground>
  );
}
