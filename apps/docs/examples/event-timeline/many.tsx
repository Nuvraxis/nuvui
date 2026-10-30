"use client";

import {
  type CalendarEvent,
  type CalendarResource,
  EventTimeline,
} from "@nuvui/scheduler";
import { useMemo } from "react";
import { day } from "../event-calendar/events";

// Two thousand machines, each booked for a few days at a time over three
// years. Only the rows and columns in view are drawn.
function plant() {
  const resources: CalendarResource[] = [];
  const events: CalendarEvent[] = [];
  for (let machine = 1; machine <= 2000; machine += 1) {
    resources.push({ id: `m${machine}`, title: `Machine ${machine}` });
    // The same bookings every time, without anything random.
    for (let at = -540 + (machine % 9); at < 540; at += 12 + (machine % 5)) {
      events.push({
        id: `m${machine}-${at}`,
        title: `Job ${machine}.${at + 540}`,
        start: day(at),
        end: day(at + 1 + (machine % 4)),
        allDay: true,
        color: String((machine % 8) + 1),
        resourceIds: [`m${machine}`],
      });
    }
  }
  return { resources, events };
}

export default function Example() {
  const { resources, events } = useMemo(plant, []);
  return (
    <EventTimeline
      aria-label="Machines"
      resources={resources}
      defaultEvents={events}
      spans={{ days: 36 }}
    />
  );
}
