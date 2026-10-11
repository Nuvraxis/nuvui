"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerPanel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [color, setColor] = useState("#db2777");
  const [saved, setSaved] = useState<string[]>([]);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <ColorPicker
        value={color}
        onValueChange={setColor}
        // Once for each drag, where onValueChange is called all through it.
        onValueCommit={(value) => setSaved((before) => [...before, value])}
      >
        <ColorPickerPanel>
          <ColorPickerArea />
          <ColorPickerHue />
        </ColorPickerPanel>
      </ColorPicker>
      <p role="status" style={{ margin: 0, fontSize: 14 }}>
        Saved {saved.length} {saved.length === 1 ? "time" : "times"}
        {saved.length > 0 ? `, last as ${saved.at(-1)}` : ""}.
      </p>
    </div>
  );
}
