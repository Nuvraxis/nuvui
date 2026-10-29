"use client";

import { Button } from "@nuvui/react";
import {
  type CalendarEvent,
  EventCalendar,
  eventDragProps,
} from "@nuvui/scheduler";
import { useState } from "react";
import "./shift-planner.scss";

// The days are this week's, so the rota has shifts whenever it's opened.
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const at = (offset: number, time: string) => `${day(offset)}T${time}`;

const roles = [
  { name: "Barista", color: "2" },
  { name: "Kitchen", color: "4" },
  { name: "Floor", color: "8" },
] as const;
type Role = (typeof roles)[number]["name"];
const colorOf = (role: Role) => roles.find((item) => item.name === role)?.color;

const staff: { name: string; role: Role; hours: number }[] = [
  { name: "Ilse Marrow", role: "Barista", hours: 32 },
  { name: "Teo Vantrell", role: "Barista", hours: 20 },
  { name: "Kemi Ashgrove", role: "Kitchen", hours: 36 },
  { name: "Dario Pell", role: "Kitchen", hours: 16 },
  { name: "Wren Halloway", role: "Floor", hours: 24 },
];

// A shift is an event titled with who works it, and their role kept on it.
type Shift = CalendarEvent & { person?: string };
const shift = (
  person: string,
  offset: number,
  from: string,
  to: string,
): Shift => {
  const role = staff.find((member) => member.name === person)?.role;
  return {
    id: `${person}-${offset}-${from}`,
    title: person,
    person,
    start: at(offset, from),
    end: at(offset, to),
    color: role ? colorOf(role) : undefined,
  };
};

const initial: Shift[] = [
  shift("Ilse Marrow", 0, "06:30", "14:30"),
  shift("Kemi Ashgrove", 0, "07:00", "15:00"),
  shift("Wren Halloway", 0, "11:00", "17:00"),
  shift("Teo Vantrell", 1, "12:00", "18:00"),
  shift("Kemi Ashgrove", 1, "07:00", "15:00"),
  shift("Ilse Marrow", 2, "06:30", "14:30"),
  shift("Dario Pell", 2, "11:00", "19:00"),
  shift("Wren Halloway", 3, "11:00", "17:00"),
  shift("Kemi Ashgrove", 3, "07:00", "15:00"),
  shift("Ilse Marrow", 4, "06:30", "12:30"),
  shift("Teo Vantrell", 4, "12:00", "18:00"),
];

// How many hours each person is down for.
function hoursOf(events: readonly Shift[], person: string) {
  const minutes = events
    .filter((event) => event.person === person)
    .reduce(
      (total, event) =>
        total +
        (new Date(event.end).getTime() - new Date(event.start).getTime()) /
          60_000,
      0,
    );
  return Math.round((minutes / 60) * 10) / 10;
}

const plain = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function ShiftPlanner() {
  const [events, setEvents] = useState<Shift[]>(initial);
  // The day the calendar is on, for the buttons that add a shift to it.
  const [shown, setShown] = useState(() => new Date());

  // The way to add a shift that isn't dragging: a morning on the day shown.
  const add = (person: string) => {
    const role = staff.find((member) => member.name === person)?.role;
    const date = plain(shown);
    setEvents((list) => [
      ...list,
      {
        id: `${person}-${date}-${list.length}`,
        title: person,
        person,
        start: `${date}T09:00`,
        end: `${date}T13:00`,
        color: role ? colorOf(role) : undefined,
      },
    ]);
  };

  return (
    <main className="shift-planner">
      <header className="shift-planner__head">
        <div className="shift-planner__heading">
          <h1 className="shift-planner__title">Halfmoon Café rota</h1>
          <p className="shift-planner__meta">
            Drag someone onto the week to give them a shift, or move and stretch
            the shifts already there.
          </p>
        </div>
        <ul className="shift-planner__key" aria-label="Roles">
          {roles.map((role) => (
            <li key={role.name} className="shift-planner__key-item">
              <span
                aria-hidden="true"
                className="shift-planner__swatch"
                data-color={role.color}
              />
              {role.name}
            </li>
          ))}
        </ul>
      </header>

      <div className="shift-planner__layout">
        <aside className="shift-planner__side" aria-labelledby="shift-staff">
          <h2 className="shift-planner__subtitle" id="shift-staff">
            Staff
          </h2>
          <ul className="shift-planner__staff">
            {staff.map((member) => {
              const booked = hoursOf(events, member.name);
              return (
                <li key={member.name} className="shift-planner__member">
                  <div
                    className="shift-planner__card"
                    data-color={colorOf(member.role)}
                    {...eventDragProps({
                      title: member.name,
                      person: member.name,
                      duration: 6 * 60,
                      color: colorOf(member.role),
                    })}
                  >
                    <span className="shift-planner__name">{member.name}</span>
                    <span className="shift-planner__role">
                      {member.role}, {booked} of {member.hours} hours
                    </span>
                  </div>
                  <Button
                    intent="ghost"
                    size="sm"
                    aria-label={`Add a morning shift for ${member.name}`}
                    onClick={() => add(member.name)}
                  >
                    Add
                  </Button>
                </li>
              );
            })}
          </ul>
        </aside>

        <EventCalendar
          aria-label="Shifts this week"
          events={events}
          onEventsChange={(next) => setEvents(next as Shift[])}
          onDateChange={setShown}
          views={["day", "week"]}
          hours={[6, 21]}
          scrollToHour={6}
          step={30}
          defaultDuration={6 * 60}
          creatable={false}
          defaultPanelOpen={false}
          eventFields={["time", "description"]}
          className="shift-planner__calendar"
        />
      </div>
    </main>
  );
}
