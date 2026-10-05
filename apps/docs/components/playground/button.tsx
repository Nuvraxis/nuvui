"use client";

import { Button, type ButtonProps } from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Intent = NonNullable<ButtonProps["intent"]>;
type Size = NonNullable<ButtonProps["size"]>;

// Written as records so the compiler checks them against the library's
// types. Add an intent there and this file stops building until it's listed.
const intents = Object.keys({
  primary: true,
  secondary: true,
  ghost: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

export function ButtonPlayground() {
  const [intent, setIntent] = useState<Intent>("primary");
  const [size, setSize] = useState<Size>("md");
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState("Save changes");

  const props = [
    intent !== "primary" && `intent="${intent}"`,
    size !== "md" && `size="${size}"`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<Button${props.map((prop) => ` ${prop}`).join("")}>${label}</Button>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <SelectControl
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <TextControl label="children" value={label} onChange={setLabel} />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Button intent={intent} size={size} disabled={disabled}>
        {label}
      </Button>
    </Playground>
  );
}
