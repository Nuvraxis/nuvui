"use client";

import { type EventChange, EventTimeline } from "@nuvui/scheduler";
import { useState } from "react";
import { runs, vans } from "./fleet";

// A change in words: what it was, the event, and the vans it's on.
function describe(change: EventChange): string {
  const { event } = change;
  const on = event.resourceIds?.length
    ? `on ${event.resourceIds.join(", ")}`
    : "on no van";
  return `${change.type}, ${event.title}, ${on}`;
}

let made = 0;

export default function Example() {
  const [events, setEvents] = useState(runs);
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <EventTimeline
        aria-label="Fleet you hold"
        resources={vans}
        events={events}
        onEventsChange={(next, change) => {
          setEvents(next);
          made += 1;
          const entry = { id: made, text: describe(change) };
          setLog((was) => [...was, entry]);
        }}
      />
      <ol aria-label="Changes" style={{ margin: 0, paddingInlineStart: 20 }}>
        {log.length === 0 ? (
          <li>Nothing changed yet.</li>
        ) : (
          log.slice(-4).map((entry) => <li key={entry.id}>{entry.text}</li>)
        )}
      </ol>
    </div>
  );
}
