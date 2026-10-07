"use client";

import { AspectRatio } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

const ratios = {
  "1": 1,
  "4 / 3": 4 / 3,
  "16 / 9": 16 / 9,
  "21 / 9": 21 / 9,
  "3 / 4": 3 / 4,
} as const;
type Ratio = keyof typeof ratios;
const names = Object.keys(ratios) as Ratio[];

export function AspectRatioPlayground() {
  const [ratio, setRatio] = useState<Ratio>("16 / 9");

  const code = `<AspectRatio ratio={${ratio}}>
  <img src="/mountains.jpg" alt="Mountains under a low sun" />
</AspectRatio>`;

  return (
    <Playground
      code={code}
      controls={
        <SelectControl
          label="ratio"
          value={ratio}
          options={names}
          onChange={setRatio}
        />
      }
    >
      <div style={{ width: "100%", maxWidth: 280 }}>
        <AspectRatio ratio={ratios[ratio]}>
          <div
            style={{
              display: "grid",
              placeItems: "center",
              backgroundColor: "var(--color-muted)",
              fontSize: 14,
            }}
          >
            {ratio}
          </div>
        </AspectRatio>
      </div>
    </Playground>
  );
}
