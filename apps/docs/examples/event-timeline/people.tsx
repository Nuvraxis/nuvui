"use client";

import { type CalendarEvent, EventTimeline } from "@nuvui/scheduler";
import { day } from "../event-calendar/events";

// A team's people, each with their role, held under the app's own names.
const people = [
  { slug: "ines", name: "Ines Porter", role: "Design" },
  { slug: "tomas", name: "Tomas Reyna", role: "Engineering" },
  { slug: "wren", name: "Wren Halloway", role: "Engineering" },
  { slug: "odile", name: "Odile Marsh", role: "Research" },
];

const work: CalendarEvent[] = [
  {
    id: "onboarding",
    title: "Onboarding flow",
    start: day(-10),
    end: day(12),
    allDay: true,
    resourceIds: ["ines", "tomas"],
  },
  {
    id: "leave",
    title: "Leave",
    start: day(15),
    end: day(26),
    allDay: true,
    color: "6",
    resourceIds: ["ines"],
  },
  {
    id: "billing",
    title: "Billing rewrite",
    start: day(-3),
    end: day(40),
    allDay: true,
    resourceIds: ["wren"],
  },
  {
    id: "interviews",
    title: "Customer interviews",
    start: day(4),
    end: day(18),
    allDay: true,
    resourceIds: ["odile"],
  },
  {
    id: "launch",
    title: "Launch",
    start: day(45),
    end: day(46),
    allDay: true,
    color: "3",
    resourceIds: ["ines", "tomas", "wren", "odile"],
  },
];

export default function Example() {
  return (
    <EventTimeline
      aria-label="Team plan"
      resources={people}
      resourceKeys={{ id: "slug", title: "name" }}
      renderResource={(person) => (
        <>
          {person.name}{" "}
          <small style={{ color: "var(--color-muted-foreground)" }}>
            {person.role}
          </small>
        </>
      )}
      defaultEvents={work}
      defaultScale="weeks"
      scales={["days", "weeks", "months"]}
    />
  );
}
