"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerPanel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [color, setColor] = useState("#0d9488");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <ColorPicker value={color} onValueChange={setColor}>
        <ColorPickerPanel>
          <ColorPickerArea />
          <ColorPickerHue />
          <ColorPickerInput />
        </ColorPickerPanel>
      </ColorPicker>
      <p style={{ margin: 0, fontSize: 14 }}>The color is {color}.</p>
    </div>
  );
}
