import type { Frequency } from "./recurrence";
import type { TimelineScale } from "./timeline";

/** When in a month or a year an event repeats, for the words that say it. */
export interface RecurrenceDay {
  /** The days of the week, written out. */
  weekdays: readonly string[];
  /** Which of them in the month, `1` to `5`, or `-1` for the last. */
  week?: number;
  /** The day of the month, or `-1` for the last. */
  monthDay?: number;
  /** A yearly one's month, written out. */
  month?: string;
}

/** How an event repeats, for the words that say it. */
export interface RecurrenceDetails extends RecurrenceDay {
  frequency: Frequency;
  /** Every so many days, weeks, months or years. */
  interval: number;
  /** The last day it can be on, written out. */
  until?: string;
  /** How many times it happens. */
  count?: number;
}

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
  /** The timeline's name, when it's given no `aria-label`. */
  timeline: string;
  /** The name of the control that switches the timeline's scale. */
  scale: string;
  /** A scale of the timeline, in that control. */
  scaleName: (scale: TimelineScale) => string;
  /** The timeline's row for events that belong to no resource. */
  unassigned: string;
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
  /** The heading of the popover for an event being made. */
  newEvent: string;
  /** An event saved with no title. */
  untitled: string;
  /** The fields of the event's popover. */
  eventTitle: string;
  starts: string;
  ends: string;
  date: string;
  time: string;
  color: string;
  /** One of the eight colors, in the popover. */
  colorName: (color: number) => string;
  description: string;
  save: string;
  cancel: string;
  close: string;
  edit: string;
  delete: string;
  /** Said when the end chosen is before the start. */
  endsBeforeStart: string;
  /** The question before an event is deleted. */
  deleteQuestion: (title: string) => string;
  deleteWarning: string;
  /** The toolbar a tap on an event shows on a touch screen. */
  eventActions: (title: string) => string;
  /** Said when an event is picked up from the keyboard. */
  pickedUp: (title: string, when: string) => string;
  /** Said as a picked-up event is moved, with its new time. */
  movedTo: (when: string) => string;
  dropped: (title: string, when: string) => string;
  putBack: (title: string) => string;
  /** Said when an event is added by dropping something on the calendar. */
  added: (title: string, when: string) => string;
  deleted: (title: string) => string;
  /** The list of resources in the side panel, and the popover's field for several. */
  resources: string;
  /** The popover's field for one resource. */
  resource: string;
  /** The choice of no resource, in the popover. */
  noResource: string;
  /** The search field in the popover's list of resources. */
  searchResources: string;
  /** The popover's list of resources when the search finds none. */
  noResourceFound: string;
  /** How many resources are chosen, in the popover. */
  resourceCount: (count: number) => string;
  /** Said when an event that needs a resource has none. */
  resourceRequired: string;
  /** The button that opens and closes the resources inside one. */
  resourcesIn: (title: string) => string;
  /** The popover's field for how an event repeats. */
  repeat: string;
  /** The choice of not repeating, in that field. */
  doesNotRepeat: string;
  /** How often it repeats, as a choice in that field. */
  frequency: (frequency: Frequency) => string;
  /** The field for every how many days, weeks, months or years. */
  every: string;
  /** What follows the number in that field. */
  intervalUnit: (frequency: Frequency, count: number) => string;
  /** The days of the week it's on, or the day of the month, in the popover. */
  repeatOn: string;
  /** A choice of the day of the month or year it's on. */
  repeatOption: (day: RecurrenceDay) => string;
  /** The popover's field for when it stops repeating. */
  repeatEnds: string;
  never: string;
  onDate: string;
  afterCount: string;
  /** The last day it can be on, in the popover. */
  lastDate: string;
  /** How many times it happens, in the popover. */
  count: string;
  /** Said in the popover of an event in a time zone other than the one shown. */
  repeatsIn: (timeZone: string) => string;
  /** How an event repeats, in words. */
  recurrence: (details: RecurrenceDetails) => string;
  /** Added to the name of an event that repeats. */
  repeats: string;
  /** The question when one of a repeating event's occurrences is changed. */
  changeQuestion: (title: string) => string;
  /** Under the question, before the choice of which to change. */
  whichChange: string;
  /** Under the question to delete one that repeats, before the choice. */
  whichDelete: string;
  thisEvent: string;
  followingEvents: string;
  allEvents: string;
}

