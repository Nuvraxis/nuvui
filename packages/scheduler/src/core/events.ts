import {
  type DayKey,
  dayOf,
  minutesOf,
  momentOf,
  toDay,
  toMoment,
} from "./dates";

/**
 * One of the theme's eight chart colors, `"1"` to `"8"`, or any CSS color.
 */
export type EventColor =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | (string & {});

export interface CalendarEvent {
  /** Unique among the events. */
  id: string;
  title: string;
  /**
   * When it starts. A `Date`, or a string that ends in `Z` or an offset,
   * is a moment. A string without one, such as `"2026-10-14T09:00"`, is a
   * time on the clock in the event's `timeZone`.
   */
  start: Date | string;
  /**
   * When it ends, read the same way as `start`. For an all-day event, it's
   * the last day, so an event on one day has the same `start` and `end`.
   */
  end: Date | string;
  /** It takes whole days, and has no time of its own. */
  allDay?: boolean;
  /**
   * The time zone its clock times are in, such as `"Europe/Paris"`. The
   * calendar's own by default.
   */
  timeZone?: string;
  /** Its first resource's color, or the calendar's `color`, by default. */
  color?: EventColor;
  /** The ids of the resources it belongs to, from the calendar's `resources`. */
  resourceIds?: readonly string[];
  description?: string;
  /** Added to the event's element in every view. */
  className?: string;
  /**
   * It opens to be read, and can't be changed, moved or deleted. Read-only
   * by default when one of its resources is, or the calendar is.
   */
  readOnly?: boolean;
  /**
   * It can be moved by dragging, or from the keyboard. Its resources'
   * `draggable` by default.
   * @default true
   */
  draggable?: boolean;
  /**
   * Which ends can be dragged to change how long it is. Its resources'
   * `resizable` by default.
   * @default true
   */
  resizable?: boolean | "start" | "end";
}

/** An event as the calendar draws it, read in the time zone it shows. */
export interface PlacedEvent {
  event: CalendarEvent;
  /**
   * Where the event being dragged would go. Drawn faintly, and hidden from
   * screen readers, which hear the move in words.
   */
  preview?: boolean;
  start: Date;
  end: Date;
  allDay: boolean;
  /** Drawn as a bar across days: all day, or a day long or longer. */
  spansDays: boolean;
  firstDay: DayKey;
  /** The last day it covers, included. */
  lastDay: DayKey;
}

const day = 86_400_000;

export function place(event: CalendarEvent, timeZone: string): PlacedEvent {
  const zone = event.timeZone ?? timeZone;
  if (event.allDay) {
    const firstDay = toDay(event.start, zone);
    const written = toDay(event.end, zone);
    const lastDay = written < firstDay ? firstDay : written;
    return {
      event,
      allDay: true,
      spansDays: true,
      firstDay,
      lastDay,
      start: momentOf(firstDay, 0, timeZone),
      end: momentOf(lastDay, 24 * 60, timeZone),
    };
  }
  const start = toMoment(event.start, zone);
  const given = toMoment(event.end, zone);
  const end = given < start ? start : given;
  const firstDay = dayOf(start, timeZone);
  // An event that ends at midnight ends on the day before.
  const lastDay =
    end > start ? dayOf(new Date(end.getTime() - 1), timeZone) : firstDay;
  return {
    event,
    allDay: false,
    spansDays: end.getTime() - start.getTime() >= day,
    firstDay,
    lastDay,
    start,
    end,
  };
}

/**
 * The events that touch any day from `from` to `to`, in the order they're
 * drawn: by day, all-day ones first, then by start, the longer first.
 */
export function placeEvents(
  events: readonly CalendarEvent[],
  timeZone: string,
  from: DayKey,
  to: DayKey,
): PlacedEvent[] {
  return events
    .map((event) => place(event, timeZone))
    .filter((placed) => placed.lastDay >= from && placed.firstDay <= to)
    .sort(
      (a, b) =>
        a.firstDay.localeCompare(b.firstDay) ||
        Number(b.spansDays) - Number(a.spansDays) ||
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - a.end.getTime() ||
        a.event.title.localeCompare(b.event.title),
    );
}

/** The part of a timed event that falls on one day. */
export interface Segment {
  placed: PlacedEvent;
  day: DayKey;
  /** Minutes since midnight. */
  startMinute: number;
  endMinute: number;
  /** It began on an earlier day. */
  startsBefore: boolean;
  /** It goes on to a later day. */
  endsAfter: boolean;
}

/** The timed events on a day, cut at its midnights. */
export function segmentsOn(
  placed: readonly PlacedEvent[],
  on: DayKey,
  timeZone: string,
): Segment[] {
  return placed
    .filter(
      (item) => !item.spansDays && item.firstDay <= on && item.lastDay >= on,
    )
    .map((item) => {
      const startsBefore = item.firstDay < on;
      const endsAfter = item.lastDay > on;
      const endsOnNext = dayOf(item.end, timeZone) > on;
      return {
        placed: item,
        day: on,
        startMinute: startsBefore ? 0 : minutesOf(item.start, timeZone),
        endMinute:
          endsAfter || endsOnNext ? 24 * 60 : minutesOf(item.end, timeZone),
        startsBefore,
        endsAfter,
      };
    });
}

/**
 * The events on a day, timed or not, for a list: those that take the day
 * first, then the rest by when they start.
 */
export function eventsOn(
  placed: readonly PlacedEvent[],
  on: DayKey,
): PlacedEvent[] {
  return placed
    .filter((item) => item.firstDay <= on && item.lastDay >= on)
    .sort(
      (a, b) =>
        Number(b.spansDays) - Number(a.spansDays) ||
        a.start.getTime() - b.start.getTime(),
    );
}

/**
 * What changed, passed to `onEventsChange` with the events after it. The
 * events are your own objects when the calendar reads them with
 * `eventKeys`.
 */
export type EventChange<TEvent = CalendarEvent> =
  | { type: "create"; event: TEvent }
  | { type: "update"; event: TEvent; previous: TEvent }
  | { type: "delete"; event: TEvent };

/** The events after a change. */
export function applyChange(
  events: readonly CalendarEvent[],
  change: EventChange,
): CalendarEvent[] {
  switch (change.type) {
    case "create":
      return [...events, change.event];
    case "update":
      return events.map((event) =>
        event.id === change.event.id ? change.event : event,
      );
    default:
      return events.filter((event) => event.id !== change.event.id);
  }
}
