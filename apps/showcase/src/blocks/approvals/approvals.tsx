"use client";

import {
  ActionBar,
  ActionBarSelection,
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  FormattedNumber,
  ListView,
  ListViewItem,
} from "@nuvui/react";
import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./approvals.scss";

// Made-up requests from made-up people. Nothing here is real data.
const requests = [
  {
    id: "REQ-318",
    from: "Ada Lovelace",
    what: "Conference travel, Lisbon",
    amount: 1240,
    when: "Today",
  },
  {
    id: "REQ-317",
    from: "Bo Jensen",
    what: "Two design tool seats",
    amount: 288,
    when: "Today",
  },
  {
    id: "REQ-315",
    from: "Cleo Park",
    what: "Replacement laptop",
    amount: 1899,
    when: "Yesterday",
  },
  {
    id: "REQ-311",
    from: "Dan Abbott",
    what: "Team lunch",
    amount: 96.5,
    when: "Monday",
  },
];

const count = (number: number) =>
  `${number} ${number === 1 ? "request" : "requests"}`;

export default function Approvals() {
  const [waiting, setWaiting] = useState(requests);
  const [selected, setSelected] = useState<string[]>([]);
  const [said, setSaid] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const [next, setNext] = useState<string | null>(null);

  // A decided request's row is gone, and the button that was pressed with
  // it. Focus goes to the row that took its place, not back to the top of
  // the page.
  useEffect(() => {
    if (next === null) return;
    list.current?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus();
    setNext(null);
  }, [next]);

  // Each of these would call your server. What happened is said in a
  // status, because the rows it happened to are gone.
  const decide = (ids: string[], verb: "approved" | "declined") => {
    const first = waiting.findIndex((request) => ids.includes(request.id));
    const left = waiting.filter((request) => !ids.includes(request.id));
    const after = waiting
      .slice(first)
      .find((request) => !ids.includes(request.id));
    setNext((after ?? left.at(-1))?.id ?? null);
    setWaiting((current) =>
      current.filter((request) => !ids.includes(request.id)),
    );
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    setSaid(
      ids.length === 1 ? `${ids[0]} ${verb}.` : `${count(ids.length)} ${verb}.`,
    );
  };

  return (
    <main className="approvals">
      <header className="approvals__head">
        <h1 className="approvals__title">Approvals</h1>
        <p className="approvals__text">
          {waiting.length > 0
            ? `${count(waiting.length)} waiting for you.`
            : "Nothing is waiting for you."}
        </p>
      </header>
      {/* In the page from the start, so a screen reader hears each change. */}
      <p role="status" className="approvals__said">
        {said}
      </p>

      {waiting.length > 0 ? (
        <ListView
          ref={list}
          aria-label="Requests waiting for you"
          className="approvals__list"
          selectionMode="multiple"
          value={selected}
          onValueChange={setSelected}
        >
          {waiting.map((request) => (
            <ListViewItem
              key={request.id}
              value={request.id}
              textValue={request.from}
            >
              <div className="approvals__row">
                <div className="approvals__what">
                  <span className="approvals__from">{request.from}</span>
                  <span className="approvals__text">
                    {request.id}, {request.what}, {request.when}
                  </span>
                </div>
                <FormattedNumber
                  className="approvals__amount"
                  value={request.amount}
                  locale="en-US"
                  currency="USD"
                />
                <div className="approvals__actions">
                  <Button
                    size="sm"
                    intent="secondary"
                    aria-label={`Approve ${request.id}`}
                    onClick={() => decide([request.id], "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    intent="ghost"
                    aria-label={`Decline ${request.id}`}
                    onClick={() => decide([request.id], "declined")}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </ListViewItem>
          ))}
        </ListView>
      ) : (
        <Empty>
          <EmptyMedia>
            <CircleCheck aria-hidden="true" size={24} />
          </EmptyMedia>
          <EmptyTitle>All done</EmptyTitle>
          <EmptyDescription>
            New requests from your team show up here.
          </EmptyDescription>
          <EmptyActions>
            <Button intent="secondary" onClick={() => setWaiting(requests)}>
              Show the examples again
            </Button>
          </EmptyActions>
        </Empty>
      )}

      {/* Right after the list, so Tab goes from the rows to the bar. */}
      <ActionBar open={selected.length > 0} aria-label="Selected requests">
        <ActionBarSelection>{selected.length} selected</ActionBarSelection>
        <Button size="sm" onClick={() => decide(selected, "approved")}>
          Approve
        </Button>
        <Button
          size="sm"
          intent="secondary"
          onClick={() => decide(selected, "declined")}
        >
          Decline
        </Button>
        <Button intent="ghost" size="sm" onClick={() => setSelected([])}>
          Clear
        </Button>
      </ActionBar>
    </main>
  );
}
