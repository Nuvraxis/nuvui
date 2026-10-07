"use client";

import { Calendar, type DateRange } from "@nuvui/date-picker";
import { useState } from "react";

export default function Example() {
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <Calendar
      mode="range"
      numberOfMonths={2}
      selected={range}
      onSelect={setRange}
    />
  );
}
