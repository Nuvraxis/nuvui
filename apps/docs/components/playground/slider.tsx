"use client";

import { Slider, type SliderProps } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Orientation = NonNullable<SliderProps["orientation"]>;

const orientations = Object.keys({
  horizontal: true,
  vertical: true,
} satisfies Record<Orientation, true>) as Orientation[];

const steps = ["1", "5", "10", "25"] as const;

export function SliderPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [step, setStep] = useState<(typeof steps)[number]>("1");
  const [range, setRange] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const props = [
    `defaultValue={${range ? "[25, 75]" : "[50]"}}`,
    step !== "1" && `step={${step}}`,
    orientation !== "horizontal" && `orientation="${orientation}"`,
    inverted && "inverted",
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<Slider aria-label="Amount" ${props.join(" ")} />`;

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
          <SelectControl
            label="step"
            value={step}
            options={steps}
            onChange={setStep}
          />
          <CheckboxControl
            label="two handles"
            checked={range}
            onChange={setRange}
          />
          <CheckboxControl
            label="inverted"
            checked={inverted}
            onChange={setInverted}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          inlineSize: "100%",
          maxInlineSize: 320,
        }}
      >
        <Slider
          // A new slider, so that it starts again from the new defaultValue.
          key={String(range)}
          aria-label="Amount"
          defaultValue={range ? [25, 75] : [50]}
          step={Number(step)}
          orientation={orientation}
          inverted={inverted}
          disabled={disabled}
        />
      </div>
    </Playground>
  );
}
