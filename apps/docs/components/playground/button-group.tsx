"use client";

import {
  Button,
  ButtonGroup,
  type ButtonGroupProps,
  type ButtonProps,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Orientation = NonNullable<ButtonGroupProps["orientation"]>;
type Intent = NonNullable<ButtonProps["intent"]>;

const orientations = Object.keys({
  horizontal: true,
  vertical: true,
} satisfies Record<Orientation, true>) as Orientation[];

const intents = Object.keys({
  secondary: true,
  primary: true,
  danger: true,
  ghost: true,
} satisfies Record<Intent, true>) as Intent[];

export function ButtonGroupPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [intent, setIntent] = useState<Intent>("secondary");

  const button = `<Button${intent === "primary" ? "" : ` intent="${intent}"`}>`;
  const code = `<ButtonGroup aria-label="History"${orientation === "horizontal" ? "" : ` orientation="${orientation}"`}>
  ${button}Back</Button>
  ${button}Reload</Button>
  ${button}Forward</Button>
</ButtonGroup>`;

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
            label="intent of the buttons"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
        </>
      }
    >
      <ButtonGroup aria-label="History" orientation={orientation}>
        <Button intent={intent}>Back</Button>
        <Button intent={intent}>Reload</Button>
        <Button intent={intent}>Forward</Button>
      </ButtonGroup>
    </Playground>
  );
}
