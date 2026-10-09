"use client";

import { NumberField } from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

const formats = ["decimal", "currency", "percent"] as const;
type Format = (typeof formats)[number];

const settings = {
  decimal: { format: undefined, code: "" },
  currency: {
    format: { currency: "USD" },
    code: ' format={{ currency: "USD" }}',
  },
  percent: {
    format: { format: "percent" },
    code: ' format={{ format: "percent" }}',
  },
} as const;

export function NumberFieldPlayground() {
  const [format, setFormat] = useState<Format>("decimal");
  const [stepText, setStepText] = useState("1");
  const [limits, setLimits] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [value, setValue] = useState<number | null>(5);

  // Whatever is typed, the component gets a step above zero.
  const parsed = Number(stepText);
  const step = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const props = [
    limits && "min={0} max={100}",
    step !== 1 && `step={${step}}`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<NumberField${props.map((prop) => ` ${prop}`).join("")}${settings[format].code} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="format"
            value={format}
            options={formats}
            onChange={setFormat}
          />
          <TextControl label="step" value={stepText} onChange={setStepText} />
          <CheckboxControl
            label="min and max"
            checked={limits}
            onChange={setLimits}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div style={{ display: "grid", gap: 8, inlineSize: "12rem" }}>
        <NumberField
          aria-label="Amount"
          value={value}
          onValueChange={setValue}
          step={step}
          min={limits ? 0 : undefined}
          max={limits ? 100 : undefined}
          disabled={disabled}
          format={settings[format].format}
        />
        <output data-value>
          {value === null ? "The value is null" : `The value is ${value}`}
        </output>
      </div>
    </Playground>
  );
}
