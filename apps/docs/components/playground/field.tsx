"use client";

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function FieldPlayground() {
  const [required, setRequired] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [description, setDescription] = useState("We send receipts here.");
  const [error, setError] = useState("");

  const props = [required && "required", disabled && "disabled"].filter(
    Boolean,
  );
  const code = `<Field${props.map((prop) => ` ${prop}`).join("")}>
  <FieldLabel>Email</FieldLabel>
  <FieldControl>
    <Input type="email" />
  </FieldControl>${description ? `\n  <FieldDescription>${description}</FieldDescription>` : ""}${error ? `\n  <FieldError>${error}</FieldError>` : ""}
</Field>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl
            label="FieldDescription"
            value={description}
            onChange={setDescription}
          />
          <TextControl label="FieldError" value={error} onChange={setError} />
          <CheckboxControl
            label="required"
            checked={required}
            onChange={setRequired}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Field
        required={required}
        disabled={disabled}
        style={{ inlineSize: "100%", maxInlineSize: 320 }}
      >
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input type="email" />
        </FieldControl>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError>{error}</FieldError>
      </Field>
    </Playground>
  );
}
