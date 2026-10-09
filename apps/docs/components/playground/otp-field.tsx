"use client";

import { OtpField, type OtpFieldProps } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Validation = NonNullable<OtpFieldProps["validationType"]>;

const validations = Object.keys({
  numeric: true,
  alpha: true,
  alphanumeric: true,
  none: true,
} satisfies Record<Validation, true>) as Validation[];

const lengths = ["4", "6", "8"] as const;
const groups = ["none", "2", "3", "4"] as const;

export function OtpFieldPlayground() {
  const [length, setLength] = useState<(typeof lengths)[number]>("6");
  const [group, setGroup] = useState<(typeof groups)[number]>("none");
  const [validation, setValidation] = useState<Validation>("numeric");
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const props = [
    length !== "6" && `length={${length}}`,
    group !== "none" && `groupSize={${group}}`,
    validation !== "numeric" && `validationType="${validation}"`,
    disabled && "disabled",
    invalid && "aria-invalid",
  ].filter(Boolean);
  const code = `<OtpField aria-label="Code"${props.map((prop) => ` ${prop}`).join("")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="length"
            value={length}
            options={lengths}
            onChange={setLength}
          />
          <SelectControl
            label="groupSize"
            value={group}
            options={groups}
            onChange={setGroup}
          />
          <SelectControl
            label="validationType"
            value={validation}
            options={validations}
            onChange={setValidation}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="aria-invalid"
            checked={invalid}
            onChange={setInvalid}
          />
        </>
      }
    >
      <OtpField
        // The number of boxes is fixed once the field is on the page.
        key={length}
        aria-label="Code"
        length={Number(length)}
        groupSize={group === "none" ? undefined : Number(group)}
        validationType={validation}
        disabled={disabled}
        aria-invalid={invalid || undefined}
      />
    </Playground>
  );
}
