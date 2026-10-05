"use client";

import { Switch } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground } from "./controls";

export function SwitchPlayground() {
  const [checked, setChecked] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const props = [checked && "checked", disabled && "disabled"].filter(Boolean);
  const code = `<Switch id="updates"${props.map((prop) => ` ${prop}`).join("")} />
<label htmlFor="updates">Email me updates</label>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="checked"
            checked={checked}
            onChange={setChecked}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Switch
          id="playground-switch"
          checked={checked}
          disabled={disabled}
          onCheckedChange={setChecked}
        />
        <label htmlFor="playground-switch">Email me updates</label>
      </div>
    </Playground>
  );
}
