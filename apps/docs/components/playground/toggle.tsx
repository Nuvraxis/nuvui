"use client";

import { Toggle, type ToggleProps } from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Variant = NonNullable<ToggleProps["variant"]>;
type Size = NonNullable<ToggleProps["size"]>;

const variants = Object.keys({
  ghost: true,
  outline: true,
} satisfies Record<Variant, true>) as Variant[];

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

export function TogglePlayground() {
  const [variant, setVariant] = useState<Variant>("ghost");
  const [size, setSize] = useState<Size>("md");
  const [pressed, setPressed] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState("Pin to top");

  const props = [
    variant !== "ghost" && `variant="${variant}"`,
    size !== "md" && `size="${size}"`,
    pressed && "pressed",
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<Toggle${props.map((prop) => ` ${prop}`).join("")}>${label}</Toggle>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
          <SelectControl
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <TextControl label="children" value={label} onChange={setLabel} />
          <CheckboxControl
            label="pressed"
            checked={pressed}
            onChange={setPressed}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Toggle
        variant={variant}
        size={size}
        pressed={pressed}
        onPressedChange={setPressed}
        disabled={disabled}
      >
        {label}
      </Toggle>
    </Playground>
  );
}
