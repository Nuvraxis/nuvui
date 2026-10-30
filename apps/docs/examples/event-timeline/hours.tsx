"use client";

import { EventTimeline } from "@nuvui/scheduler";
import { runs, vans } from "./fleet";

export default function Example() {
  return (
    <EventTimeline
      aria-label="Fleet by the hour"
      resources={vans}
      defaultEvents={runs}
      defaultScale="hours"
      scales={["hours", "days"]}
      hours={[6, 20]}
      spans={{ hours: 2 }}
    />
  );
}
