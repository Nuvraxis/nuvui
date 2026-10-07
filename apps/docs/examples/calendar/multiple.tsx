"use client";

import { Calendar } from "@nuvui/date-picker";
import { useState } from "react";

export default function Example() {
  const [dates, setDates] = useState<Date[] | undefined>();
  const count = dates?.length ?? 0;

  return (
    <Calendar
      mode="multiple"
      max={5}
      selected={dates}
      onSelect={setDates}
      footer={
        count === 0 ? "Pick up to five days." : `${count} of 5 days picked.`
      }
    />
  );
}
