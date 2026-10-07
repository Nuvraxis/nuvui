"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react";
import { useState } from "react";

const more = ["Billing address", "Tax number", "Purchase order"];

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      style={{ width: "100%", maxWidth: 360, fontSize: 14 }}
    >
      <ul style={{ margin: 0, paddingInlineStart: 20 }}>
        <li>Company name</li>
        <li>Contact email</li>
      </ul>
      <CollapsibleContent>
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {more.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button intent="ghost" size="sm" style={{ marginBlockStart: 8 }}>
          {open ? "Show fewer fields" : `Show ${more.length} more fields`}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
