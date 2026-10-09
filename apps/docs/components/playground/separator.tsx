"use client";

import { Separator, type SeparatorProps } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Orientation = NonNullable<SeparatorProps["orientation"]>;

const orientations = Object.keys({
  horizontal: true,
  vertical: true,
} satisfies Record<Orientation, true>) as Orientation[];

export function SeparatorPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [decorative, setDecorative] = useState(true);

  const props = [
    orientation !== "horizontal" && `orientation="${orientation}"`,
    !decorative && "decorative={false}",
  ].filter(Boolean);
  const code = `<Separator${props.map((prop) => ` ${prop}`).join("")} />`;
  const vertical = orientation === "vertical";

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
            label="decorative"
            checked={decorative}
            onChange={setDecorative}
          />
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: vertical ? "row" : "column",
          gap: 12,
          alignItems: vertical ? "center" : "stretch",
          width: vertical ? "auto" : "100%",
          maxWidth: 320,
          fontSize: 14,
        }}
      >
        <span>Before</span>
        <Separator orientation={orientation} decorative={decorative} />
        <span>After</span>
      </div>
    </Playground>
  );
}
