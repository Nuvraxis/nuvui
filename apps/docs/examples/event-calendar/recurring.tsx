"use client";

import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { at, day } from "./events";

// Each starts in the week the page is read in. A rule is an RRULE or the
// same as an object.
const events: CalendarEvent[] = [
  {
    id: "stand-up",
    title: "Stand-up",
    start: at(0, "09:30"),
    end: at(0, "09:45"),
    color: "2",
    recurrence: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  },
  {
    id: "one-to-one",
    title: "One to one with Tomas Reyna",
    start: at(1, "14:00"),
    end: at(1, "14:30"),
    color: "6",
    recurrence: { frequency: "weekly", interval: 2 },
  },
  {
    id: "running",
    title: "Running club",
    start: at(1, "18:00"),
    end: at(1, "19:00"),
    color: "4",
    recurrence: "FREQ=WEEKLY;BYDAY=TU,TH;COUNT=8",
    // Not this Thursday.
    exceptions: [day(3)],
  },
  {
    id: "payroll",
    title: "Payroll",
    start: day(4),
    end: day(4),
    allDay: true,
    color: "8",
    recurrence: "FREQ=MONTHLY",
  },
];

export default function Example() {
  return <EventCalendar aria-label="Team calendar" defaultEvents={events} />;
}
