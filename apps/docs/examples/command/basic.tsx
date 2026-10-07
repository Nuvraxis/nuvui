import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@nuvui/react";

export default function Example() {
  return (
    <Command
      label="Commands"
      style={{
        inlineSize: "100%",
        maxInlineSize: 420,
        border: "1px solid var(--color-border)",
      }}
    >
      <CommandInput placeholder="Type a command or search" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Files">
          <CommandItem aria-keyshortcuts="Control+N">
            New file
            <CommandShortcut>Ctrl+N</CommandShortcut>
          </CommandItem>
          <CommandItem aria-keyshortcuts="Control+O">
            Open file
            <CommandShortcut>Ctrl+O</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>Save a copy</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="View">
          <CommandItem keywords={["dark", "light", "appearance"]}>
            Toggle theme
          </CommandItem>
          <CommandItem>Zoom in</CommandItem>
          <CommandItem>Zoom out</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
