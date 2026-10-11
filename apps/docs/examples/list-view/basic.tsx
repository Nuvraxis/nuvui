"use client";

import { Badge, Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const people = [
  { id: "ada", name: "Ada Lovelace", role: "Owner" },
  { id: "bo", name: "Bo Jensen", role: "Admin" },
  { id: "cleo", name: "Cleo Park", role: "Member" },
  { id: "dan", name: "Dan Abbott", role: "Member" },
];

export default function Example() {
  const [said, setSaid] = useState("");

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <ListView aria-label="People">
        {people.map((person) => (
          <ListViewItem key={person.id} value={person.id}>
            <span style={{ flex: 1, minInlineSize: 0 }}>{person.name}</span>
            <Badge variant="outline">{person.role}</Badge>
            <Button
              size="sm"
              intent="secondary"
              aria-label={`Message ${person.name}`}
              onClick={() => setSaid(`Message to ${person.name} started.`)}
            >
              Message
            </Button>
          </ListViewItem>
        ))}
      </ListView>
      <p role="status" style={{ margin: 0, minBlockSize: 20, fontSize: 14 }}>
        {said}
      </p>
    </div>
  );
}
