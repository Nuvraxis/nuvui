"use client";

import { type CalendarEvent, EventTimeline } from "@nuvui/scheduler";
import { useState } from "react";
import "./fleet-planner.scss";

// The days are around today's, so the fleet has work whenever it's opened.
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const at = (offset: number, time: string) => `${day(offset)}T${time}`;

const kinds = [
  { name: "Delivery", color: "1" },
  { name: "Service", color: "6" },
  { name: "Hire", color: "3" },
] as const;
type Kind = (typeof kinds)[number]["name"];
const colorOf = (kind: Kind) => kinds.find((item) => item.name === kind)?.color;

// A van with its plate, in the depot it's kept at.
interface Vehicle {
  id: string;
  title: string;
  plate?: string;
  children?: Vehicle[];
}

const depots: Vehicle[] = [
  {
    id: "harbour",
    title: "Harbour depot",
    children: [
      { id: "fv-01", title: "Van 01", plate: "FV 01 HRB" },
      { id: "fv-02", title: "Van 02", plate: "FV 02 HRB" },
      { id: "fv-03", title: "Van 03", plate: "FV 03 HRB" },
      { id: "fv-04", title: "Box truck 04", plate: "FV 04 HRB" },
    ],
  },
  {
    id: "ridge",
    title: "Ridge Road depot",
    children: [
      { id: "fv-05", title: "Van 05", plate: "FV 05 RDG" },
      { id: "fv-06", title: "Van 06", plate: "FV 06 RDG" },
      { id: "fv-07", title: "Box truck 07", plate: "FV 07 RDG" },
    ],
  },
];
const vehicles = depots.flatMap((depot) => depot.children ?? []);

const job = (
  id: string,
  title: string,
  kind: Kind,
  vehicle: string,
  start: string,
  end: string,
  allDay = false,
): CalendarEvent => ({
  id,
  title,
  start,
  end,
  color: colorOf(kind),
  resourceIds: [vehicle],
  description: kind,
  ...(allDay ? { allDay } : null),
});

const initial: CalendarEvent[] = [
  job("j1", "Market run", "Delivery", "fv-01", at(0, "05:00"), at(0, "12:00")),
  job("j2", "Coast loop", "Delivery", "fv-01", at(2, "06:00"), at(4, "17:00")),
  job("j3", "Brake check", "Service", "fv-02", day(0), day(1), true),
  job(
    "j4",
    "Orchard Lane",
    "Delivery",
    "fv-02",
    at(3, "07:00"),
    at(3, "15:00"),
  ),
  job("j5", "Hired to Kestrel Events", "Hire", "fv-04", day(-4), day(2), true),
  job("j6", "Town loop", "Delivery", "fv-05", at(-1, "08:00"), at(-1, "16:00")),
  job("j7", "Town loop", "Delivery", "fv-05", at(1, "08:00"), at(1, "16:00")),
  job("j8", "New tyres", "Service", "fv-06", at(5, "09:00"), at(5, "12:00")),
  job("j9", "Warehouse move", "Hire", "fv-07", day(6), day(9), true),
  job(
    "j10",
    "Hill farms",
    "Delivery",
    "fv-03",
    at(-6, "06:30"),
    at(-5, "14:00"),
  ),
  job("j11", "Hill farms", "Delivery", "fv-03", at(8, "06:30"), at(9, "14:00")),
];

// The vans with nothing on today.
function freeToday(events: readonly CalendarEvent[]) {
  const today = day(0);
  const busy = new Set(
    events
      .filter((event) => {
        const first = String(event.start).slice(0, 10);
        const last = String(event.end).slice(0, 10);
        return first <= today && last >= today;
      })
      .flatMap((event) => event.resourceIds ?? []),
  );
  return vehicles.filter((vehicle) => !busy.has(vehicle.id));
}

let made = 0;

export default function FleetPlanner() {
  const [events, setEvents] = useState(initial);
  const free = freeToday(events);

  return (
    <main className="fleet-planner">
      <header className="fleet-planner__head">
        <div className="fleet-planner__heading">
          <h1 className="fleet-planner__title">Fernvale Deliveries fleet</h1>
          <p className="fleet-planner__meta">
            Drag a job along a van's row to change its days, or onto another van
            to give it to that one.
          </p>
        </div>
        <ul className="fleet-planner__key" aria-label="Kinds of job">
          {kinds.map((kind) => (
            <li key={kind.name} className="fleet-planner__key-item">
              <span
                aria-hidden="true"
                className="fleet-planner__swatch"
                data-color={kind.color}
              />
              {kind.name}
            </li>
          ))}
        </ul>
      </header>

      <div className="fleet-planner__layout">
        <EventTimeline
          aria-label="Fleet"
          resources={depots}
          renderResource={(vehicle) => (
            <>
              {vehicle.title}
              {vehicle.plate ? (
                <span className="fleet-planner__plate">{vehicle.plate}</span>
              ) : null}
            </>
          )}
          events={events}
          onEventsChange={setEvents}
          scales={["hours", "days", "weeks"]}
          defaultScale="days"
          // This month and the next, so today is never near the end.
          spans={{ days: 2 }}
          hours={[5, 21]}
          step={30}
          resourceRequired
          eventFields={["title", "time", "resource", "description"]}
          createId={() => {
            made += 1;
            return `new-${made}`;
          }}
          className="fleet-planner__timeline"
        />

        <aside className="fleet-planner__side" aria-labelledby="fleet-free">
          <h2 className="fleet-planner__subtitle" id="fleet-free">
            Free today
          </h2>
          {free.length === 0 ? (
            <p className="fleet-planner__empty">Every vehicle is out.</p>
          ) : (
            <ul className="fleet-planner__free">
              {free.map((vehicle) => (
                <li key={vehicle.id} className="fleet-planner__vehicle">
                  <span className="fleet-planner__name">{vehicle.title}</span>
                  <span className="fleet-planner__plate">{vehicle.plate}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
