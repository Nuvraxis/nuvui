"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

export default function Example() {
  return (
    <EventCalendar aria-label="Team calendar" defaultEvents={teamEvents} />
  );
}
