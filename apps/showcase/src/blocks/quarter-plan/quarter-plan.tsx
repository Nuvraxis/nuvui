"use client";

import { type CalendarEvent, EventTimeline } from "@nuvui/scheduler";
import { useState } from "react";
import "./quarter-plan.scss";

// Weeks from this one's Monday, so the plan has work whenever it's opened.
function week(offset: number, weekday = 0) {
  const date = new Date();
  date.setDate(
    date.getDate() - ((date.getDay() + 6) % 7) + offset * 7 + weekday,
  );
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The team, in its groups, under the app's own field names.
interface Person {
  key: string;
  name: string;
  tint?: string;
  people?: Person[];
}

const team: Person[] = [
  {
    key: "design",
    name: "Design",
    tint: "4",
    people: [
      { key: "ines", name: "Ines Porter" },
      { key: "malik", name: "Malik Oduya" },
    ],
  },
  {
    key: "engineering",
    name: "Engineering",
    tint: "2",
    people: [
      { key: "tomas", name: "Tomas Reyna" },
      { key: "wren", name: "Wren Halloway" },
      { key: "saoirse", name: "Saoirse Vale" },
    ],
  },
  {
    key: "research",
    name: "Research",
    tint: "7",
    people: [{ key: "odile", name: "Odile Marsh" }],
  },
];

const work = (
  id: string,
  title: string,
  people: string[],
  from: [number, number],
  to: [number, number],
  extra: Partial<CalendarEvent> = {},
): CalendarEvent => ({
  id,
  title,
  start: week(...from),
  end: week(...to),
  allDay: true,
  resourceIds: people,
  ...extra,
});

const leave = { color: "6", description: "Leave" };

const initial: CalendarEvent[] = [
  work("w1", "Checkout redesign", ["ines"], [-2, 0], [3, 4]),
  work("w2", "Design system audit", ["malik"], [0, 0], [2, 4]),
  work("w3", "Leave", ["malik"], [4, 0], [5, 4], leave),
  work("w4", "Payments API", ["tomas", "wren"], [-1, 0], [4, 4]),
  work("w5", "On call", ["saoirse"], [0, 0], [0, 6]),
  work("w6", "Search speed", ["saoirse"], [1, 0], [6, 4]),
  work("w7", "Leave", ["wren"], [6, 0], [7, 4], leave),
  work("w8", "Customer interviews", ["odile"], [0, 2], [2, 4]),
  work("w9", "Launch", ["ines", "tomas", "odile"], [7, 2], [7, 3], {
    color: "3",
  }),
  // Not given to anyone yet.
  work("w10", "Onboarding emails", [], [3, 0], [5, 4]),
  work("w11", "Usability study", [], [5, 0], [8, 4]),
];

let made = 0;

export default function QuarterPlan() {
  const [events, setEvents] = useState(initial);
  const open = events.filter((event) => !event.resourceIds?.length);

  return (
    <main className="quarter-plan">
      <header className="quarter-plan__head">
        <div className="quarter-plan__heading">
          <h1 className="quarter-plan__title">Northwind Labs, this quarter</h1>
          <p className="quarter-plan__meta">
            Work is dragged from the row at the bottom onto someone to give it
            to them, and along a row to move its weeks.
          </p>
        </div>
        <p className="quarter-plan__count" aria-live="polite">
          {open.length === 0
            ? "Everything has someone on it."
            : `${open.length} ${open.length === 1 ? "piece" : "pieces"} of work with no one on ${open.length === 1 ? "it" : "them"}`}
        </p>
      </header>

      <EventTimeline
        aria-label="Quarter plan"
        resources={team}
        resourceKeys={{
          id: "key",
          title: "name",
          color: "tint",
          children: "people",
        }}
        events={events}
        onEventsChange={setEvents}
        scales={["days", "weeks", "months"]}
        defaultScale="weeks"
        spans={{ days: 3 }}
        multipleResources
        eventFields={["title", "time", "resource", "color", "description"]}
        labels={{ unassigned: "No one yet" }}
        createId={() => {
          made += 1;
          return `new-${made}`;
        }}
        className="quarter-plan__timeline"
      />
    </main>
  );
}
