"use client";

import {
  CheckboxCard,
  type CheckboxCardProps,
  ChoiceCardDescription,
  ChoiceCardTitle,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Indicator = NonNullable<CheckboxCardProps["indicator"]>;

const indicators = Object.keys({
  start: true,
  end: true,
} satisfies Record<Indicator, true>) as Indicator[];

export function ChoiceCardPlayground() {
  const [indicator, setIndicator] = useState<Indicator>("start");
  const [title, setTitle] = useState("Audit log");
  const [description, setDescription] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const props = [
    indicator !== "start" && `indicator="${indicator}"`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<CheckboxCard${props.map((prop) => ` ${prop}`).join("")}>
  <ChoiceCardTitle>${title}</ChoiceCardTitle>${
    description
      ? `
  <ChoiceCardDescription>Who changed what, kept for a year.</ChoiceCardDescription>`
      : ""
  }
</CheckboxCard>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="indicator"
            value={indicator}
            options={indicators}
            onChange={setIndicator}
          />
          <TextControl
            label="ChoiceCardTitle"
            value={title}
            onChange={setTitle}
          />
          <CheckboxControl
            label="ChoiceCardDescription"
            checked={description}
            onChange={setDescription}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      {/* The card takes its width from what's around it. */}
      <div style={{ inlineSize: "18rem" }}>
        <CheckboxCard indicator={indicator} disabled={disabled}>
          <ChoiceCardTitle>{title}</ChoiceCardTitle>
          {description ? (
            <ChoiceCardDescription>
              Who changed what, kept for a year.
            </ChoiceCardDescription>
          ) : null}
        </CheckboxCard>
      </div>
    </Playground>
  );
}
