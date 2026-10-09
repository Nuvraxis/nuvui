"use client";

import { Spinner, type SpinnerProps } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl, TextControl } from "./controls";

type Size = NonNullable<SpinnerProps["size"]>;

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

export function SpinnerPlayground() {
  const [size, setSize] = useState<Size>("md");
  const [label, setLabel] = useState("Loading");

  const props = [
    size !== "md" && `size="${size}"`,
    label !== "Loading" && `label="${label}"`,
  ].filter(Boolean);
  const code = `<Spinner${props.map((prop) => ` ${prop}`).join("")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <TextControl label="label" value={label} onChange={setLabel} />
        </>
      }
    >
      <Spinner size={size} label={label} />
    </Playground>
  );
}
