"use client";

import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

// The stand-ups are fixed, the planning session can be moved and not made
// longer, and the rest can be changed freely.
const events: CalendarEvent[] = teamEvents.map((event) =>
  event.id.startsWith("stand-up")
    ? { ...event, readOnly: true }
    : event.id === "planning"
      ? { ...event, resizable: false }
      : event,
);

export default function Example() {
  return (
    <EventCalendar
      aria-label="Team calendar"
      defaultEvents={events}
      defaultPanelOpen={false}
    />
  );
}
