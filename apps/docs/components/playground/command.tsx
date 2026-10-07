"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function CommandPlayground() {
  const [loop, setLoop] = useState(false);
  const [vimBindings, setVimBindings] = useState(false);
  const [shortcuts, setShortcuts] = useState(true);
  const [placeholder, setPlaceholder] = useState("Type a command");

  const props = [loop && "loop", vimBindings && "vimBindings"].filter(Boolean);
  const item = shortcuts
    ? `<CommandItem>
        New file
        <CommandShortcut>Ctrl+N</CommandShortcut>
      </CommandItem>`
    : "<CommandItem>New file</CommandItem>";
  const code = `<Command label="Commands"${props.map((prop) => ` ${prop}`).join("")}>
  <CommandInput placeholder="${placeholder}" />
  <CommandList>
    <CommandEmpty>No commands found.</CommandEmpty>
    <CommandGroup heading="Files">
      ${item}
      ...
    </CommandGroup>
  </CommandList>
</Command>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
          <CheckboxControl
            label="vimBindings"
            checked={vimBindings}
            onChange={setVimBindings}
          />
          <CheckboxControl
            label="with CommandShortcut"
            checked={shortcuts}
            onChange={setShortcuts}
          />
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
          />
        </>
      }
    >
      <Command
        label="Commands"
        loop={loop}
        vimBindings={vimBindings}
        style={{
          inlineSize: "100%",
          maxInlineSize: 360,
          border: "1px solid var(--color-border)",
        }}
      >
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup heading="Files">
            <CommandItem>
              New file
              {shortcuts ? <CommandShortcut>Ctrl+N</CommandShortcut> : null}
            </CommandItem>
            <CommandItem>
              Open file
              {shortcuts ? <CommandShortcut>Ctrl+O</CommandShortcut> : null}
            </CommandItem>
            <CommandItem>
              Save file
              {shortcuts ? <CommandShortcut>Ctrl+S</CommandShortcut> : null}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </Playground>
  );
}
