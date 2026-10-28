"use client";

import { Badge } from "@nuvui/react";
import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { useState } from "react";
import "./room-booking.scss";

// The days are this week's, so the room has bookings whenever it's opened.
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const at = (offset: number, time: string) => `${day(offset)}T${time}`;

// Other teams' bookings can be seen and not changed. Yours can.
const theirs = (
  id: string,
  title: string,
  offset: number,
  from: string,
  to: string,
): CalendarEvent => ({
  id,
  title,
  start: at(offset, from),
  end: at(offset, to),
  color: "7",
  readOnly: true,
});

const initial: CalendarEvent[] = [
  theirs("finance-close", "Finance, month-end close", 0, "09:00", "11:00"),
  theirs("hiring", "Hiring panel", 0, "14:00", "15:30"),
  theirs("sales-sync", "Sales sync", 1, "10:00", "10:30"),
  theirs("board-prep", "Board pack review", 2, "13:00", "15:00"),
  theirs("vendor", "Vendor demo, Corrin Labs", 3, "11:00", "12:00"),
  theirs("all-hands-prep", "All-hands rehearsal", 4, "15:00", "16:30"),
  {
    id: "design-crit",
    title: "Design critique",
    start: at(1, "15:00"),
    end: at(1, "16:00"),
    color: "3",
    description: "Bring printouts of the checkout flow.",
  },
  {
    id: "interview",
    title: "Interview, platform engineer",
    start: at(3, "09:30"),
    end: at(3, "10:30"),
    color: "3",
  },
];

// The browser and the server write a narrow space before AM and PM, or
// a plain one, depending on their version.
const plain = (text: string) => text.replace(/\s/g, " ");
const dayAndTime = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const timeOnly = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const when = (event: CalendarEvent) =>
  plain(
    `${dayAndTime.format(new Date(event.start))} to ${timeOnly.format(new Date(event.end))}`,
  );

const room = {
  name: "Juniper",
  floor: "Floor 3, east wing",
  seats: 10,
  kit: ["Screen and camera", "Whiteboard", "Phone for calls"],
};

export default function RoomBooking() {
  const [events, setEvents] = useState(initial);
  const yours = events
    .filter((event) => !event.readOnly)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  return (
    <main className="room-booking">
      <header className="room-booking__head">
        <div className="room-booking__heading">
          <h1 className="room-booking__title">{room.name} room</h1>
          <p className="room-booking__meta">
            {room.floor}, {room.seats} seats. Click or drag across free time to
            book it.
          </p>
        </div>
        <ul className="room-booking__key" aria-label="Bookings">
          <li className="room-booking__key-item">
            <span
              aria-hidden="true"
              className="room-booking__swatch"
              data-color="3"
            />
            Yours
          </li>
          <li className="room-booking__key-item">
            <span
              aria-hidden="true"
              className="room-booking__swatch"
              data-color="7"
            />
            Other teams
          </li>
        </ul>
      </header>

      <div className="room-booking__layout">
        <EventCalendar
          aria-label={`${room.name} room bookings`}
          events={events}
          onEventsChange={(next, change) =>
            // A new booking is yours, in your color.
            setEvents(
              change.type === "create"
                ? next.map((event) =>
                    event.id === change.event.id
                      ? { ...event, color: "3" }
                      : event,
                  )
                : next,
            )
          }
          views={["day", "week"]}
          hours={[8, 19]}
          scrollToHour={8}
          step={30}
          defaultDuration={30}
          defaultPanelOpen={false}
          preferenceOptions={["twentyFourHours", "showWeekends"]}
          defaultPreferences={{ showWeekends: false }}
          eventFields={["title", "time", "description"]}
          className="room-booking__calendar"
        />

        <aside className="room-booking__side" aria-labelledby="room-yours">
          <h2 className="room-booking__subtitle" id="room-yours">
            Your bookings
          </h2>
          {yours.length > 0 ? (
            <ul className="room-booking__list">
              {yours.map((event) => (
                <li key={event.id} className="room-booking__item">
                  <span className="room-booking__item-title">
                    {event.title}
                  </span>
                  <span className="room-booking__item-time">{when(event)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="room-booking__hint">Nothing booked this week.</p>
          )}
          <h2 className="room-booking__subtitle">In the room</h2>
          <ul className="room-booking__kit">
            {room.kit.map((item) => (
              <li key={item}>
                <Badge intent="neutral">{item}</Badge>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
