import { createContext, useContext } from "react";
import type { DayKey } from "../../core/dates";
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

export interface CalendarContextValue {
  timeZone: string;
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
