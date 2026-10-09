import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        style={{
          display: "grid",
          placeItems: "center",
          inlineSize: "min(100%, 18rem)",
          blockSize: "7rem",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          fontSize: 14,
        }}
      >
        Right-click, or press and hold
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="report.pdf">
        <ContextMenuLabel>report.pdf</ContextMenuLabel>
        <ContextMenuItem>
          Open
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>Share</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem intent="danger">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
