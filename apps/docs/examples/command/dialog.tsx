"use client";

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from "@nuvui/react";
import { useState } from "react";

const pages = ["Dashboard", "Orders", "Customers", "Invoices", "Settings"];
const actions = ["Create an order", "Invite a teammate", "Export as CSV"];

export default function Example() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("");

  // Running a command closes the palette. That's yours to do.
  const run = (command: string) => {
    setLast(command);
    setOpen(false);
  };

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      <p style={{ margin: 0, fontSize: 14 }}>
        Or press <Kbd>Ctrl</Kbd> <Kbd>J</Kbd>
      </p>
      <output style={{ fontSize: 14 }}>{last ? `Ran: ${last}` : null}</output>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        // This site's own search has Ctrl+K.
        shortcut="j"
        label="Search commands"
      >
        <CommandInput placeholder="Where to, or what to do" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {pages.map((page) => (
              <CommandItem key={page} onSelect={run}>
                {page}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            {actions.map((action) => (
              <CommandItem key={action} onSelect={run}>
                {action}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
