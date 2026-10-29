"use client";

import {
  type CalendarEvent,
  type CalendarResource,
  EventCalendar,
} from "@nuvui/scheduler";
import { useState } from "react";
import "./school-timetable.scss";

// The days are this week's, so the timetable is full whenever it's opened.
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const periods = {
  1: ["08:40", "09:30"],
  2: ["09:35", "10:25"],
  3: ["10:45", "11:35"],
  4: ["11:40", "12:30"],
  5: ["13:15", "14:05"],
  6: ["14:10", "15:00"],
} as const;

// Lessons take their color from their teacher, who is listed first.
const resources: CalendarResource[] = [
  {
    id: "teachers",
    title: "Teachers",
    children: [
      { id: "okafor", title: "Amara Okafor", color: "1" },
      { id: "vale", title: "Dmitri Vale", color: "2" },
      { id: "brightwater", title: "Lena Brightwater", color: "3" },
      { id: "pike", title: "Jonah Pike", color: "4" },
      { id: "ellingham", title: "Ruth Ellingham", color: "5" },
    ],
  },
  {
    id: "rooms",
    title: "Rooms",
    children: [
      { id: "lab", title: "Science lab" },
      { id: "room-12", title: "Room 12" },
      { id: "room-14", title: "Room 14" },
      { id: "hall", title: "Sports hall" },
      { id: "library", title: "Library" },
    ],
  },
];

const titles = new Map<string, string>();
const walk = (list: readonly CalendarResource[]) => {
  for (const resource of list) {
    titles.set(resource.id, resource.title);
    walk(resource.children ?? []);
  }
};
walk(resources);

const lesson = (
  id: string,
  title: string,
  offset: number,
  period: keyof typeof periods,
  teacher: string,
  room: string,
): CalendarEvent => {
  const [from, to] = periods[period];
  return {
    id,
    title,
    start: `${day(offset)}T${from}`,
    end: `${day(offset)}T${to}`,
    resourceIds: [teacher, room],
  };
};

const initial: CalendarEvent[] = [
  lesson("mon-1", "Year 9 chemistry", 0, 1, "okafor", "lab"),
  lesson("mon-2", "Year 8 maths", 0, 2, "vale", "room-12"),
  lesson("mon-3", "Year 10 English", 0, 3, "brightwater", "room-14"),
  lesson("mon-4", "Year 7 PE", 0, 4, "pike", "hall"),
  lesson("mon-5", "Year 11 history", 0, 5, "ellingham", "library"),
  lesson("tue-1", "Year 10 maths", 1, 1, "vale", "room-12"),
  lesson("tue-2", "Year 7 science", 1, 2, "okafor", "lab"),
  lesson("tue-3", "Year 9 English", 1, 3, "brightwater", "room-12"),
  lesson("tue-3b", "Year 8 history", 1, 3, "ellingham", "room-12"),
  lesson("tue-5", "Year 11 PE", 1, 5, "pike", "hall"),
  lesson("wed-1", "Year 8 English", 2, 1, "brightwater", "room-14"),
  lesson("wed-2", "Year 11 chemistry", 2, 2, "okafor", "lab"),
  lesson("wed-4", "Year 9 maths", 2, 4, "vale", "room-12"),
  lesson("wed-6", "Year 10 history", 2, 6, "ellingham", "room-14"),
  lesson("thu-1", "Year 7 English", 3, 1, "brightwater", "library"),
  lesson("thu-3", "Year 10 PE", 3, 3, "pike", "hall"),
  lesson("thu-3b", "Year 7 maths", 3, 3, "vale", "room-12"),
  lesson("thu-5", "Year 9 history", 3, 5, "ellingham", "room-14"),
  lesson("fri-2", "Year 8 science", 4, 2, "okafor", "lab"),
  lesson("fri-4", "Year 11 maths", 4, 4, "vale", "room-12"),
  lesson("fri-6", "Year 9 PE", 4, 6, "pike", "hall"),
];

// Two lessons that overlap and share a teacher or a room. Times are
// written on the school's clock, so as text they sort as they fall.
interface Clash {
  key: string;
  resource: string;
  lessons: [CalendarEvent, CalendarEvent];
}

function clashesIn(events: readonly CalendarEvent[]): Clash[] {
  const found: Clash[] = [];
  events.forEach((a, index) => {
    for (const b of events.slice(index + 1)) {
      if (String(a.start) >= String(b.end) || String(b.start) >= String(a.end))
        continue;
      const shared = (a.resourceIds ?? []).filter((id) =>
        b.resourceIds?.includes(id),
      );
      for (const resource of shared) {
        found.push({
          key: `${a.id}:${b.id}:${resource}`,
          resource,
          lessons: [a, b],
        });
      }
    }
  });
  return found.sort((x, y) =>
    String(x.lessons[0].start).localeCompare(String(y.lessons[0].start)),
  );
}

// The browser and the server write a narrow space before AM and PM, or a
// plain one, depending on their version.
const plain = (text: string) => text.replace(/\s/g, " ");
const dayAndTime = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const when = (event: CalendarEvent) =>
  plain(dayAndTime.format(new Date(event.start)));

export default function SchoolTimetable() {
  const [events, setEvents] = useState(initial);
  const clashes = clashesIn(events);

  return (
    <main className="school-timetable">
      <header className="school-timetable__head">
        <h1 className="school-timetable__title">Northfield School timetable</h1>
        <p className="school-timetable__meta">
          Each lesson has a teacher and a room. Show or hide either in the side
          panel, and drag a lesson to move it.
        </p>
      </header>

      <div className="school-timetable__layout">
        <EventCalendar
          aria-label="Timetable"
          events={events}
          onEventsChange={setEvents}
          resources={resources}
          multipleResources
          resourceRequired
          views={["day", "week", "agenda"]}
          hours={[8, 16]}
          scrollToHour={8}
          step={5}
          defaultDuration={50}
          preferenceOptions={["twentyFourHours"]}
          defaultPreferences={{ showWeekends: false }}
          eventFields={["title", "time", "resource", "description"]}
          className="school-timetable__calendar"
        />

        <aside
          className="school-timetable__side"
          aria-labelledby="timetable-clashes"
        >
          <h2 className="school-timetable__subtitle" id="timetable-clashes">
            Clashes
          </h2>
          {clashes.length > 0 ? (
            <ul className="school-timetable__list">
              {clashes.map(({ key, resource, lessons: [a, b] }) => (
                <li key={key} className="school-timetable__item">
                  <span className="school-timetable__item-title">
                    {titles.get(resource)}, {when(a)}
                  </span>
                  <span className="school-timetable__item-text">
                    {a.title} and {b.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="school-timetable__hint">
              No teacher or room is booked twice.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
