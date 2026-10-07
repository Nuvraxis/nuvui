"use client";

import { Badge, type BadgeProps } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl, TextControl } from "./controls";

type Intent = NonNullable<BadgeProps["intent"]>;
type Variant = NonNullable<BadgeProps["variant"]>;

const intents = Object.keys({
  neutral: true,
  primary: true,
  success: true,
  warning: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

const variants = Object.keys({
  solid: true,
  outline: true,
} satisfies Record<Variant, true>) as Variant[];

export function BadgePlayground() {
  const [intent, setIntent] = useState<Intent>("neutral");
  const [variant, setVariant] = useState<Variant>("solid");
  const [label, setLabel] = useState("Draft");

  const props = [
    intent !== "neutral" && `intent="${intent}"`,
    variant !== "solid" && `variant="${variant}"`,
  ].filter(Boolean);
  const code = `<Badge${props.map((prop) => ` ${prop}`).join("")}>${label}</Badge>`;

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
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
          <TextControl label="children" value={label} onChange={setLabel} />
        </>
      }
    >
      <Badge intent={intent} variant={variant}>
        {label}
      </Badge>
    </Playground>
  );
}
