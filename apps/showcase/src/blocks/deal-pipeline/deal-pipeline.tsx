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
import { Badge, Button } from "@nuvui/react";
import { useState } from "react";
import "./deal-pipeline.scss";

const stages = [
  { id: "lead", name: "Lead" },
  { id: "qualified", name: "Qualified" },
  { id: "proposal", name: "Proposal" },
  { id: "won", name: "Won" },
];
const stage = (id: string) =>
  stages.find((other) => other.id === id)?.name ?? id;

interface Deal {
  company: string;
  what: string;
  worth: number;
  owner: string;
}

// Everything here is made up, and stands in for what your server keeps.
const known: Record<string, Deal> = {
  contoso: {
    company: "Contoso",
    what: "Team plan, 40 seats",
    worth: 19200,
    owner: "Ada Lovelace",
  },
  fabrikam: {
    company: "Fabrikam",
    what: "Enterprise plan",
    worth: 64000,
    owner: "Sam Okafor",
  },
  northwind: {
    company: "Northwind Supply",
    what: "Team plan, 12 seats",
    worth: 5760,
    owner: "Lee Chen",
  },
  tailspin: {
    company: "Tailspin Toys",
    what: "Enterprise plan, two regions",
    worth: 88000,
    owner: "Ada Lovelace",
  },
  wingtip: {
    company: "Wingtip",
    what: "Team plan, 25 seats",
    worth: 12000,
    owner: "Sam Okafor",
  },
  adatum: {
    company: "Adatum",
    what: "Enterprise plan",
    worth: 52000,
    owner: "Lee Chen",
  },
};

// The deals the button adds, one at a time.
const waiting: [string, Deal][] = [
  [
    "litware",
    {
      company: "Litware",
      what: "Team plan, 8 seats",
      worth: 3840,
      owner: "Ada Lovelace",
    },
  ],
  [
    "proseware",
    {
      company: "Proseware",
      what: "Enterprise plan",
      worth: 47000,
      owner: "Sam Okafor",
    },
  ],
];

const first: KanbanColumnData[] = [
  { id: "lead", cards: ["contoso", "northwind"] },
  { id: "qualified", cards: ["fabrikam", "wingtip"] },
  { id: "proposal", cards: ["tailspin"] },
  { id: "won", cards: ["adatum"] },
];

// One locale, so the server and the browser write a sum the same way.
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DealPipeline() {
  const [deals, setDeals] = useState(known);
  const [columns, setColumns] = useState(first);
  const [added, setAdded] = useState(0);
  const [said, setSaid] = useState("");

  const worth = (cards: string[]) =>
    cards.reduce((sum, id) => sum + (deals[id]?.worth ?? 0), 0);
  const open = columns
    .filter((column) => column.id !== "won")
    .reduce((sum, column) => sum + worth(column.cards), 0);
  const next = waiting[added];

  function moved(now: KanbanColumnData[], move: KanbanMove) {
    setColumns(now);
    const company = deals[move.card]?.company ?? move.card;
    setSaid(
      move.to.column === "won"
        ? `${company} is won, and locked.`
        : move.from.column === move.to.column
          ? `${company} is now number ${move.to.index + 1} in ${stage(move.to.column)}.`
          : `${company} moved from ${stage(move.from.column)} to ${stage(move.to.column)}.`,
    );
  }

  function add() {
    if (!next) return;
    const [id, deal] = next;
    setDeals((now) => ({ ...now, [id]: deal }));
    setColumns((now) =>
      now.map((column) =>
        column.id === "lead"
          ? { ...column, cards: [id, ...column.cards] }
          : column,
      ),
    );
    setAdded((count) => count + 1);
    setSaid(`${deal.company} was added to Lead.`);
  }

  return (
    <main className="deal-pipeline">
      <header className="deal-pipeline__head">
        <div className="deal-pipeline__about">
          <h1 className="deal-pipeline__title">Pipeline</h1>
          <p className="deal-pipeline__text">
            Move a deal as it comes along. A deal that's won stays where it is.
          </p>
        </div>
        <dl className="deal-pipeline__open">
          <dt className="deal-pipeline__term">Open</dt>
          <dd className="deal-pipeline__sum">{money.format(open)}</dd>
        </dl>
      </header>
      <p className="deal-pipeline__said" role="status">
        {said}
      </p>
      <Kanban
        aria-label="Pipeline"
        className="deal-pipeline__board"
        value={columns}
        onValueChange={moved}
      >
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={stage(column.id)}
            >
              <KanbanColumnHeader
                count={money.format(worth(column.cards))}
                actions={
                  column.id === "lead" ? (
                    <Button
                      intent="secondary"
                      size="sm"
                      disabled={!next}
                      onClick={add}
                    >
                      Add a deal
                    </Button>
                  ) : undefined
                }
              >
                {stage(column.id)}
              </KanbanColumnHeader>
              <KanbanCards empty="No deals">
                {column.cards.map((id) => {
                  const deal = deals[id];
                  if (!deal) return null;
                  return (
                    <KanbanCard
                      key={id}
                      value={id}
                      label={deal.company}
                      disabled={column.id === "won"}
                    >
                      <div className="deal-pipeline__deal">
                        <div className="deal-pipeline__row">
                          <span className="deal-pipeline__company">
                            {deal.company}
                          </span>
                          <span className="deal-pipeline__worth">
                            {money.format(deal.worth)}
                          </span>
                        </div>
                        <span className="deal-pipeline__what">{deal.what}</span>
                        <div className="deal-pipeline__row">
                          <span className="deal-pipeline__owner">
                            {deal.owner}
                          </span>
                          {column.id === "won" ? (
                            <Badge intent="success">Won</Badge>
                          ) : null}
                        </div>
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
