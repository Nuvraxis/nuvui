import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";

export default function Example() {
  return (
    <ToggleGroup
      type="multiple"
      variant="ghost"
      aria-label="Text style"
      defaultValue={["bold"]}
    >
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  );
}
