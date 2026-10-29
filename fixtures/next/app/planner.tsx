"use client";

// A calendar that's edited takes a function for its changes, which a
// server component can't pass. So it's in a client component, with an
// item of the app's own to drag onto it.
import {
  type CalendarEvent,
  type CalendarResource,
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
    resourceIds: ["4b"],
  },
  {
    id: "stand-up",
    title: "Stand-up",
    start: "2026-10-12T09:30",
    end: "2026-10-12T09:45",
    recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
    exceptions: ["2026-10-16"],
  },
];

const resources: CalendarResource[] = [
  { id: "rooms", title: "Rooms", children: [{ id: "4b", title: "Room 4B" }] },
];

// An app's own shape, read with eventKeys, comes back in the same shape.
interface Booking {
  bookingId: string;
  subject: string;
  from: string;
  to: string;
}

const bookings: Booking[] = [
  {
    bookingId: "b-1",
    subject: "Interviews",
    from: "2026-10-15T13:00",
    to: "2026-10-15T14:00",
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
        resources={resources}
        onEventsChange={(next: CalendarEvent[], change: EventChange) => {
          if (change.type === "delete") console.info(next.length);
        }}
        timeZone="UTC"
        defaultDate={new Date("2026-10-15T12:00:00Z")}
        defaultPanelOpen={false}
        scrollToHour={8}
      />
      <EventCalendar
        aria-label="Bookings"
        defaultEvents={bookings}
        eventKeys={{
          id: "bookingId",
          title: "subject",
          start: "from",
          end: "to",
        }}
        onEventsChange={(next: Booking[]) => console.info(next[0]?.subject)}
        timeZone="UTC"
        defaultDate={new Date("2026-10-15T12:00:00Z")}
        defaultPanelOpen={false}
      />
    </>
  );
}
