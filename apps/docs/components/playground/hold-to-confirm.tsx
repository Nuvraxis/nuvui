"use client";

import { type ButtonProps, HoldToConfirm } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Intent = NonNullable<ButtonProps["intent"]>;

const intents = Object.keys({
  danger: true,
  primary: true,
  secondary: true,
  ghost: true,
} satisfies Record<Intent, true>) as Intent[];

const durations = ["800", "1500", "3000"] as const;

export function HoldToConfirmPlayground() {
  const [intent, setIntent] = useState<Intent>("danger");
  const [duration, setDuration] = useState<(typeof durations)[number]>("1500");
  const [disabled, setDisabled] = useState(false);
  const [confirmed, setConfirmed] = useState(0);

  const props = [
    "onConfirm={remove}",
    intent !== "danger" && `intent="${intent}"`,
    duration !== "1500" && `duration={${duration}}`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<HoldToConfirm ${props.join(" ")}>
  Hold to delete
</HoldToConfirm>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <SelectControl
            label="duration"
            value={duration}
            options={durations}
            onChange={setDuration}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
        <HoldToConfirm
          intent={intent}
          duration={Number(duration)}
          disabled={disabled}
          onConfirm={() => setConfirmed(confirmed + 1)}
        >
          Hold to delete
        </HoldToConfirm>
        <p role="status" style={{ margin: 0 }}>
          Confirmed {confirmed} {confirmed === 1 ? "time" : "times"}
        </p>
      </div>
    </Playground>
  );
}
