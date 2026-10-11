"use client";

import { ThreadList, ThreadListGroup, ThreadListItem } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useState } from "react";

const all = [
  { id: "overdue", title: "Overdue invoices for Contoso", when: "Today" },
  { id: "reminder", title: "Draft a payment reminder", when: "Today" },
  { id: "terms", title: "What our payment terms say", when: "Yesterday" },
  {
    id: "forecast",
    title: "Cash forecast for the next quarter, by month and by customer",
    when: "Yesterday",
  },
];

const bin = (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 4.5h11M6 4.5v-2h4v2M4 4.5l.6 8.5a1 1 0 0 0 1 1h4.8a1 1 0 0 0 1-1l.6-8.5" />
  </svg>
);

export default function Example() {
  const [threads, setThreads] = useState(all);
  const [open, setOpen] = useState<string | null>("overdue");
  const days = [...new Set(threads.map((thread) => thread.when))];

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 300,
      }}
    >
      <ThreadList
        aria-label="Conversations"
        value={open}
        onValueChange={setOpen}
      >
        {days.map((day) => (
          <ThreadListGroup key={day} label={day}>
            {threads
              .filter((thread) => thread.when === day)
              .map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  value={thread.id}
                  actions={
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label={`Delete ${thread.title}`}
                      style={{ aspectRatio: "1", padding: 0 }}
                      onClick={() => {
                        setThreads((now) =>
                          now.filter((other) => other !== thread),
                        );
                        if (open === thread.id) setOpen(null);
                      }}
                    >
                      {bin}
                    </Button>
                  }
                >
                  {thread.title}
                </ThreadListItem>
              ))}
          </ThreadListGroup>
        ))}
      </ThreadList>
      <p role="status" style={{ margin: 0 }}>
        {open
          ? `Open: ${threads.find((thread) => thread.id === open)?.title}`
          : "None is open."}
      </p>
    </div>
  );
}
