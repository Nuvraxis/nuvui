"use client";

import { Compare } from "@nuvui/react";
import { useState } from "react";
import { kitchenAfter, kitchenBefore } from "@/examples/compare/pictures";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const modes = ["slider", "toggle"] as const;
const orientations = ["horizontal", "vertical"] as const;

// The pictures are data: addresses written into the page, which next/image
// has nothing to do for.
const before = (
  // biome-ignore lint/performance/noImgElement: a data: address, as above
  <img src={kitchenBefore} alt="The kitchen with its old cabinets" />
);
const after = (
  // biome-ignore lint/performance/noImgElement: a data: address, as above
  <img src={kitchenAfter} alt="The kitchen with new wooden cabinets" />
);

export function ComparePlayground() {
  const [mode, setMode] = useState<(typeof modes)[number]>("slider");
  const [orientation, setOrientation] =
    useState<(typeof orientations)[number]>("horizontal");
  const [labels, setLabels] = useState(true);

  const attributes = [
    mode === "slider" ? "" : `mode="${mode}"`,
    orientation === "horizontal" ? "" : `orientation="${orientation}"`,
    labels ? "" : "labels={false}",
  ].filter(Boolean);

  const code = `<Compare${attributes.map((attribute) => `\n  ${attribute}`).join("")}
  before={<img src="/kitchen-before.jpg" alt="The kitchen with its old cabinets" />}
  after={<img src="/kitchen-after.jpg" alt="The kitchen with new wooden cabinets" />}
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="mode"
            value={mode}
            options={modes}
            onChange={setMode}
          />
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <CheckboxControl
            label="labels"
            checked={labels}
            onChange={setLabels}
          />
        </>
      }
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <Compare
          mode={mode}
          orientation={orientation}
          labels={labels}
          before={before}
          after={after}
        />
      </div>
    </Playground>
  );
}
