"use client";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState("name");

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
        Sorted by {sort}
        {hidden ? ", hidden files shown" : ""}
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="View">
        <ContextMenuCheckboxItem checked={hidden} onCheckedChange={setHidden}>
          Show hidden files
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
          <ContextMenuLabel>Sort by</ContextMenuLabel>
          <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          <ContextMenuRadioItem value="date">Date</ContextMenuRadioItem>
          <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
