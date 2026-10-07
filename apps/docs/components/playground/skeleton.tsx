"use client";

import { Skeleton, type SkeletonProps } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Shape = NonNullable<SkeletonProps["shape"]>;

const shapes = Object.keys({
  block: true,
  text: true,
  circle: true,
} satisfies Record<Shape, true>) as Shape[];

const widths = ["100%", "60%", "8rem"] as const;
type Width = (typeof widths)[number];

export function SkeletonPlayground() {
  const [shape, setShape] = useState<Shape>("block");
  const [width, setWidth] = useState<Width>("100%");

  const sized = shape !== "circle" && width !== "100%";
  const props = [
    shape !== "block" && `shape="${shape}"`,
    sized && `style={{ width: "${width}" }}`,
  ].filter(Boolean);
  const code = `<Skeleton${props.map((prop) => ` ${prop}`).join("")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="shape"
            value={shape}
            options={shapes}
            onChange={setShape}
          />
          <SelectControl
            label="width"
            value={width}
            options={widths}
            onChange={setWidth}
          />
        </>
      }
    >
      <div style={{ width: "100%", maxWidth: 320 }}>
        <Skeleton shape={shape} style={sized ? { width } : undefined} />
      </div>
    </Playground>
  );
}
