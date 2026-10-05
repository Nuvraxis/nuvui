"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { useState } from "react";

const sizes = { s: "Small", m: "Medium", l: "Large" };

export default function Example() {
  const [size, setSize] = useState("m");

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="size">Size</label>
      <Select value={size} onValueChange={setSize}>
        <SelectTrigger id="size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sizes).map(([value, name]) => (
            <SelectItem key={value} value={value}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p style={{ margin: 0 }}>The value is "{size}".</p>
    </div>
  );
}
