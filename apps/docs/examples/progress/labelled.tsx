"use client";

import { Button, Progress } from "@nuvui/react";
import { useEffect, useId, useState } from "react";

export default function Example() {
  const [value, setValue] = useState(0);
  const labelId = useId();
  const running = value > 0 && value < 100;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setValue((current) => Math.min(current + 10, 100)),
      400,
    );
    return () => clearInterval(timer);
  }, [running]);

  return (
    <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 320 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
        }}
      >
        <span id={labelId}>Uploading report.pdf</span>
        <span aria-hidden="true">{value}%</span>
      </div>
      <Progress aria-labelledby={labelId} value={value} />
      <Button
        intent="secondary"
        size="sm"
        style={{ justifySelf: "start" }}
        onClick={() => setValue(value === 0 || value === 100 ? 10 : value)}
        aria-disabled={running}
      >
        {value === 100 ? "Upload again" : "Start the upload"}
      </Button>
    </div>
  );
}
