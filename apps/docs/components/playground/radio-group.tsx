"use client";

import { RadioGroup, RadioGroupItem, type RadioGroupProps } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Orientation = NonNullable<RadioGroupProps["orientation"]>;

const orientations = Object.keys({
  vertical: true,
  horizontal: true,
} satisfies Record<Orientation, true>) as Orientation[];

const row = { display: "flex", alignItems: "center", gap: 8 };

export function RadioGroupPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("vertical");
  const [disabled, setDisabled] = useState(false);

  const props = [
    orientation !== "vertical" && `orientation="${orientation}"`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<RadioGroup aria-label="Plan" defaultValue="free"${props.map((prop) => ` ${prop}`).join("")}>
  <RadioGroupItem value="free" id="free" />
  <label htmlFor="free">Free</label>
  ...
</RadioGroup>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <RadioGroup
        aria-label="Plan"
        defaultValue="free"
        orientation={orientation}
        disabled={disabled}
      >
        <div style={row}>
          <RadioGroupItem value="free" id="playground-radio-free" />
          <label htmlFor="playground-radio-free">Free</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="team" id="playground-radio-team" />
          <label htmlFor="playground-radio-team">Team</label>
        </div>
      </RadioGroup>
    </Playground>
  );
}
