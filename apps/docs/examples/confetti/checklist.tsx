"use client";

import { burstConfetti, Checkbox, Label } from "@nuvui/react";
import { useId, useRef, useState } from "react";

const steps = ["Invite your team", "Connect a data source", "Share a report"];

export default function Example() {
  const id = useId();
  const [done, setDone] = useState<string[]>([]);
  const list = useRef<HTMLUListElement>(null);

  function check(step: string, checked: boolean) {
    const next = checked
      ? [...done, step]
      : done.filter((each) => each !== step);
    setDone(next);
    // The last step, done just now.
    if (checked && next.length === steps.length && list.current) {
      burstConfetti(list.current);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ul
        ref={list}
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {steps.map((step, index) => (
          <li
            key={step}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <Checkbox
              id={`${id}-${index}`}
              checked={done.includes(step)}
              onCheckedChange={(checked) => check(step, checked === true)}
            />
            <Label htmlFor={`${id}-${index}`}>{step}</Label>
          </li>
        ))}
      </ul>
      {/* Words for everyone. The confetti is only decoration. */}
      <p role="status" style={{ margin: 0, minBlockSize: "1.5em" }}>
        {done.length === steps.length ? "All set up." : ""}
      </p>
    </div>
  );
}
