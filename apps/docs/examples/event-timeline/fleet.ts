import type { CalendarEvent, CalendarResource } from "@nuvui/scheduler";
import { at, day } from "../event-calendar/events";

// A delivery firm's vans, in two depots. Each van takes the depot's color
// unless it has one of its own.
export const vans: CalendarResource[] = [
  {
    id: "north",
    title: "North depot",
    color: "1",
    children: [
      { id: "van-1", title: "Van 1" },
      { id: "van-2", title: "Van 2" },
      { id: "van-3", title: "Van 3", color: "4" },
    ],
  },
  {
    id: "south",
    title: "South depot",
    color: "3",
    children: [
      { id: "van-4", title: "Van 4" },
      { id: "van-5", title: "Van 5" },
    ],
  },
];

// Runs, services and loans in the weeks around the one the page is read
// in, so the timeline always has something on it.
export const runs: CalendarEvent[] = [
  {
    id: "coast-run",
    title: "Coast run",
    start: at(-3, "06:00"),
    end: at(-1, "18:00"),
    resourceIds: ["van-1"],
  },
  {
    id: "market",
    title: "Market deliveries",
    start: at(0, "05:30"),
    end: at(0, "13:00"),
    resourceIds: ["van-1"],
  },
  {
    id: "service",
    title: "Service",
    start: day(1),
    end: day(2),
    allDay: true,
    color: "6",
    resourceIds: ["van-2"],
  },
  {
    id: "hill-farms",
    title: "Hill farms",
    start: at(2, "07:00"),
    end: at(4, "16:00"),
    resourceIds: ["van-2"],
  },
  {
    id: "school-meals",
    title: "School meals",
    start: at(0, "06:00"),
    end: at(0, "10:00"),
    recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12",
    resourceIds: ["van-3"],
  },
  {
    id: "loan",
    title: "On loan to South",
    start: day(5),
    end: day(9),
    allDay: true,
    resourceIds: ["van-4"],
  },
  {
    id: "city-loop",
    title: "City loop",
    start: at(-2, "08:00"),
    end: at(-2, "17:00"),
    resourceIds: ["van-5"],
  },
  {
    id: "city-loop-2",
    title: "City loop",
    start: at(1, "08:00"),
    end: at(1, "17:00"),
    resourceIds: ["van-5"],
  },
  {
    id: "tyres",
    title: "New tyres",
    start: at(1, "15:00"),
    end: at(1, "16:30"),
    color: "6",
    resourceIds: ["van-5"],
  },
  {
    id: "inspection",
    title: "Safety inspection",
    start: day(3),
    end: day(3),
    allDay: true,
  },
];
