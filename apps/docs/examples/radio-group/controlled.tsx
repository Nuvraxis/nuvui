"use client";

import { RadioGroup, RadioGroupItem } from "@nuvui/react";
import { useState } from "react";

const row = { display: "flex", alignItems: "center", gap: 8 };
const prices = { month: "$12 a month", year: "$120 a year" };

export default function Example() {
  const [period, setPeriod] = useState<keyof typeof prices>("month");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <RadioGroup
        aria-label="Billing period"
        value={period}
        onValueChange={(value) => setPeriod(value as keyof typeof prices)}
      >
        <div style={row}>
          <RadioGroupItem value="month" id="radio-month" />
          <label htmlFor="radio-month">Monthly</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="year" id="radio-year" />
          <label htmlFor="radio-year">Yearly</label>
        </div>
      </RadioGroup>
      <output aria-live="polite">You pay {prices[period]}.</output>
    </div>
  );
}
