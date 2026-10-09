"use client";

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  type StepperProps,
  StepperTitle,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Orientation = NonNullable<StepperProps["orientation"]>;
type Variant = NonNullable<StepperProps["variant"]>;

const orientations = Object.keys({
  horizontal: true,
  vertical: true,
} satisfies Record<Orientation, true>) as Orientation[];

const variants = Object.keys({
  number: true,
  dot: true,
} satisfies Record<Variant, true>) as Variant[];

const steps = ["Account", "Team", "Billing"];
const values = ["1", "2", "3", "4"] as const;

export function StepperPlayground() {
  const [value, setValue] = useState<(typeof values)[number]>("2");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [variant, setVariant] = useState<Variant>("number");

  const props = [
    `value={${value}}`,
    orientation !== "horizontal" && `orientation="${orientation}"`,
    variant !== "number" && `variant="${variant}"`,
  ].filter(Boolean);
  const code = `<Stepper ${props.join(" ")} aria-label="Setting up">
${steps
  .map(
    (title, index) => `  <StepperItem step={${index + 1}}>
    <StepperIndicator />
    <StepperContent>
      <StepperTitle>${title}</StepperTitle>
    </StepperContent>
  </StepperItem>`,
  )
  .join("\n")}
</Stepper>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="value"
            value={value}
            options={values}
            onChange={setValue}
          />
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <SelectControl
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
        </>
      }
    >
      <Stepper
        value={Number(value)}
        orientation={orientation}
        variant={variant}
        aria-label="Setting up"
        style={{
          inlineSize: orientation === "horizontal" ? "100%" : undefined,
        }}
      >
        {steps.map((title, index) => (
          <StepperItem key={title} step={index + 1}>
            <StepperIndicator />
            <StepperContent>
              <StepperTitle>{title}</StepperTitle>
            </StepperContent>
          </StepperItem>
        ))}
      </Stepper>
    </Playground>
  );
}
