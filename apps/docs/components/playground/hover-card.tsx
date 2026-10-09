"use client";

import {
  HoverCard,
  HoverCardContent,
  type HoverCardContentProps,
  HoverCardTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Side = NonNullable<HoverCardContentProps["side"]>;
type Align = NonNullable<HoverCardContentProps["align"]>;

const sides = Object.keys({
  top: true,
  right: true,
  bottom: true,
  left: true,
} satisfies Record<Side, true>) as Side[];

const aligns = Object.keys({
  start: true,
  center: true,
  end: true,
} satisfies Record<Align, true>) as Align[];

// As text, because a select works in strings.
const delays = ["0", "300", "700", "1500"] as const;

export function HoverCardPlayground() {
  const [side, setSide] = useState<Side>("bottom");
  const [align, setAlign] = useState<Align>("center");
  const [openDelay, setOpenDelay] = useState<(typeof delays)[number]>("700");

  const root = openDelay === "700" ? "" : ` openDelay={${openDelay}}`;
  const props = [
    side !== "bottom" && `side="${side}"`,
    align !== "center" && `align="${align}"`,
  ].filter(Boolean);
  const code = `<HoverCard${root}>
  <HoverCardTrigger href="/people/ada">Ada Lovelace</HoverCardTrigger>
  <HoverCardContent${props.map((prop) => ` ${prop}`).join("")}>
    ...
  </HoverCardContent>
</HoverCard>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="side"
            value={side}
            options={sides}
            onChange={setSide}
          />
          <SelectControl
            label="align"
            value={align}
            options={aligns}
            onChange={setAlign}
          />
          <SelectControl
            label="openDelay"
            value={openDelay}
            options={delays}
            onChange={setOpenDelay}
          />
        </>
      }
    >
      <HoverCard openDelay={Number(openDelay)}>
        <HoverCardTrigger
          href="/docs"
          style={{ fontSize: 14, textDecoration: "underline" }}
        >
          Hover or focus me
        </HoverCardTrigger>
        <HoverCardContent side={side} align={align}>
          <strong>Ada Lovelace</strong>
          <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
            Staff engineer, Payments. Joined in March 2021.
          </p>
        </HoverCardContent>
      </HoverCard>
    </Playground>
  );
}
