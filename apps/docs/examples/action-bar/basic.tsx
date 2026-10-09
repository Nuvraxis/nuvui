"use client";

import {
  ActionBar,
  ActionBarSelection,
  Button,
  Checkbox,
  Label,
} from "@nuvui/react";
import { useState } from "react";

const messages = [
  { id: "invoice", subject: "Invoice for March" },
  { id: "renewal", subject: "Your plan renews soon" },
  { id: "welcome", subject: "Welcome to the team" },
  { id: "export", subject: "Your export is ready" },
];

export default function Example() {
  const [selected, setSelected] = useState<string[]>(["invoice"]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <ul
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {messages.map((message) => (
          <li
            key={message.id}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <Checkbox
              id={`action-bar-${message.id}`}
              checked={selected.includes(message.id)}
              onCheckedChange={() => toggle(message.id)}
            />
            <Label htmlFor={`action-bar-${message.id}`}>
              {message.subject}
            </Label>
          </li>
        ))}
      </ul>
      <ActionBar
        open={selected.length > 0}
        position="static"
        aria-label="Selected messages"
      >
        <ActionBarSelection>{selected.length} selected</ActionBarSelection>
        <Button intent="secondary" size="sm" onClick={() => setSelected([])}>
          Archive
        </Button>
        <Button intent="ghost" size="sm" onClick={() => setSelected([])}>
          Clear
        </Button>
      </ActionBar>
    </div>
  );
}
