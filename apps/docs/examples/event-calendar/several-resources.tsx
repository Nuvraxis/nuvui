"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { meetings, officeResources } from "./office";

export default function Example() {
  return (
    <EventCalendar
      aria-label="Meetings"
      resources={officeResources}
      defaultEvents={meetings}
      multipleResources
      resourceRequired
      defaultCollapsedResources={["people"]}
    />
  );
}
