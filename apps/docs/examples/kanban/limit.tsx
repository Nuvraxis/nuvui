"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  type KanbanColumnData,
  KanbanColumnHeader,
  type KanbanMove,
} from "@nuvui/kanban";
import { useState } from "react";

const names: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

const titles: Record<string, string> = {
  brief: "Write the brief",
  quote: "Send the quote",
  call: "Call the supplier",
  invoice: "Raise the invoice",
  contract: "Sign the contract",
};

// How many cards "Doing" takes.
const most = 2;

export default function Example() {
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    { id: "todo", cards: ["brief", "quote", "call"] },
    { id: "doing", cards: ["invoice", "contract"] },
    { id: "done", cards: [] },
  ]);
  const [said, setSaid] = useState("Nothing moved yet.");

  function moved(next: KanbanColumnData[], move: KanbanMove) {
    const doing = next.find((column) => column.id === "doing");
    const title = titles[move.card] ?? move.card;
    // Not taking the new columns is what refuses a move: the card goes
    // back to where it was.
    if (move.from.column !== "doing" && doing && doing.cards.length > most) {
      setSaid(`Doing takes ${most} cards. ${title} stays where it was.`);
      return;
    }
    setColumns(next);
    setSaid(`${title} is in ${names[move.to.column]}.`);
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", inlineSize: "100%" }}>
      <Kanban aria-label="Work" value={columns} onValueChange={moved}>
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={names[column.id] ?? column.id}
            >
              <KanbanColumnHeader
                count={
                  column.id === "doing"
                    ? `${column.cards.length} of ${most}`
                    : column.cards.length
                }
              >
                {names[column.id]}
              </KanbanColumnHeader>
              <KanbanCards empty="Nothing here yet">
                {column.cards.map((id) => (
                  <KanbanCard key={id} value={id} label={titles[id] ?? id}>
                    {titles[id]}
                  </KanbanCard>
                ))}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>
      <p role="status" style={{ margin: 0 }}>
        {said}
      </p>
    </div>
  );
}
