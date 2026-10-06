"use client";

import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [align, setAlign] = useState("left");

  return (
    <ToggleGroup
      type="single"
      aria-label="Alignment"
      value={align}
      // Radix sends an empty string when the pressed button is pressed
      // again. Ignoring it keeps one of them always picked.
      onValueChange={(value) => {
        if (value) setAlign(value);
      }}
    >
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  );
}
