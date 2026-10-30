"use client";

import { TZDate } from "@nuvui/date-picker";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { useState } from "react";

const zones = ["Europe/London", "America/New_York", "Asia/Tokyo"];

// A day written out, and nine o'clock on it in London as a moment. A date
// given to the calendar is drawn by the server, so it can't be today's: a
// page built ahead of time would have another day to the browser.
const day = "2026-10-14";
const nine = new TZDate(2026, 9, 14, 9, 0, "Europe/London");

// A call at nine in London, and a deadline at five in New York. Each is
// written with its own zone, and drawn in the one chosen.
const events: CalendarEvent[] = [
  {
    id: "call",
    title: "Call with the London office",
    start: `${day}T09:00`,
    end: `${day}T10:00`,
    timeZone: "Europe/London",
    color: "3",
  },
  {
    id: "deadline",
    title: "Filing deadline, New York",
    start: `${day}T17:00`,
    end: `${day}T17:30`,
    timeZone: "America/New_York",
    color: "8",
  },
];

export default function Example() {
  const [zone, setZone] = useState(zones[0] ?? "UTC");

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <div style={{ display: "grid", gap: 6, maxInlineSize: 240 }}>
        <Label htmlFor="calendar-zone">Shown in</Label>
        <Select value={zone} onValueChange={setZone}>
          <SelectTrigger id="calendar-zone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zones.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* It opens on the day of the call, in whichever zone is shown. */}
      <EventCalendar
        aria-label="Calls across offices"
        events={events}
        timeZone={zone}
        defaultDate={nine}
        defaultView="day"
        defaultPanelOpen={false}
        scrollToHour={0}
      />
    </div>
  );
}
