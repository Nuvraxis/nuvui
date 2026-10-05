"use client";

import { Checkbox } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const states = ["unchecked", "checked", "indeterminate"] as const;
type State = (typeof states)[number];

export function CheckboxPlayground() {
  const [state, setState] = useState<State>("unchecked");
  const [disabled, setDisabled] = useState(false);

  const checked = state === "indeterminate" ? state : state === "checked";
  const props = [
    state === "checked" && "checked",
    state === "indeterminate" && 'checked="indeterminate"',
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<Checkbox id="notify"${props.map((prop) => ` ${prop}`).join("")} />
<label htmlFor="notify">Notify me</label>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="checked"
            value={state}
            options={states}
            onChange={setState}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox
          id="playground-checkbox"
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) =>
            setState(next === true ? "checked" : "unchecked")
          }
        />
        <label htmlFor="playground-checkbox">Notify me</label>
      </div>
    </Playground>
  );
}
