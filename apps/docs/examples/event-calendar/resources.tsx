"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { officeEvents, officeResources } from "./office";

export default function Example() {
  return (
    <EventCalendar
      aria-label="Office calendar"
      resources={officeResources}
      defaultEvents={officeEvents}
    />
  );
}
