"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";

const names: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

const cards: Record<string, { title: string; owner: string }> = {
  brief: { title: "Write the brief", owner: "Ana" },
  quote: { title: "Send the quote to Contoso", owner: "Sam" },
  call: { title: "Call the supplier", owner: "Ana" },
  invoice: { title: "Raise the invoice", owner: "Lee" },
  contract: { title: "Sign the contract", owner: "Sam" },
};

const columns = [
  { id: "todo", cards: ["brief", "quote", "call"] },
  { id: "doing", cards: ["invoice"] },
  { id: "done", cards: ["contract"] },
];

export default function Example() {
  return (
    <Kanban aria-label="Work for Contoso" defaultValue={columns}>
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
            <KanbanCards empty="Nothing here yet">
              {column.cards.map((id) => (
                <KanbanCard key={id} value={id} label={cards[id]?.title ?? id}>
                  <div>{cards[id]?.title}</div>
                  <div style={{ color: "var(--color-muted-foreground)" }}>
                    {cards[id]?.owner}
                  </div>
                </KanbanCard>
              ))}
            </KanbanCards>
          </KanbanColumn>
        ))
      }
    </Kanban>
  );
}
