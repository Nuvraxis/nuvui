"use client";

import { HoloCard } from "@nuvui/react";
import { type CSSProperties, useState } from "react";
import { CheckboxControl, Playground } from "./controls";

export function HoloCardPlayground() {
  const [shine, setShine] = useState(true);
  const [texture, setTexture] = useState(true);
  const [lift, setLift] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const props = `${shine ? "" : " shine={false}"}${texture ? "" : " texture={false}"}${lift ? "" : " lift={false}"}${disabled ? " disabled" : ""}`;
  const code = `<HoloCard${props} style={face}>
  <MemberCard />
</HoloCard>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl label="shine" checked={shine} onChange={setShine} />
          <CheckboxControl
            label="texture"
            checked={texture}
            onChange={setTexture}
          />
          <CheckboxControl label="lift" checked={lift} onChange={setLift} />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <HoloCard
        shine={shine}
        texture={texture}
        lift={lift}
        disabled={disabled}
        style={
          {
            "--nuv-holo-card-bg": "var(--color-primary)",
            "--nuv-holo-card-fg": "var(--color-primary-foreground)",
            inlineSize: "100%",
            maxInlineSize: 340,
          } as CSSProperties
        }
      >
        <div style={{ display: "grid", gap: 24, padding: 24 }}>
          <strong style={{ fontSize: "var(--text-xl)" }}>Gold member</strong>
          <span>Sajan</span>
        </div>
      </HoloCard>
    </Playground>
  );
}
