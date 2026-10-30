import {
  addDays,
  type DayKey,
  dayOf,
  daysBetween,
  minutesOf,
  momentOf,
  wallTime,
} from "./dates";
import type { CalendarEvent, PlacedEvent } from "./events";

/**
 * Where an event is, or is being put: on whole days, or from a moment to a
 * moment.
 */
export type Times =
  | { allDay: true; firstDay: DayKey; lastDay: DayKey }
  | { allDay: false; start: Date; end: Date };

/**
 * A place on the calendar under the pointer or the focus: a day, and the
 * minutes into it on the clock shown, or `null` for a place that's a whole
 * day (the all-day row, or a day in a month).
 */
export interface Spot {
  day: DayKey;
  minute: number | null;
  /**
   * The resource of the timeline's row it's in, and `null` in the row of
   * events with none. Left out on the calendar, which has no rows.
   */
  resource?: string | null;
}

/** What a drag does to the event it starts on. */
export type DragMode = "move" | "start" | "end" | "create";

export interface EditOptions {
  /** Minutes that times snap to. */
  step: number;
  /** Minutes a new timed event lasts, or an all-day one becoming timed. */
  defaultDuration: number;
  /** The time zone shown. */
  timeZone: string;
}

const minute = 60_000;
const epoch = "2000-01-01";

/** A spot as minutes from a fixed day, to compare and subtract. */
const along = (day: DayKey, at: number) => daysBetween(epoch, day) * 1440 + at;

const floorTo = (value: number, step: number) =>
  Math.floor(value / step) * step;
const roundTo = (value: number, step: number) =>
  Math.round(value / step) * step;

/** Moves a moment by minutes on the clock, so 9:00 stays 9:00 a day later. */
export function shiftClock(moment: Date, by: number, timeZone: string): Date {
  const total = minutesOf(moment, timeZone) + by;
  return momentOf(
    addDays(dayOf(moment, timeZone), Math.floor(total / 1440)),
    ((total % 1440) + 1440) % 1440,
    timeZone,
  );
}

/** The moment a spot on the time grid stands for. */
export function momentAt(day: DayKey, at: number, timeZone: string): Date {
  return momentOf(addDays(day, Math.floor(at / 1440)), at % 1440, timeZone);
}

export function timesOf(placed: PlacedEvent): Times {
  return placed.allDay
    ? { allDay: true, firstDay: placed.firstDay, lastDay: placed.lastDay }
    : { allDay: false, start: placed.start, end: placed.end };
}

/** Times moved by whole days, keeping their clock times. */
function byDays(placed: PlacedEvent, days: number, timeZone: string): Times {
  if (placed.allDay) {
    return {
      allDay: true,
      firstDay: addDays(placed.firstDay, days),
      lastDay: addDays(placed.lastDay, days),
    };
  }
  return {
    allDay: false,
    start: shiftClock(placed.start, days * 1440, timeZone),
    end: shiftClock(placed.end, days * 1440, timeZone),
  };
}

/** Where a timed event is moved to, keeping how long it lasts. */
function startingAt(placed: PlacedEvent, start: Date): Times {
  const length = placed.end.getTime() - placed.start.getTime();
  return { allDay: false, start, end: new Date(start.getTime() + length) };
}

/**
 * Where a drag from one spot to another puts an event. `placed` is the
 * event dragged, and `null` for one being drawn on empty time.
 */
export function dragTo(
  mode: DragMode,
  placed: PlacedEvent | null,
  from: Spot,
  to: Spot,
  { step, defaultDuration, timeZone }: EditOptions,
): Times {
  if (mode === "create" || !placed) {
    if (from.minute === null || to.minute === null) {
      const [first, last] = from.day <= to.day ? [from, to] : [to, from];
      return { allDay: true, firstDay: first.day, lastDay: last.day };
    }
    const a = along(from.day, from.minute);
    const b = along(to.day, to.minute);
    const low = floorTo(Math.min(a, b), step);
    const high = Math.max(Math.ceil(Math.max(a, b) / step) * step, low + step);
    const [day, start] = a <= b ? [from.day, from.minute] : [to.day, to.minute];
    const first = momentAt(day, floorTo(start, step), timeZone);
    return {
      allDay: false,
      start: first,
      end: new Date(first.getTime() + (high - low) * minute),
    };
  }

  const days = daysBetween(from.day, to.day);

  if (mode === "move") {
    // Onto a whole day: the all-day row, or a day in a month.
    if (to.minute === null) {
      if (from.minute === null) return byDays(placed, days, timeZone);
      return { allDay: true, firstDay: to.day, lastDay: to.day };
    }
    // From a whole day onto a time: it starts there.
    if (from.minute === null) {
      const start = momentAt(to.day, floorTo(to.minute, step), timeZone);
      return placed.allDay
        ? {
            allDay: false,
            start,
            end: new Date(start.getTime() + defaultDuration * minute),
          }
        : startingAt(placed, start);
    }
    const by = roundTo(
      along(to.day, to.minute) - along(from.day, from.minute),
      step,
    );
    return {
      allDay: false,
      start: shiftClock(placed.start, by, timeZone),
      end: shiftClock(placed.end, by, timeZone),
    };
  }

  // Resizing, by a day at a time on whole days.
  if (placed.allDay) {
    if (mode === "end") {
      const lastDay = addDays(placed.lastDay, days);
      return {
        allDay: true,
        firstDay: placed.firstDay,
        lastDay: lastDay < placed.firstDay ? placed.firstDay : lastDay,
      };
    }
    const firstDay = addDays(placed.firstDay, days);
    return {
      allDay: true,
      firstDay: firstDay > placed.lastDay ? placed.lastDay : firstDay,
      lastDay: placed.lastDay,
    };
  }
  const at =
    to.minute === null
      ? shiftClock(
          mode === "end" ? placed.end : placed.start,
          days * 1440,
          timeZone,
        )
      : momentAt(to.day, roundTo(to.minute, step), timeZone);
  const shortest = step * minute;
  if (mode === "end") {
    const end = Math.max(at.getTime(), placed.start.getTime() + shortest);
    return { allDay: false, start: placed.start, end: new Date(end) };
  }
  const start = Math.min(at.getTime(), placed.end.getTime() - shortest);
  return { allDay: false, start: new Date(start), end: placed.end };
}

