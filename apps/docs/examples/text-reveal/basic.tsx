"use client";

import { Button, TextReveal } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  // A new key draws it again, so the rise can be seen again here.
  const [run, setRun] = useState(0);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "var(--text-4xl)",
          fontWeight: 600,
          lineHeight: 1.1,
        }}
      >
        <TextReveal key={run} lines={["Every report", "your team asks for"]} />
      </h2>
      <Button intent="secondary" onClick={() => setRun((now) => now + 1)}>
        Play again
      </Button>
    </div>
  );
}
