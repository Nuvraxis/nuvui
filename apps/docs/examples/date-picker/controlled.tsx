"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Button, Label } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <Label htmlFor="picker-start">Start date</Label>
        <DatePicker id="picker-start" value={date} onValueChange={setDate} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button intent="secondary" onClick={() => setDate(new Date())}>
          Today
        </Button>
        <Button intent="ghost" onClick={() => setDate(null)}>
          Clear
        </Button>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>
        {date ? date.toDateString() : "No date picked."}
      </p>
    </div>
  );
}
