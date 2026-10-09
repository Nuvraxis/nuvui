"use client";

import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

const actions = ["Open", "Rename", "Move"];

export default function Example() {
  const [last, setLast] = useState("nothing yet");

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "min(100%, 20rem)" }}>
      <ContextMenu>
        <ContextMenuTrigger
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 8px 8px 16px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 14,
          }}
        >
          report.pdf
          {/* The same actions, for everyone who doesn't right-click. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                intent="ghost"
                size="sm"
                aria-label="Actions for report.pdf"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <circle cx="3" cy="8" r="1.25" />
                  <circle cx="8" cy="8" r="1.25" />
                  <circle cx="13" cy="8" r="1.25" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem key={action} onSelect={() => setLast(action)}>
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="report.pdf">
          {actions.map((action) => (
            <ContextMenuItem key={action} onSelect={() => setLast(action)}>
              {action}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
      <p style={{ margin: 0, fontSize: 14 }}>Last chosen: {last}</p>
    </div>
  );
}
