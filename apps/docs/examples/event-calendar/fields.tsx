"use client";

import { Input, Label } from "@nuvui/react";
import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

// The app's own field, kept on its events beside the calendar's.
type Booking = CalendarEvent & { room?: string };

export default function Example() {
  return (
    <EventCalendar
      aria-label="Team calendar"
      defaultEvents={teamEvents}
      defaultPanelOpen={false}
      eventFields={["title", "time", "description"]}
      renderEventFields={({ event, changes, onChange, readOnly }) => {
        const room = (changes.room ?? (event as Booking).room ?? "") as string;
        if (readOnly) return room ? <p>Room: {room}</p> : null;
        return (
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="booking-room">Room</Label>
            <Input
              id="booking-room"
              value={room}
              onChange={(input) => onChange({ room: input.target.value })}
            />
          </div>
        );
      }}
    />
  );
}
