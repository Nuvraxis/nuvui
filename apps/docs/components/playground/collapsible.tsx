"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function CollapsiblePlayground() {
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState("Show the details");

  const props = [open && "open", disabled && "disabled"].filter(Boolean);
  const code = `<Collapsible${props.map((prop) => ` ${prop}`).join("")}>
  <CollapsibleTrigger asChild>
    <Button intent="secondary">${label}</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>Request ID 7f3a-22c1.</p>
  </CollapsibleContent>
</Collapsible>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="trigger" value={label} onChange={setLabel} />
          <CheckboxControl label="open" checked={open} onChange={setOpen} />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        style={{ width: "100%", maxWidth: 320 }}
      >
        <CollapsibleTrigger asChild>
          <Button intent="secondary">{label}</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p style={{ margin: 0, paddingBlockStart: 12, fontSize: 14 }}>
            Request ID 7f3a-22c1.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </Playground>
  );
}
