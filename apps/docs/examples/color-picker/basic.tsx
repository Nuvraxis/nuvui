"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@nuvui/react";

const presets = [
  { value: "#dc2626", name: "Red" },
  { value: "#ea580c", name: "Orange" },
  { value: "#ca8a04", name: "Yellow" },
  { value: "#16a34a", name: "Green" },
  { value: "#2563eb", name: "Blue" },
  { value: "#7c3aed", name: "Violet" },
];

export default function Example() {
  return (
    <ColorPicker defaultValue="#2563eb">
      <ColorPickerTrigger aria-label="Brand color" />
      <ColorPickerContent>
        <ColorPickerArea />
        <ColorPickerHue />
        <ColorPickerInput />
        <ColorPickerSwatches aria-label="Presets">
          {presets.map((preset) => (
            <ColorPickerSwatch
              key={preset.value}
              value={preset.value}
              aria-label={preset.name}
            />
          ))}
        </ColorPickerSwatches>
      </ColorPickerContent>
    </ColorPicker>
  );
}
