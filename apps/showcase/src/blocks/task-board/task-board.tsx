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
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";
import "./task-board.scss";

const stages = [
  { id: "backlog", name: "Backlog" },
  { id: "doing", name: "In progress" },
  { id: "review", name: "In review" },
  { id: "done", name: "Done" },
];
const stage = (id: string) =>
  stages.find((other) => other.id === id)?.name ?? id;

// How many tasks can wait for a review at once.
const most = 2;

// Everything here is made up, and stands in for what your server keeps.
const tasks: Record<
  string,
  { title: string; owner: string; initials: string; urgent?: boolean }
> = {
  pricing: {
    title: "Agree the pricing page",
    owner: "Ada Lovelace",
    initials: "AL",
  },
  terms: {
    title: "Have legal read the new terms",
    owner: "Sam Okafor",
    initials: "SO",
    urgent: true,
  },
  emails: {
    title: "Write the launch emails",
    owner: "Lee Chen",
    initials: "LC",
  },
  import: {
    title: "Import customers from the old system",
    owner: "Ada Lovelace",
    initials: "AL",
    urgent: true,
  },
  billing: {
    title: "Switch billing to the new plans",
    owner: "Sam Okafor",
    initials: "SO",
  },
  status: {
    title: "Set up the status page",
    owner: "Lee Chen",
    initials: "LC",
  },
  docs: {
    title: "Publish the setup guide",
    owner: "Ada Lovelace",
    initials: "AL",
  },
};

const first: KanbanColumnData[] = [
  { id: "backlog", cards: ["pricing", "terms", "emails"] },
  { id: "doing", cards: ["import", "billing"] },
  { id: "review", cards: ["status"] },
  { id: "done", cards: ["docs"] },
];

export default function TaskBoard() {
  const [columns, setColumns] = useState(first);
  const [said, setSaid] = useState("");

  // One place decides whether a move is taken, whichever way it was made.
  function take(next: KanbanColumnData[], move: KanbanMove) {
    const title = tasks[move.card]?.title ?? move.card;
    const review = next.find((column) => column.id === "review");
    if (
      move.to.column === "review" &&
      move.from.column !== "review" &&
      review &&
      review.cards.length > most
    ) {
      setSaid(
        `In review takes ${most} tasks at a time. "${title}" stays in ${stage(move.from.column)}.`,
      );
      return;
    }
    setColumns(next);
    setSaid(
      move.from.column === move.to.column
        ? `"${title}" is now number ${move.to.index + 1} in ${stage(move.to.column)}.`
        : `"${title}" moved from ${stage(move.from.column)} to ${stage(move.to.column)}.`,
    );
  }

  // From a card's menu: to the end of the column that was chosen.
  function send(card: string, to: string) {
    const from = columns.find((column) => column.cards.includes(card));
    const target = columns.find((column) => column.id === to);
    if (!from || !target || from === target) return;
    take(
      columns.map((column) => {
        if (column === from) {
          return {
            ...column,
            cards: column.cards.filter((other) => other !== card),
          };
        }
        if (column === target) {
          return { ...column, cards: [...column.cards, card] };
        }
        return column;
      }),
      {
        card,
        from: { column: from.id, index: from.cards.indexOf(card) },
        to: { column: to, index: target.cards.length },
      },
    );
  }

  return (
    <main className="task-board">
      <header className="task-board__head">
        <h1 className="task-board__title">Launch plan</h1>
        <p className="task-board__text">
          Drag a task to another column, or use its menu. From the keyboard,
          press Space on a task's handle and move it with the arrow keys.
        </p>
      </header>
      <p className="task-board__said" role="status">
        {said}
      </p>
      <Kanban
        aria-label="Launch plan"
        className="task-board__board"
        value={columns}
        onValueChange={take}
      >
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={stage(column.id)}
            >
              <KanbanColumnHeader
                count={
                  column.id === "review"
                    ? `${column.cards.length} of ${most}`
                    : column.cards.length
                }
              >
                {stage(column.id)}
              </KanbanColumnHeader>
              <KanbanCards empty="No tasks">
                {column.cards.map((id) => {
                  const task = tasks[id];
                  if (!task) return null;
                  return (
                    <KanbanCard key={id} value={id} label={task.title}>
                      <div className="task-board__task">
                        <span className="task-board__name">{task.title}</span>
                        <div className="task-board__meta">
                          <Avatar size="sm">
                            <AvatarFallback>{task.initials}</AvatarFallback>
                          </Avatar>
                          <span className="task-board__owner">
                            {task.owner}
                          </span>
                          {task.urgent ? (
                            <Badge intent="danger">Urgent</Badge>
                          ) : null}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              intent="ghost"
                              size="sm"
                              className="task-board__menu"
                              aria-label={`Move to: ${task.title}`}
                            >
                              Move to
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Move to</DropdownMenuLabel>
                            {stages
                              .filter((other) => other.id !== column.id)
                              .map((other) => (
                                <DropdownMenuItem
                                  key={other.id}
                                  onSelect={() => send(id, other.id)}
                                >
                                  {other.name}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </KanbanCard>
                  );
                })}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>
    </main>
  );
}
