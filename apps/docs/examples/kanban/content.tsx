"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";
import { Badge, Button } from "@nuvui/react";
import { useState } from "react";

const names: Record<string, string> = {
  open: "Open",
  review: "In review",
};

const tickets: Record<string, { title: string; urgent?: boolean }> = {
  "T-101": { title: "Export fails for a report over a year", urgent: true },
  "T-102": { title: "Add the customer's VAT number to the invoice" },
  "T-103": { title: "A reminder is sent twice" },
  "T-104": { title: "Locked account after one wrong password", urgent: true },
};

export default function Example() {
  const [opened, setOpened] = useState("No ticket opened yet.");

  return (
    <div style={{ display: "grid", gap: "0.75rem", inlineSize: "100%" }}>
      <Kanban
        aria-label="Tickets"
        defaultValue={[
          { id: "open", cards: ["T-101", "T-102", "T-103"] },
          { id: "review", cards: ["T-104"] },
        ]}
      >
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={names[column.id] ?? column.id}
            >
              <KanbanColumnHeader count={column.cards.length}>
                {names[column.id]}
              </KanbanColumnHeader>
              <KanbanCards empty="No tickets">
                {column.cards.map((id) => (
                  <KanbanCard
                    key={id}
                    value={id}
                    label={`${id}, ${tickets[id]?.title}`}
                  >
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          {id}
                        </span>
                        {tickets[id]?.urgent ? (
                          <Badge intent="danger">Urgent</Badge>
                        ) : null}
                      </div>
                      <div>{tickets[id]?.title}</div>
                      <div>
                        <Button
                          intent="secondary"
                          size="sm"
                          aria-label={`Open ${id}`}
                          onClick={() => setOpened(`Opened ${id}.`)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </KanbanCard>
                ))}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>
      <p role="status" style={{ margin: 0 }}>
        {opened}
      </p>
    </div>
  );
}
