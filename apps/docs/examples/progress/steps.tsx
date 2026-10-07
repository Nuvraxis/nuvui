"use client";

import { Progress } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 320 }}>
      <Progress
        aria-label="Setup"
        size="sm"
        value={2}
        max={5}
        getValueLabel={(value, max) => `Step ${value} of ${max}`}
      />
      <Progress aria-label="Setup" value={2} max={5} />
      <Progress aria-label="Setup" size="lg" value={2} max={5} />
    </div>
  );
}
