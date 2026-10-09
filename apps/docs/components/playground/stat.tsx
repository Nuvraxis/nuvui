"use client";

import {
  Stat,
  StatDescription,
  StatLabel,
  type StatProps,
  StatValue,
  Trend,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Variant = NonNullable<StatProps["variant"]>;

const variants = Object.keys({
  card: true,
  plain: true,
} satisfies Record<Variant, true>) as Variant[];

export function StatPlayground() {
  const [variant, setVariant] = useState<Variant>("card");
  const [label, setLabel] = useState("Revenue");
  const [value, setValue] = useState("$48,250");
  const [description, setDescription] = useState(true);

  const code = `<Stat${variant === "card" ? "" : ` variant="${variant}"`}>
  <StatLabel>${label}</StatLabel>
  <StatValue>${value}</StatValue>${
    description
      ? `
  <StatDescription>
    <Trend value={0.125} /> against last month
  </StatDescription>`
      : ""
  }
</Stat>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
          <TextControl label="StatLabel" value={label} onChange={setLabel} />
          <TextControl label="StatValue" value={value} onChange={setValue} />
          <CheckboxControl
            label="StatDescription"
            checked={description}
            onChange={setDescription}
          />
        </>
      }
    >
      <Stat variant={variant} style={{ minInlineSize: "14rem" }}>
        <StatLabel>{label}</StatLabel>
        <StatValue>{value}</StatValue>
        {description ? (
          <StatDescription>
            <Trend value={0.125} /> against last month
          </StatDescription>
        ) : null}
      </Stat>
    </Playground>
  );
}
