"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-tokyo">Launch day in Tokyo</Label>
      <DatePicker
        id="picker-tokyo"
        timeZone="Asia/Tokyo"
        value={date}
        onValueChange={setDate}
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        {date
          ? `Midnight in Tokyo is ${new Date(date.getTime()).toISOString()} in UTC.`
          : "No date picked."}
      </p>
    </div>
  );
}
