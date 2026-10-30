"use client";

import { EventTimeline } from "@nuvui/scheduler";
import { runs, vans } from "./fleet";

export default function Example() {
  return (
    <EventTimeline aria-label="Fleet" resources={vans} defaultEvents={runs} />
  );
}
