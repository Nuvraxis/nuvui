import type { CalendarEvent, CalendarResource } from "@nuvui/scheduler";
import { at, day } from "./events";

// An office's rooms and people. The rooms take their color from the group
// they're in, unless they have one of their own.
export const officeResources: CalendarResource[] = [
  {
    id: "rooms",
    title: "Rooms",
    color: "1",
    children: [
      { id: "room-4b", title: "Room 4B" },
      { id: "room-2a", title: "Room 2A", color: "3" },
      { id: "library", title: "The library", color: "5" },
    ],
  },
  {
    id: "people",
    title: "People",
    children: [
      { id: "ines", title: "Ines Porter", color: "6" },
      { id: "tomas", title: "Tomas Reyna", color: "4" },
      { id: "wren", title: "Wren Halloway", color: "7" },
    ],
  },
];

// Each event is in the week the page is read in, and has no color of its
// own, so it takes its first resource's.
export const officeEvents: CalendarEvent[] = [
  {
    id: "planning",
    title: "Quarterly planning",
    start: at(0, "10:00"),
    end: at(0, "12:00"),
    resourceIds: ["room-4b"],
  },
  {
    id: "interviews",
    title: "Interviews",
    start: at(0, "13:00"),
    end: at(0, "15:30"),
    resourceIds: ["room-2a"],
  },
  {
    id: "reading-group",
    title: "Reading group",
    start: at(1, "12:30"),
    end: at(1, "13:30"),
    resourceIds: ["library"],
  },
  {
    id: "ines-leave",
    title: "Ines Porter on leave",
    start: day(1),
    end: day(2),
    allDay: true,
    resourceIds: ["ines"],
  },
  {
    id: "supplier",
    title: "Call with Brightwell Supplies",
    start: at(2, "09:00"),
    end: at(2, "09:45"),
    resourceIds: ["tomas"],
  },
  {
    id: "budget",
    title: "Budget sign-off",
    start: at(2, "15:00"),
    end: at(2, "16:00"),
    resourceIds: ["room-4b"],
  },
  {
    id: "one-to-one",
    title: "One to one",
    start: at(3, "11:00"),
    end: at(3, "11:30"),
    resourceIds: ["wren"],
  },
  {
    id: "workshop",
    title: "Accessibility workshop",
    start: at(3, "14:00"),
    end: at(3, "16:00"),
    resourceIds: ["library"],
  },
  {
    id: "release",
    title: "Release 4.2",
    start: day(4),
    end: day(4),
    allDay: true,
  },
];

// The same week, with each meeting in a room and with the people in it.
export const meetings: CalendarEvent[] = [
  {
    id: "planning",
    title: "Quarterly planning",
    start: at(0, "10:00"),
    end: at(0, "12:00"),
    resourceIds: ["room-4b", "ines", "tomas"],
  },
  {
    id: "hiring",
    title: "Hiring panel",
    start: at(1, "14:00"),
    end: at(1, "15:00"),
    resourceIds: ["room-2a", "wren"],
  },
  {
    id: "design",
    title: "Design critique",
    start: at(2, "11:00"),
    end: at(2, "12:00"),
    resourceIds: ["library", "tomas", "wren"],
  },
  {
    id: "retro",
    title: "Retrospective",
    start: at(4, "16:00"),
    end: at(4, "17:00"),
    resourceIds: ["room-4b", "ines", "tomas", "wren"],
  },
];
