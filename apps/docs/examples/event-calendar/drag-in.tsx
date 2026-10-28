"use client";

import {
  type CalendarEvent,
  EventCalendar,
  type ExternalEvent,
  eventDragProps,
} from "@nuvui/scheduler";
import { useState } from "react";
import { teamEvents } from "./events";

const start: ExternalEvent[] = [
  { title: "Write the release notes", duration: 90, color: "5" },
  { title: "Review the hiring plan", duration: 30, color: "7" },
  { title: "Book the venue", duration: 60, color: "8" },
];

export default function Example() {
  const [tasks, setTasks] = useState(start);
  const [events, setEvents] = useState<CalendarEvent[]>(teamEvents);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "minmax(12rem, 1fr) 4fr",
        inlineSize: "100%",
      }}
    >
      <section aria-labelledby="tasks-heading" data-task-list="">
        <h3 id="tasks-heading" style={{ marginBlockStart: 0 }}>
          To schedule
        </h3>
        <ul style={{ display: "grid", gap: 8, margin: 0, padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.title}
              {...eventDragProps(task)}
              style={{
                listStyle: "none",
                padding: "8px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "grab",
              }}
            >
              {task.title}, {task.duration} minutes
            </li>
          ))}
        </ul>
      </section>
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultPanelOpen={false}
        onEventsChange={(next, change) => {
          setEvents(next);
          // A task dropped on the calendar is scheduled, and off the list.
          if (change.type === "create") {
            setTasks((list) =>
              list.filter((task) => task.title !== change.event.title),
            );
          }
        }}
        // An event dragged back onto the list is unscheduled again.
        onEventDropOutside={(event, { target }) => {
          if (!target?.closest("[data-task-list]")) return false;
          const minutes =
            (new Date(event.end).getTime() - new Date(event.start).getTime()) /
            60_000;
          setTasks((list) => [
            ...list,
            { title: event.title, duration: minutes, color: event.color },
          ]);
          return true;
        }}
      />
    </div>
  );
}
