"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";
import { useState } from "react";
import { CheckboxControl, Playground } from "./controls";

const names: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

const titles: Record<string, string> = {
  brief: "Write the brief",
  quote: "Send the quote",
  invoice: "Raise the invoice",
};

const columns = [
  { id: "todo", cards: ["brief", "quote"] },
  { id: "doing", cards: ["invoice"] },
  { id: "done", cards: [] },
];

export function KanbanPlayground() {
  const [disabled, setDisabled] = useState(false);
  const [counted, setCounted] = useState(true);
  const [empty, setEmpty] = useState(true);

  const code = `<Kanban aria-label="Work" defaultValue={columns}${
    disabled ? " disabled" : ""
  }>
  {(columns) =>
    columns.map((column) => (
      <KanbanColumn key={column.id} value={column.id} label={names[column.id]}>
        <KanbanColumnHeader${counted ? " count={column.cards.length}" : ""}>
          {names[column.id]}
        </KanbanColumnHeader>
        <KanbanCards${empty ? ' empty="Nothing here yet"' : ""}>
          {column.cards.map((id) => (
            <KanbanCard key={id} value={id} label={titles[id]}>
              {titles[id]}
            </KanbanCard>
          ))}
        </KanbanCards>
      </KanbanColumn>
    ))
  }
</Kanban>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="count"
            checked={counted}
            onChange={setCounted}
          />
          <CheckboxControl label="empty" checked={empty} onChange={setEmpty} />
        </>
      }
    >
      <Kanban aria-label="Work" defaultValue={columns} disabled={disabled}>
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={names[column.id] ?? column.id}
            >
              <KanbanColumnHeader
                count={counted ? column.cards.length : undefined}
              >
                {names[column.id]}
              </KanbanColumnHeader>
              <KanbanCards empty={empty ? "Nothing here yet" : undefined}>
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
    </Playground>
  );
}
