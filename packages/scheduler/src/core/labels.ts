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
};
