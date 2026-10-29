"use client";

import { EventCalendar, type EventChange } from "@nuvui/scheduler";
import { useState } from "react";
import { at } from "./events";

// Bookings and rooms as an app's own API might send them.
interface Booking {
  bookingId: string;
  subject: string;
  from: string;
  to: string;
  roomCode: string;
  notes?: string;
  // Not one of the calendar's, and kept on a booking it changes. A booking
  // made in the calendar has only what the calendar knows.
  bookedBy?: string;
}

interface Room {
  code: string;
  name: string;
  tint: string;
}

const rooms: Room[] = [
  { code: "4B", name: "Room 4B", tint: "1" },
  { code: "2A", name: "Room 2A", tint: "3" },
  { code: "LIB", name: "The library", tint: "5" },
];

const initialBookings: Booking[] = [
  {
    bookingId: "b-101",
    subject: "Quarterly planning",
    from: at(0, "10:00"),
    to: at(0, "12:00"),
    roomCode: "4B",
    bookedBy: "Ines Porter",
  },
  {
    bookingId: "b-102",
    subject: "Interviews",
    from: at(1, "13:00"),
    to: at(1, "15:00"),
    roomCode: "2A",
    notes: "Two candidates, an hour each.",
    bookedBy: "Wren Halloway",
  },
  {
    bookingId: "b-103",
    subject: "Reading group",
    from: at(2, "12:30"),
    to: at(2, "13:30"),
    roomCode: "LIB",
    bookedBy: "Tomas Reyna",
  },
];

export default function Example() {
  const [bookings, setBookings] = useState(initialBookings);
  const [last, setLast] = useState<EventChange<Booking> | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <EventCalendar
        aria-label="Room bookings"
        events={bookings}
        onEventsChange={(next, change) => {
          setBookings(next);
          setLast(change);
        }}
        eventKeys={{
          id: "bookingId",
          title: "subject",
          start: "from",
          end: "to",
          resourceIds: "roomCode",
          description: "notes",
        }}
        resources={rooms}
        resourceKeys={{ id: "code", title: "name", color: "tint" }}
        resourceRequired
        defaultPanelOpen={false}
      />
      <p role="status" style={{ margin: 0 }}>
        {last
          ? `Last change: ${last.type}, ${last.event.subject}, room ${last.event.roomCode}${last.event.bookedBy ? `, booked by ${last.event.bookedBy}` : ""}.`
          : "Nothing changed yet."}
      </p>
    </div>
  );
}
