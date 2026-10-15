"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

const prices = [19, 24, 49];

export default function Example() {
  const [plan, setPlan] = useState(1);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <span style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}>
        <AnimatedNumber
          value={prices[plan] ?? 0}
          animation="pop"
          currency="GBP"
          locale="en-GB"
          maximumFractionDigits={0}
        />
      </span>
      <Button
        intent="secondary"
        onClick={() => setPlan((now) => (now + 1) % prices.length)}
      >
        Next plan
      </Button>
    </div>
  );
}
