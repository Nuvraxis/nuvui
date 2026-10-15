"use client";

import { Button, TextReveal } from "@nuvui/react";
import { useState } from "react";
import { Playground, TextControl } from "./controls";

export function TextRevealPlayground() {
  const [first, setFirst] = useState("Every report");
  const [second, setSecond] = useState("your team asks for");
  const [run, setRun] = useState(0);

  const code = `<h1>
  <TextReveal lines={[${JSON.stringify(first)}, ${JSON.stringify(second)}]} />
</h1>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="first line" value={first} onChange={setFirst} />
          <TextControl
            label="second line"
            value={second}
            onChange={setSecond}
          />
        </>
      }
    >
      <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-4xl)",
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          <TextReveal key={run} lines={[first, second]} />
        </p>
        <Button intent="secondary" onClick={() => setRun((now) => now + 1)}>
          Play again
        </Button>
      </div>
    </Playground>
  );
}
