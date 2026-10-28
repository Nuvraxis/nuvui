"use client";

import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import "./team-calendar.scss";

// The days are this week's, so the calendar has something on whenever it's
// opened. A real one would load them from your server.
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const at = (offset: number, time: string) => `${day(offset)}T${time}`;

// Which calendar an event is from, and its color.
const calendars = [
  { name: "Team", color: "1" },
  { name: "Clients", color: "3" },
  { name: "Leave", color: "6" },
  { name: "Releases", color: "5" },
] as const;
const color = (name: (typeof calendars)[number]["name"]) =>
  calendars.find((calendar) => calendar.name === name)?.color;

const events: CalendarEvent[] = [
  ...[0, 1, 2, 3, 4].map((offset) => ({
    id: `stand-up-${offset}`,
    title: "Stand-up",
    start: at(offset, "09:30"),
    end: at(offset, "09:45"),
    color: color("Team"),
  })),
  {
    id: "planning",
    title: "Sprint planning",
    start: at(0, "10:00"),
    end: at(0, "11:30"),
    color: color("Team"),
  },
  {
    id: "kickoff",
    title: "Kick-off with Pellworth Dairy",
    start: at(0, "11:00"),
    end: at(0, "12:00"),
    color: color("Clients"),
  },
  {
    id: "leave-rafa",
    title: "Rafa Okonjo on leave",
    start: day(1),
    end: day(3),
    allDay: true,
    color: color("Leave"),
  },
  {
    id: "workshop",
    title: "Content workshop",
    start: at(1, "13:00"),
    end: at(1, "15:30"),
    color: color("Team"),
  },
  {
    id: "call",
    title: "Call with Tarn Valley Rail",
    start: at(1, "14:00"),
    end: at(1, "14:30"),
    color: color("Clients"),
  },
  {
    id: "one-to-one",
    title: "One-to-one, Mei and Jonas",
    start: at(2, "11:00"),
    end: at(2, "11:30"),
    color: color("Team"),
  },
  {
    id: "review",
    title: "Design review",
    start: at(2, "15:00"),
    end: at(2, "16:00"),
    color: color("Team"),
  },
  {
    id: "release",
    title: "Release 3.8",
    start: day(3),
    end: day(3),
    allDay: true,
    color: color("Releases"),
  },
  {
    id: "demo",
    title: "Demo for Pellworth Dairy",
    start: at(3, "16:00"),
    end: at(3, "17:00"),
    color: color("Clients"),
  },
  {
    id: "retro",
    title: "Retrospective",
    start: at(4, "14:00"),
    end: at(4, "15:00"),
    color: color("Team"),
  },
  {
    id: "drinks",
    title: "Team drinks",
    start: at(4, "17:30"),
    end: at(4, "19:00"),
    color: color("Team"),
  },
  {
    id: "leave-ana",
    title: "Ana Brightwater on leave",
    start: day(7),
    end: day(11),
    allDay: true,
    color: color("Leave"),
  },
];

export default function TeamCalendar() {
  return (
    <main className="team-calendar">
      <header className="team-calendar__head">
        <div className="team-calendar__heading">
          <h1 className="team-calendar__title">Product team</h1>
          <p className="team-calendar__meta">
            Six people, four calendars, one week at a time.
          </p>
        </div>
        <ul className="team-calendar__key" aria-label="Calendars">
          {calendars.map((calendar) => (
            <li key={calendar.name} className="team-calendar__key-item">
              <span
                aria-hidden="true"
                className="team-calendar__swatch"
                data-color={calendar.color}
              />
              {calendar.name}
            </li>
          ))}
        </ul>
      </header>
      <EventCalendar
        aria-label="Product team calendar"
        events={events}
        hours={[7, 21]}
        scrollToHour={8}
        className="team-calendar__calendar"
      />
    </main>
  );
}
