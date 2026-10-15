"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [seats, setSeats] = useState(1280);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <span style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}>
        <AnimatedNumber value={seats} />
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <Button intent="secondary" onClick={() => setSeats((now) => now - 37)}>
          Remove 37
        </Button>
        <Button intent="secondary" onClick={() => setSeats((now) => now + 145)}>
          Add 145
        </Button>
      </div>
    </div>
  );
}
