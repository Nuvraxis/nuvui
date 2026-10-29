import type { CalendarEvent } from "@nuvui/scheduler";

// Every event is put in the week the page is read in, so the calendar
// always has something on it. Times are written without a time zone, so
// each is on the clock wherever it's read.
export function day(offset: number): string {
  const date = new Date();
  // Monday of this week, then the offset.
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const at = (offset: number, time: string) => `${day(offset)}T${time}`;

const standUps: CalendarEvent[] = [0, 1, 2, 3, 4].map((offset) => ({
  id: `stand-up-${offset}`,
  title: "Stand-up",
  start: at(offset, "09:30"),
  end: at(offset, "09:45"),
  color: "2",
}));

export const teamEvents: CalendarEvent[] = [
  ...standUps,
  {
    id: "planning",
    title: "Quarterly planning",
    start: at(0, "10:00"),
    end: at(0, "12:00"),
    color: "1",
    description: "Room 4B. Bring the numbers for Q3.",
  },
  {
    id: "design-review",
    title: "Design review",
    start: at(0, "11:00"),
    end: at(0, "12:00"),
    color: "3",
  },
  {
    id: "leave",
    title: "Ines Porter on leave",
    start: day(0),
    end: day(2),
    allDay: true,
    color: "6",
  },
  {
    id: "lunch",
    title: "Lunch with Orrin Freight",
    start: at(1, "12:30"),
    end: at(1, "13:30"),
    color: "4",
  },
  {
    id: "supplier",
    title: "Call with Brightwell Supplies",
    start: at(1, "12:45"),
    end: at(1, "13:15"),
    color: "5",
  },
  {
    id: "budget",
    title: "Budget sign-off",
    start: at(2, "15:00"),
    end: at(2, "16:00"),
    color: "1",
  },
  {
    id: "launch",
    title: "Halden Street launch night",
    start: at(2, "19:00"),
    end: at(3, "01:00"),
    color: "8",
  },
  {
    id: "offsite",
    title: "Team offsite",
    start: day(3),
    end: day(4),
    allDay: true,
    color: "7",
  },
  {
    id: "interview",
    title: "Interview: senior engineer",
    start: at(4, "14:00"),
    end: at(4, "15:00"),
    color: "3",
  },
  {
    id: "release",
    title: "Release 4.2",
    start: day(4),
    end: day(4),
    allDay: true,
    color: "5",
  },
  {
    id: "retro",
    title: "Retrospective",
    start: at(-3, "16:00"),
    end: at(-3, "17:00"),
    color: "2",
  },
  {
    id: "review",
    title: "Sprint review",
    start: at(7, "14:00"),
    end: at(7, "15:00"),
    color: "1",
  },
  {
    id: "audit",
    title: "Audit week",
    start: day(8),
    end: day(12),
    allDay: true,
    color: "6",
  },
];
