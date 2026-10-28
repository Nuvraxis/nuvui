"use client";

// A calendar that's edited takes a function for its changes, which a
// server component can't pass. So it's in a client component, with an
// item of the app's own to drag onto it.
import {
  type CalendarEvent,
  EventCalendar,
  type EventChange,
  eventDragProps,
} from "@nuvui/scheduler";

const events: CalendarEvent[] = [
  {
    id: "review",
    title: "Review",
    start: "2026-10-15T09:00",
    end: "2026-10-15T10:00",
  },
];

export function Planner() {
  return (
    <>
      <div {...eventDragProps({ title: "Write notes", duration: 30 })}>
        Write notes
      </div>
      <EventCalendar
        aria-label="Planner"
        defaultEvents={events}
        onEventsChange={(next: CalendarEvent[], change: EventChange) => {
          if (change.type === "delete") console.info(next.length);
        }}
        timeZone="UTC"
        defaultDate={new Date("2026-10-15T12:00:00Z")}
        defaultPanelOpen={false}
        scrollToHour={8}
      />
    </>
  );
}
