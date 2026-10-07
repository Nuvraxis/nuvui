"use client";

import { Calendar } from "@nuvui/date-picker";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | undefined>();

  return <Calendar mode="single" selected={date} onSelect={setDate} />;
}