const ordinals = ["first", "second", "third", "fourth", "fifth"];

const listOf = (items: readonly string[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const units: Record<Frequency, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

// "on day 14", "on the second Tuesday of May": when in a week, a month or
// a year it's on.
function onText({ weekdays, week, monthDay, month }: RecurrenceDay) {
  const of = month ? ` of ${month}` : "";
  if (weekdays.length > 0) {
    if (week === undefined) return `on ${listOf(weekdays)}${of}`;
    const nth = week < 0 ? "last" : (ordinals[week - 1] ?? `${week}th`);
    return `on the ${nth} ${listOf(weekdays)}${of}`;
  }
  if (monthDay === undefined) return "";
  if (monthDay < 0) return `on the last day${of}`;
  return month ? `on ${month} ${monthDay}` : `on day ${monthDay}`;
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
  timeline: "Timeline",
  scale: "Scale",
  scaleName: (scale) =>
    ({
      hours: "Hours",
      days: "Days",
      weeks: "Weeks",
      months: "Months",
      years: "Years",
    })[scale],
  unassigned: "No resource",
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
  newEvent: "New event",
  untitled: "Untitled",
  eventTitle: "Title",
  starts: "Starts",
  ends: "Ends",
  date: "Date",
  time: "Time",
  color: "Color",
  colorName: (color) => `Color ${color}`,
  description: "Description",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  edit: "Edit",
  delete: "Delete",
  endsBeforeStart: "It ends before it starts.",
  deleteQuestion: (title) => `Delete ${title}?`,
  deleteWarning: "You can't undo this.",
  eventActions: (title) => `${title}, actions`,
  pickedUp: (title, when) =>
    `Picked up ${title}, ${when}. The arrow keys move it, Shift and the arrow keys change its length, Space drops it and Escape puts it back.`,
  movedTo: (when) => when,
  dropped: (title, when) => `Dropped ${title}, ${when}.`,
  putBack: (title) => `${title} put back.`,
  added: (title, when) => `Added ${title}, ${when}.`,
  deleted: (title) => `Deleted ${title}.`,
  resources: "Resources",
  resource: "Resource",
  noResource: "None",
  searchResources: "Search resources",
  noResourceFound: "No resource found.",
  resourceCount: (count) => `${count} resources`,
  resourceRequired: "Choose a resource.",
  resourcesIn: (title) => `Resources in ${title}`,
  repeat: "Repeat",
  doesNotRepeat: "Doesn't repeat",
  frequency: (frequency) =>
    ({
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    })[frequency],
  every: "Every",
  intervalUnit: (frequency, count) =>
    count === 1 ? units[frequency] : `${units[frequency]}s`,
  repeatOn: "On",
  repeatOption: (day) => {
    const text = onText(day);
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  repeatEnds: "Stops repeating",
  never: "Never",
  onDate: "On a date",
  afterCount: "After a number of times",
  lastDate: "Last date",
  count: "Number of times",
  repeatsIn: (timeZone) => `It repeats on the clock in ${timeZone}.`,
  recurrence: (details) => {
    const unit = units[details.frequency];
    const every =
      details.interval > 1
        ? `Every ${details.interval} ${unit}s`
        : `Every ${unit}`;
    const on = onText(details);
    const end = details.until
      ? `, until ${details.until}`
      : details.count
        ? `, ${details.count} ${details.count === 1 ? "time" : "times"}`
        : "";
    return `${every}${on ? ` ${on}` : ""}${end}`;
  },
  repeats: "repeats",
  changeQuestion: (title) => `Change ${title}?`,
  whichChange: "It repeats. Which of its events does this change?",
  whichDelete: "It repeats. Which of its events should go?",
  thisEvent: "This event",
  followingEvents: "This and the following events",
  allEvents: "All events",
};
