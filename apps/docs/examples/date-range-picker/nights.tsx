"use client";

import { DateRangePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

const today = new Date();
today.setHours(0, 0, 0, 0);

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
      <Label id="range-trip-label" htmlFor="range-trip">
        Trip
      </Label>
      <DateRangePicker
        id="range-trip"
        aria-labelledby="range-trip-label"
        min={today}
        startLabel="Check-in"
        endLabel="Check-out"
        // At least two nights and at most fourteen.
        calendar={{ min: 2, max: 14 }}
      />
    </div>
  );
}
