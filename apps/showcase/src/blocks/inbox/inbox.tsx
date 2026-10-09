"use client";

import {
  ActionBar,
  ActionBarSelection,
  Button,
  Checkbox,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  HoldToConfirm,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label,
} from "@nuvui/react";
import { Inbox as InboxIcon } from "lucide-react";
import { useState } from "react";
import "./inbox.scss";

// Made-up messages. `at` is the time for a machine, and `when` is how
// you'd say it.
const messages = [
  {
    id: "1",
    from: "Grace Hopper",
    subject: "Invoice INV-2041 is ready to approve",
    at: "2026-10-09T09:42",
    when: "9:42",
    unread: true,
  },
  {
    id: "2",
    from: "Alan Turing",
    subject: "Refund for order ORD-7228",
    at: "2026-10-09T08:55",
    when: "8:55",
    unread: true,
  },
  {
    id: "3",
    from: "Katherine Johnson",
    subject: "Three people are waiting for a seat",
    at: "2026-10-08T16:10",
    when: "Yesterday",
    unread: false,
  },
  {
    id: "4",
    from: "Ada Lovelace",
    subject: "Your plan renews on 1 November",
    at: "2026-10-07T11:31",
    when: "Tuesday",
    unread: false,
  },
  {
    id: "5",
    from: "Edsger Dijkstra",
    subject: "The September report is exported",
    at: "2026-10-06T11:02",
    when: "Monday",
    unread: false,
  },
];

const count = (number: number) =>
  `${number} ${number === 1 ? "message" : "messages"}`;

export default function Inbox() {
  const [shown, setShown] = useState(messages);
  const [selected, setSelected] = useState<string[]>(["1"]);
  const [said, setSaid] = useState("");

  const all = shown.length > 0 && selected.length === shown.length;
  const picked = (message: { id: string }) => selected.includes(message.id);

  // Each of these would call your server. What happened is said in a
  // status, because the rows it happened to are gone or changed.
  const read = () => {
    setShown(
      shown.map((message) =>
        picked(message) ? { ...message, unread: false } : message,
      ),
    );
    setSaid(`${count(selected.length)} marked as read.`);
    setSelected([]);
  };
  const remove = (verb: string) => {
    setShown(shown.filter((message) => !picked(message)));
    setSaid(`${count(selected.length)} ${verb}.`);
    setSelected([]);
  };

  return (
    <main className="inbox">
      <header className="inbox__head">
        <h1 className="inbox__title">Inbox</h1>
        {shown.length > 0 ? (
          <div className="inbox__all">
            <Checkbox
              id="inbox-all"
              checked={
                all ? true : selected.length > 0 ? "indeterminate" : false
              }
              onCheckedChange={() =>
                setSelected(all ? [] : shown.map((message) => message.id))
              }
            />
            <Label htmlFor="inbox-all">Select all</Label>
          </div>
        ) : null}
      </header>
      {/* In the page from the start, so a screen reader hears each change. */}
      <p role="status" className="inbox__said">
        {said}
      </p>

      {shown.length > 0 ? (
        <ItemGroup variant="outline" aria-label="Messages">
          {shown.map((message) => (
            <Item key={message.id}>
              <ItemMedia>
                <Checkbox
                  aria-label={`Select "${message.subject}"`}
                  checked={picked(message)}
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked === true
                        ? [...current, message.id]
                        : current.filter((id) => id !== message.id),
                    )
                  }
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle
                  className={message.unread ? "inbox__unread" : undefined}
                >
                  {message.subject}
                  {/* The weight shows it. This says it. */}
                  {message.unread ? (
                    <span className="inbox__hidden">, unread</span>
                  ) : null}
                </ItemTitle>
                <ItemDescription>
                  {message.from},{" "}
                  <time dateTime={message.at}>{message.when}</time>
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <Empty>
          <EmptyMedia>
            <InboxIcon aria-hidden="true" size={24} />
          </EmptyMedia>
          <EmptyTitle>Nothing left</EmptyTitle>
          <EmptyDescription>
            New messages from your team show up here.
          </EmptyDescription>
          <EmptyActions>
            <Button intent="secondary" onClick={() => setShown(messages)}>
              Show the examples again
            </Button>
          </EmptyActions>
        </Empty>
      )}

      {/* Right after the list, so Tab goes from the rows to the bar. */}
      <ActionBar open={selected.length > 0} aria-label="Selected messages">
        <ActionBarSelection>{selected.length} selected</ActionBarSelection>
        <Button intent="secondary" size="sm" onClick={read}>
          Mark as read
        </Button>
        <Button intent="secondary" size="sm" onClick={() => remove("archived")}>
          Archive
        </Button>
        {/* Archiving can be undone from the archive. Deleting can't. */}
        <HoldToConfirm size="sm" onConfirm={() => remove("deleted")}>
          Hold to delete
        </HoldToConfirm>
        <Button intent="ghost" size="sm" onClick={() => setSelected([])}>
          Clear
        </Button>
      </ActionBar>
    </main>
  );
}
