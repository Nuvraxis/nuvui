"use client";

import { Rating, type RatingProps } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Size = NonNullable<RatingProps["size"]>;

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

const counts = ["3", "5", "10"] as const;
const values = ["0", "1.5", "3", "4.5"] as const;

export function RatingPlayground() {
  const [size, setSize] = useState<Size>("md");
  const [max, setMax] = useState<(typeof counts)[number]>("5");
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [shown, setShown] = useState<(typeof values)[number]>("3");

  const props = [
    readOnly ? `readOnly value={${shown}}` : "defaultValue={3}",
    size !== "md" && `size="${size}"`,
    max !== "5" && `max={${max}}`,
    disabled && !readOnly && "disabled",
  ].filter(Boolean);
  const code = `<Rating aria-label="Rating" ${props.join(" ")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <SelectControl
            label="max"
            value={max}
            options={counts}
            onChange={setMax}
          />
          <CheckboxControl
            label="readOnly"
            checked={readOnly}
            onChange={setReadOnly}
          />
          {readOnly ? (
            <SelectControl
              label="value"
              value={shown}
              options={values}
              onChange={setShown}
            />
          ) : (
            <CheckboxControl
              label="disabled"
              checked={disabled}
              onChange={setDisabled}
            />
          )}
        </>
      }
    >
      {readOnly ? (
        <Rating readOnly size={size} max={Number(max)} value={Number(shown)} />
      ) : (
        <Rating
          // A new group when the number of stars changes, so the three it
          // starts with are counted against the new number.
          key={max}
          aria-label="Rating"
          size={size}
          max={Number(max)}
          defaultValue={3}
          disabled={disabled}
        />
      )}
    </Playground>
  );
}
