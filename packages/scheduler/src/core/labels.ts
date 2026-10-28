/**
 * Every word the calendar shows or says. Pass some or all of them as
 * `labels` to translate it. Dates and times aren't here: they're written
 * by the browser in the calendar's `locale`.
 */
export interface SchedulerLabels {
  /** The calendar's name, when it's given no `aria-label`. */
  calendar: string;
  today: string;
  previous: string;
  next: string;
  /** The name of the control that switches views. */
  view: string;
  day: string;
  week: string;
  month: string;
  agenda: string;
  /** The row of events that take whole days, and an event's time when it's one of them. */
  allDay: string;
  /** The button that opens the side panel, and the panel's name. */
  sidePanel: string;
  preferences: string;
  twentyFourHours: string;
  showWeekends: string;
  showWeekNumbers: string;
  showEmptyDays: string;
  weekStartsOn: string;
  /** A week's number, in the month view. */
  weekNumber: (week: number) => string;
  /** The button in a full day that shows the rest of its events. */
  more: (count: number) => string;
  /** An event's time, from start to end. */
  timeRange: (start: string, end: string) => string;
  /** The agenda when nothing is on in the days it shows. */
  nothingBetween: (from: string, to: string) => string;
  /** The button in an empty agenda that goes to the next day with an event. */
  nextEvent: (day: string) => string;
  /** The agenda when nothing is on for 180 days. */
  nothingAhead: string;
}

export const englishLabels: SchedulerLabels = {
  calendar: "Calendar",
  today: "Today",
  previous: "Previous",
  next: "Next",
  view: "View",
  day: "Day",
  week: "Week",
  month: "Month",
  agenda: "Agenda",
  allDay: "All day",
  sidePanel: "Side panel",
  preferences: "Preferences",
  twentyFourHours: "24-hour time",
  showWeekends: "Weekends",
  showWeekNumbers: "Week numbers",
  showEmptyDays: "Days with nothing on",
  weekStartsOn: "Week starts on",
  weekNumber: (week) => `Week ${week}`,
  more: (count) => `${count} more`,
  timeRange: (start, end) => `${start} to ${end}`,
  nothingBetween: (from, to) => `Nothing on from ${from} to ${to}.`,
  nextEvent: (day) => `Go to ${day}`,
  nothingAhead: "Nothing on in the next 180 days.",
};