/**
 * An event moved from the keyboard: by `minutes` on the clock or by whole
 * `days`. With `resize`, only its end moves.
 */
export function nudge(
  placed: PlacedEvent,
  by: { minutes?: number; days?: number },
  resize: boolean,
  { step, timeZone }: EditOptions,
): Times {
  const days = by.days ?? 0;
  if (placed.allDay) {
    if (!resize) return byDays(placed, days, timeZone);
    const lastDay = addDays(placed.lastDay, days);
    return {
      allDay: true,
      firstDay: placed.firstDay,
      lastDay: lastDay < placed.firstDay ? placed.firstDay : lastDay,
    };
  }
  const minutes = days * 1440 + (by.minutes ?? 0);
  if (!resize) {
    return {
      allDay: false,
      start: shiftClock(placed.start, minutes, timeZone),
      end: shiftClock(placed.end, minutes, timeZone),
    };
  }
  const end = shiftClock(placed.end, minutes, timeZone);
  const shortest = placed.start.getTime() + step * minute;
  return {
    allDay: false,
    start: placed.start,
    end: end.getTime() < shortest ? new Date(shortest) : end,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** A moment as a time on the clock in a time zone, `yyyy-MM-ddTHH:mm`. */
export function wallOf(moment: Date, timeZone: string): string {
  const at = minutesOf(moment, timeZone);
  return `${dayOf(moment, timeZone)}T${pad(Math.floor(at / 60))}:${pad(at % 60)}`;
}

/**
 * A new moment written the way the old one was: a `Date` as a `Date`, a
 * string with a zone as an ISO string, and a clock time as a clock time.
 */
function writeLike(
  original: Date | string,
  moment: Date,
  timeZone: string,
): Date | string {
  if (original instanceof Date) return moment;
  if (!wallTime.test(original.trim())) return moment.toISOString();
  return wallOf(moment, timeZone);
}

/**
 * The event with new times, its dates written the way they came: a `Date`
 * stays a `Date`, a moment with a zone stays one, and a clock time is
 * written on the event's own clock. Whole days are written `yyyy-MM-dd`.
 */
export function withTimes(
  event: CalendarEvent,
  times: Times,
  timeZone: string,
): CalendarEvent {
  const { allDay: _, ...rest } = event;
  if (times.allDay) {
    return { ...rest, allDay: true, start: times.firstDay, end: times.lastDay };
  }
  const zone = event.timeZone ?? timeZone;
  return {
    ...rest,
    start: writeLike(event.start, times.start, zone),
    end: writeLike(event.end, times.end, zone),
  };
}

/**
 * Whether a part of an event can be dragged, from its own settings, or
 * those it takes from its resources.
 */
export function canDrag(
  event: Pick<CalendarEvent, "readOnly" | "draggable" | "resizable">,
  editable: boolean,
  part: "move" | "start" | "end",
): boolean {
  if (!editable || event.readOnly) return false;
  if (part === "move") return event.draggable !== false;
  const resizable = event.resizable ?? true;
  return resizable === true || resizable === part;
}

/**
 * The times of an event made at one spot: the whole day, or from the time
 * there, snapped down to the step, for `duration` minutes.
 */
export function timesAt(
  spot: Spot,
  duration: number,
  { step, timeZone }: EditOptions,
  allDay = false,
): Times {
  if (spot.minute === null || allDay) {
    return { allDay: true, firstDay: spot.day, lastDay: spot.day };
  }
  const start = momentAt(spot.day, floorTo(spot.minute, step), timeZone);
  return {
    allDay: false,
    start,
    end: new Date(start.getTime() + duration * minute),
  };
}

/** Whether two versions of an event are at the same times. */
export function sameTimes(a: Times, b: Times): boolean {
  if (a.allDay || b.allDay) {
    return (
      a.allDay &&
      b.allDay &&
      a.firstDay === b.firstDay &&
      a.lastDay === b.lastDay
    );
  }
  return (
    a.start.getTime() === b.start.getTime() &&
    a.end.getTime() === b.end.getTime()
  );
}
