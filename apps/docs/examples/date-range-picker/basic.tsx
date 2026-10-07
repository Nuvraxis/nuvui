"use client";

import { DateRangePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 340,
      }}
    >
      <Label id="range-stay-label" htmlFor="range-stay">
        Stay
      </Label>
      <DateRangePicker id="range-stay" aria-labelledby="range-stay-label" />
    </div>
  );
}
