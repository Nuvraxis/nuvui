"use client";

import { Trend, type TrendProps } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl, TextControl } from "./controls";

type Good = NonNullable<TrendProps["good"]>;
type Variant = NonNullable<TrendProps["variant"]>;

const goods = Object.keys({
  up: true,
  down: true,
} satisfies Record<Good, true>) as Good[];

const variants = Object.keys({
  plain: true,
  outline: true,
} satisfies Record<Variant, true>) as Variant[];

export function TrendPlayground() {
  const [text, setText] = useState("0.125");
  const [good, setGood] = useState<Good>("up");
  const [variant, setVariant] = useState<Variant>("plain");

  // Whatever is typed, the component gets a number.
  const parsed = Number(text);
  const value = Number.isFinite(parsed) ? parsed : 0;

  const props = [
    `value={${value}}`,
    good !== "up" && `good="${good}"`,
    variant !== "plain" && `variant="${variant}"`,
  ].filter(Boolean);
  const code = `<Trend ${props.join(" ")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="value" value={text} onChange={setText} />
          <SelectControl
            label="good"
            value={good}
            options={goods}
            onChange={setGood}
          />
          <SelectControl
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
        </>
      }
    >
      <Trend value={value} good={good} variant={variant} />
    </Playground>
  );
}
