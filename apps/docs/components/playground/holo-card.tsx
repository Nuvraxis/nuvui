"use client";

import { HoloCard } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground } from "./controls";

export function HoloCardPlayground() {
  const [shine, setShine] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const props = `${shine ? "" : " shine={false}"}${disabled ? " disabled" : ""}`;
  const code = `<HoloCard${props}>
  <MemberCard />
</HoloCard>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl label="shine" checked={shine} onChange={setShine} />
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
        disabled={disabled}
        style={{ inlineSize: "100%", maxInlineSize: 340 }}
      >
        <div
          style={{
            display: "grid",
            gap: 24,
            padding: 24,
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
        >
          <strong style={{ fontSize: "var(--text-xl)" }}>Gold member</strong>
          <span>Sajan</span>
        </div>
      </HoloCard>
    </Playground>
  );
}
