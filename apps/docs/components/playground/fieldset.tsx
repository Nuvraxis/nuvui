"use client";

import {
  Button,
  Checkbox,
  Fieldset,
  FieldsetLegend,
  Input,
  Label,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function FieldsetPlayground() {
  const [legend, setLegend] = useState("Billing contact");
  const [disabled, setDisabled] = useState(false);

  const code = `<Fieldset${disabled ? " disabled" : ""}>
  <FieldsetLegend>${legend}</FieldsetLegend>
  ...
</Fieldset>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl
            label="FieldsetLegend"
            value={legend}
            onChange={setLegend}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Fieldset
        disabled={disabled}
        style={{ inlineSize: "100%", maxInlineSize: 320 }}
      >
        <FieldsetLegend>{legend}</FieldsetLegend>
        <div style={{ display: "grid", gap: 6 }}>
          <Label htmlFor="playground-fieldset-name">Name</Label>
          <Input id="playground-fieldset-name" />
        </div>
        <Label style={{ "--nuv-label-gap": "8px" } as never}>
          <Checkbox />
          Send invoices by email
        </Label>
        <Button style={{ justifySelf: "start" }}>Save</Button>
      </Fieldset>
    </Playground>
  );
}
