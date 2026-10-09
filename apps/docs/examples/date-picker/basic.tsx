"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-due">Due date</Label>
      <DatePicker id="picker-due" />
    </div>
  );
}
