"use client";

import { Progress, type ProgressProps } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Size = NonNullable<ProgressProps["size"]>;

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

const values = ["0", "25", "50", "75", "100", "not known"] as const;
type Value = (typeof values)[number];

export function ProgressPlayground() {
  const [size, setSize] = useState<Size>("md");
  const [value, setValue] = useState<Value>("50");

  const known = value === "not known" ? null : Number(value);
  const props = [
    'aria-label="Upload"',
    known !== null && `value={${known}}`,
    size !== "md" && `size="${size}"`,
  ].filter(Boolean);
  const code = `<Progress ${props.join(" ")} />`;

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
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
        </>
      }
    >
      <div style={{ width: "100%", maxWidth: 320 }}>
        <Progress aria-label="Upload" value={known} size={size} />
      </div>
    </Playground>
  );
}
