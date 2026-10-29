import type { CalendarLocale } from "@nuvui/date-picker/calendar";
import { createContext, useContext } from "react";
import type { DayKey } from "../../core/dates";
import type { EditOptions, Times } from "../../core/edit";
import type { CalendarEvent, EventColor, PlacedEvent } from "../../core/events";
import type { Formatters } from "../../core/format";
import type { SchedulerLabels } from "../../core/labels";

export type CalendarView = "day" | "week" | "month" | "agenda";

/** What the person looking can change from the preferences menu. */
export interface EventCalendarPreferences {
  /**
   * `true` for 24-hour times, `false` for AM and PM. The locale's own by
   * default.
   */
  twentyFourHours?: boolean;
  /** @default true */
  showWeekends?: boolean;
  /** @default false */
  showWeekNumbers?: boolean;
  /**
   * The first day of the week, 0 for Sunday to 6 for Saturday. The
   * locale's own by default.
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Days with nothing on are listed in the agenda.
   * @default true
   */
  showEmptyDays?: boolean;
}

export type PreferenceName = keyof EventCalendarPreferences;

export interface ResolvedPreferences {
  twentyFourHours: boolean;
  showWeekends: boolean;
  showWeekNumbers: boolean;
  weekStartsOn: number;
  showEmptyDays: boolean;
}

/** How an event was opened: by a mouse, a tap, or a key. */
export type OpenedBy = "pointer" | "touch" | "keyboard";

/** What the views need to edit events, from the calendar. */
export interface EditingValue {
  /** The calendar takes changes: not read-only, and somewhere to keep them. */
  editable: boolean;
  creatable: boolean;
  options: EditOptions;
  /** The event picked up from the keyboard, if one is. */
  picked: string | null;
  /** The event being dragged with a pointer, drawn faintly where it was. */
  dragging: string | null;
  /** Opens an event's popover, from the element pressed. */
  open: (event: CalendarEvent, element: HTMLElement, by: OpenedBy) => void;
  /** Asks to delete an event, from the element it was deleted from. */
  remove: (event: CalendarEvent, element: HTMLElement) => void;
  /** Picks an event up from the keyboard. */
  pick: (placed: PlacedEvent, look: string) => void;
  /** Moves the picked-up event, or with `resize` changes its end. */
  nudge: (by: { minutes?: number; days?: number }, resize: boolean) => void;
  drop: () => void;
  putBack: () => void;
  /** Starts a new event at the times given, from the element it's made in. */
  create: (times: Times, element: HTMLElement) => void;
}

export interface CalendarContextValue {
  timeZone: string;
  locale: CalendarLocale | undefined;
  /** Today, in the time zone shown, or `null` until the browser has the page. */
  today: DayKey | null;
  /** Now, or `null` until the browser has the page. */
  now: Date | null;
  format: Formatters;
  labels: SchedulerLabels;
  preferences: ResolvedPreferences;
  color: EventColor | undefined;
  hours: readonly [number, number];
  scrollToHour: number;
  headingLevel: 2 | 3 | 4 | 5;
  /** A unique start for the ids of the calendar's parts. */
  id: string;
  /** The week's number in the locale's numbering. */
  weekNumber: (day: DayKey) => number;
  goToDay: (day: DayKey) => void;
  setDate: (day: DayKey) => void;
  onEventClick:
    | ((event: CalendarEvent, element: HTMLElement) => void)
    | undefined;
  edit: EditingValue;
}

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("A part of EventCalendar was used outside it.");
  return context;
}

/** What a view is given to draw. */
export interface ViewProps {
  days: readonly DayKey[];
  placed: readonly PlacedEvent[];
  /** The view's name for screen readers: the range it shows. */
  label: string;
}
