"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  type AccordionProps,
  AccordionTrigger,
  type AccordionTriggerProps,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Type = AccordionProps["type"];
type Level = NonNullable<AccordionTriggerProps["headingLevel"]>;

const types = Object.keys({
  single: true,
  multiple: true,
} satisfies Record<Type, true>) as Type[];

// Object keys are always strings, so the select works in `${Level}` and the
// number is put back where the prop is passed.
const levels = Object.keys({
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
} satisfies Record<Level, true>) as `${Level}`[];

const items = [
  ["shipping", "How long does shipping take?", "Three to five working days."],
  ["returns", "Can I send something back?", "Yes, within 30 days."],
  ["warranty", "Is there a warranty?", "Two years on everything."],
] as const;

export function AccordionPlayground() {
  const [type, setType] = useState<Type>("single");
  const [collapsible, setCollapsible] = useState(true);
  const [level, setLevel] = useState<`${Level}`>("3");
  const [disabled, setDisabled] = useState(false);

  const props = [
    `type="${type}"`,
    type === "single" && collapsible && "collapsible",
    disabled && "disabled",
  ].filter(Boolean);
  const heading = level === "3" ? "" : ` headingLevel={${level}}`;
  const code = `<Accordion ${props.join(" ")}>
  <AccordionItem value="shipping">
    <AccordionTrigger${heading}>How long does shipping take?</AccordionTrigger>
    <AccordionContent>Three to five working days.</AccordionContent>
  </AccordionItem>
  ...
</Accordion>`;

  const children = items.map(([value, question, answer]) => (
    <AccordionItem key={value} value={value}>
      <AccordionTrigger headingLevel={Number(level) as Level}>
        {question}
      </AccordionTrigger>
      <AccordionContent>{answer}</AccordionContent>
    </AccordionItem>
  ));
  const style = { inlineSize: "100%" };

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="type"
            value={type}
            options={types}
            onChange={setType}
          />
          <SelectControl
            label="headingLevel"
            value={level}
            options={levels}
            onChange={setLevel}
          />
          {type === "single" && (
            <CheckboxControl
              label="collapsible"
              checked={collapsible}
              onChange={setCollapsible}
            />
          )}
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      {/* The two types keep their open items in different shapes, a string
          and an array, so each gets its own element and starts fresh. */}
      {type === "single" ? (
        <Accordion
          key="single"
          type="single"
          collapsible={collapsible}
          disabled={disabled}
          style={style}
        >
          {children}
        </Accordion>
      ) : (
        <Accordion
          key="multiple"
          type="multiple"
          disabled={disabled}
          style={style}
        >
          {children}
        </Accordion>
      )}
    </Playground>
  );
}
