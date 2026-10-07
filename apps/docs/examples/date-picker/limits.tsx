"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

// Midnight at the start of today, and of the day 90 days on.
const today = new Date();
today.setHours(0, 0, 0, 0);
const last = new Date(today);
last.setDate(last.getDate() + 90);

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
      <Label htmlFor="picker-delivery">Delivery date</Label>
      <DatePicker
        id="picker-delivery"
        min={today}
        max={last}
        disabledDates={{ dayOfWeek: [0, 6] }}
        invalidMessage="Enter a weekday in the next 90 days."
      />
    </div>
  );
}
