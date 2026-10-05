"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [last, setLast] = useState("Nothing yet");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button intent="secondary">File</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setLast("New file")}>
            New file
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("Open")}>
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("Save")}>
            Save
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p style={{ margin: 0 }}>Last chosen: {last}</p>
    </div>
  );
}
