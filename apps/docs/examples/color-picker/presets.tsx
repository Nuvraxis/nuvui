"use client";

import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@nuvui/react";
import { useState } from "react";

// The colors a label can have, and no others.
const labels = [
  { value: "#b91c1c", name: "Urgent" },
  { value: "#c2410c", name: "Waiting" },
  { value: "#15803d", name: "Done" },
  { value: "#1d4ed8", name: "In review" },
  { value: "#6d28d9", name: "Idea" },
  { value: "#475569", name: "Archived" },
];

export default function Example() {
  const [color, setColor] = useState("#15803d");
  const name = labels.find((label) => label.value === color)?.name;

  return (
    <ColorPicker value={color} onValueChange={setColor}>
      <ColorPickerTrigger aria-label="Label color">{name}</ColorPickerTrigger>
      <ColorPickerContent>
        <ColorPickerSwatches aria-label="Label colors">
          {labels.map((label) => (
            <ColorPickerSwatch
              key={label.value}
              value={label.value}
              aria-label={label.name}
            />
          ))}
        </ColorPickerSwatches>
      </ColorPickerContent>
    </ColorPicker>
  );
}
