"use client";

import { ImageZoom } from "@nuvui/react";
import { useState } from "react";
import { floorPlan } from "@/examples/image-zoom/pictures";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const scales = ["1.5", "2", "3", "4"] as const;

export function ImageZoomPlayground() {
  const [scale, setScale] = useState<(typeof scales)[number]>("2");
  const [hover, setHover] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const attributes = [
    scale === "2" ? "" : `scale={${scale}}`,
    hover ? "" : "hover={false}",
    disabled ? "disabled" : "",
  ].filter(Boolean);

  const code = `<ImageZoom${attributes.map((attribute) => ` ${attribute}`).join("")}>
  <img src="/flat-4b.png" alt="Floor plan of flat 4B" />
</ImageZoom>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="scale"
            value={scale}
            options={scales}
            onChange={setScale}
          />
          <CheckboxControl label="hover" checked={hover} onChange={setHover} />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <ImageZoom scale={Number(scale)} hover={hover} disabled={disabled}>
          {/* biome-ignore lint/performance/noImgElement: a data: address, which next/image has nothing to do for */}
          <img
            src={floorPlan}
            alt="Floor plan of flat 4B: a living room, kitchen, dining area, bathroom, hall and bedroom"
          />
        </ImageZoom>
      </div>
    </Playground>
  );
}
