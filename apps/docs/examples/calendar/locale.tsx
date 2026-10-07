"use client";

import { Calendar } from "@nuvui/date-picker";
import { fr } from "@nuvui/date-picker/locale";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Calendar
      mode="single"
      locale={fr}
      showWeekNumber
      selected={date}
      onSelect={setDate}
    />
  );
}
