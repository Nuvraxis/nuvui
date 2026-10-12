"use client";

// The board draws through a function, which a server component can't
// pass. So it's in a client component, and the page renders that.
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";

export function Board() {
  return (
    <Kanban
      aria-label="Work"
      defaultValue={[
        { id: "todo", cards: ["brief"] },
        { id: "done", cards: [] },
      ]}
    >
      {(columns) =>
        columns.map((column) => (
          <KanbanColumn key={column.id} value={column.id} label={column.id}>
            <KanbanColumnHeader>{column.id}</KanbanColumnHeader>
            <KanbanCards>
              {column.cards.map((id) => (
                <KanbanCard key={id} value={id} label={id}>
                  {id}
                </KanbanCard>
              ))}
            </KanbanCards>
          </KanbanColumn>
        ))
      }
    </Kanban>
  );
}
