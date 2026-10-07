import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from "@nuvui/react";

export default function Example() {
  return (
    <Toolbar aria-label="Document">
      <ToolbarButton>Save</ToolbarButton>
      <ToolbarButton>Print</ToolbarButton>
      <ToolbarSeparator />
      <DropdownMenu>
        <ToolbarButton asChild>
          <DropdownMenuTrigger>Export</DropdownMenuTrigger>
        </ToolbarButton>
        <DropdownMenuContent>
          <DropdownMenuItem>PDF</DropdownMenuItem>
          <DropdownMenuItem>Word document</DropdownMenuItem>
          <DropdownMenuItem>Plain text</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Toolbar>
  );
}
