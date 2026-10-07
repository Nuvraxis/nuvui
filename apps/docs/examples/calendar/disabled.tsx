"use client";

import { Calendar } from "@nuvui/date-picker";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | undefined>();
  const today = new Date();

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      // Nothing before today, and no weekends.
      disabled={[{ before: today }, { dayOfWeek: [0, 6] }]}
      startMonth={today}
    />
  );
}
