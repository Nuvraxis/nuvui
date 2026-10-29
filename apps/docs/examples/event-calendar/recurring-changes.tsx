"use client";

import {
  type CalendarEvent,
  EventCalendar,
  type EventChange,
} from "@nuvui/scheduler";
import { useState } from "react";
import { at } from "./events";

const initialEvents: CalendarEvent[] = [
  {
    id: "stand-up",
    title: "Stand-up",
    start: at(0, "09:30"),
    end: at(0, "09:45"),
    color: "2",
    recurrence: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  },
  {
    id: "design-review",
    title: "Design review",
    start: at(1, "15:00"),
    end: at(1, "16:00"),
    color: "3",
    recurrence: "FREQ=WEEKLY;BYDAY=TU",
  },
];

// A change in words: what it was, the event, and how it repeats after it.
function describe(change: EventChange): string {
  const { event } = change;
  const parts = [change.type, event.title];
  if (typeof event.recurrence === "string") parts.push(event.recurrence);
  if (event.exceptions?.length) {
    parts.push(`not on ${event.exceptions.join(", ")}`);
  }
  return parts.join(", ");
}

let made = 0;

export default function Example() {
  const [events, setEvents] = useState(initialEvents);
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <EventCalendar
        aria-label="Repeating meetings"
        events={events}
        onEventsChange={(next, change) => {
          setEvents(next);
          made += 1;
          const entry = { id: made, text: describe(change) };
          setLog((was) => [...was, entry]);
        }}
        defaultPanelOpen={false}
      />
      {/* Changing one occurrence is two changes: the series leaves it
          out, and it's made an event of its own. */}
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
