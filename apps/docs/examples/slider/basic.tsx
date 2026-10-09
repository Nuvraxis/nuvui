"use client";

import { Label, Slider } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [volume, setVolume] = useState([40]);

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Label asChild>
          <span id="slider-volume">Volume</span>
        </Label>
        <output>{volume[0]}%</output>
      </div>
      <Slider
        aria-labelledby="slider-volume"
        value={volume}
        onValueChange={setVolume}
      />
    </div>
  );
}
