import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react";

export default function Example() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup
        type="single"
        defaultValue="left"
        aria-label="Alignment"
      >
        <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
        <ToolbarToggleItem value="center">Center</ToolbarToggleItem>
        <ToolbarToggleItem value="right">Right</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarLink href="#formatting-help">Help</ToolbarLink>
      <ToolbarButton>Share</ToolbarButton>
    </Toolbar>
  );
}
