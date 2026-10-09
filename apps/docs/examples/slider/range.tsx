"use client";

import { Label, Slider } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [price, setPrice] = useState([200, 600]);

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
          <span id="slider-price">Price</span>
        </Label>
        <output>
          ${price[0]} to ${price[1]}
        </output>
      </div>
      <Slider
        aria-labelledby="slider-price"
        thumbLabels={["Lowest price", "Highest price"]}
        min={0}
        max={1000}
        step={50}
        minStepsBetweenThumbs={1}
        value={price}
        onValueChange={setPrice}
      />
    </div>
  );
}
