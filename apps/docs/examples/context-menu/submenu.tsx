import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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
        photo.jpg
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="photo.jpg">
        <ContextMenuItem>Copy link</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Send to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Messages</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
