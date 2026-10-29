"use client";

import {
  type CalendarEvent,
  EventCalendar,
  type EventChange,
} from "@nuvui/scheduler";
import { useState } from "react";
import { teamEvents } from "./events";

export default function Example() {
  const [events, setEvents] = useState<CalendarEvent[]>(teamEvents);
  const [last, setLast] = useState<EventChange | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        onEventsChange={(next, change) => {
          setEvents(next);
          setLast(change);
        }}
        defaultPanelOpen={false}
      />
      <p role="status" style={{ margin: 0 }}>
        {last
          ? `Last change: ${last.type}, ${last.event.title || "Untitled"}.`
          : "Nothing changed yet."}
      </p>
    </div>
  );
}
