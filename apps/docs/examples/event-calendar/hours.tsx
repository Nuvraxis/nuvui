"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

export default function Example() {
  return (
    <EventCalendar
      aria-label="Working hours"
      events={teamEvents}
      hours={[8, 18]}
      scrollToHour={8}
      views={["day", "week"]}
      defaultPreferences={{ showWeekends: false }}
      defaultPanelOpen={false}
    />
  );
}
