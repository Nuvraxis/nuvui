import { Toolbar, ToolbarButton, ToolbarSeparator } from "@nuvui/react";

export default function Example() {
  return (
    <Toolbar orientation="vertical" aria-label="Drawing tools">
      <ToolbarButton>Select</ToolbarButton>
      <ToolbarButton>Pen</ToolbarButton>
      <ToolbarButton>Shape</ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton>Erase</ToolbarButton>
    </Toolbar>
  );
}
