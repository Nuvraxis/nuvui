"use client";

import { Calendar } from "@nuvui/date-picker";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      startMonth={new Date(1940, 0)}
      endMonth={new Date(2026, 11)}
      defaultMonth={new Date(1990, 0)}
      selected={date}
      onSelect={setDate}
    />
  );
}
