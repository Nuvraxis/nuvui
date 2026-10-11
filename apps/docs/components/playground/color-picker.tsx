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
import { useState } from "react";
import { CheckboxControl, Playground } from "./controls";

export function ColorPickerPlayground() {
  const [input, setInput] = useState(true);
  const [swatches, setSwatches] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const code = `<ColorPicker defaultValue="#2563eb"${disabled ? " disabled" : ""}>
  <ColorPickerTrigger aria-label="Brand color" />
  <ColorPickerContent>
    <ColorPickerArea />
    <ColorPickerHue />${
      input
        ? `
    <ColorPickerInput />`
        : ""
    }${
      swatches
        ? `
    <ColorPickerSwatches aria-label="Presets">
      <ColorPickerSwatch value="#dc2626" aria-label="Red" />
      <ColorPickerSwatch value="#16a34a" aria-label="Green" />
      <ColorPickerSwatch value="#2563eb" aria-label="Blue" />
    </ColorPickerSwatches>`
        : ""
    }
  </ColorPickerContent>
</ColorPicker>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="ColorPickerInput"
            checked={input}
            onChange={setInput}
          />
          <CheckboxControl
            label="ColorPickerSwatches"
            checked={swatches}
            onChange={setSwatches}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <ColorPicker defaultValue="#2563eb" disabled={disabled}>
        <ColorPickerTrigger aria-label="Brand color" />
        <ColorPickerContent>
          <ColorPickerArea />
          <ColorPickerHue />
          {input ? <ColorPickerInput /> : null}
          {swatches ? (
            <ColorPickerSwatches aria-label="Presets">
              <ColorPickerSwatch value="#dc2626" aria-label="Red" />
              <ColorPickerSwatch value="#16a34a" aria-label="Green" />
              <ColorPickerSwatch value="#2563eb" aria-label="Blue" />
            </ColorPickerSwatches>
          ) : null}
        </ColorPickerContent>
      </ColorPicker>
    </Playground>
  );
}
