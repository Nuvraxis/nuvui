import { addDays, type DayKey, dayOf, daysBetween, toDay } from "./dates";
import { shiftClock, type Times, timesOf, withTimes } from "./edit";
import { type CalendarEvent, type EventChange, place } from "./events";
import {
  type Occurrence,
  type RecurrenceRule,
  type Series,
  seriesDays,
  seriesOf,
  unmarked,
  weekdayNames,
  writeRule,
} from "./recurrence";

/**
 * Which of a repeating event's occurrences a change is for: the one it was
 * made to, that one and those after it, or every one.
 */
export type Scope = "one" | "following" | "all";

export interface SeriesOptions {
  /** The time zone shown. */
  timeZone: string;
  createId: () => string;
  /** A rule for an event that had none is written as an object, not an RRULE. */
  objectRules: boolean;
}

/** Times moved by whole days, keeping their clock times in a time zone. */
function shift(times: Times, days: number, zone: string): Times {
  if (days === 0) return times;
  return times.allDay
    ? {
        allDay: true,
        firstDay: addDays(times.firstDay, days),
        lastDay: addDays(times.lastDay, days),
      }
    : {
        allDay: false,
        start: shiftClock(times.start, days * 1440, zone),
        end: shiftClock(times.end, days * 1440, zone),
      };
}

const firstDayOf = (times: Times, zone: string) =>
  times.allDay ? times.firstDay : dayOf(times.start, zone);

/**
 * A rule for a series moved by whole days. Its days of the week move with
 * it, and a day of the month or a month it named is the new start's.
 */
function shiftRule(rule: RecurrenceRule, days: number): RecurrenceRule {
  if (days === 0) return rule;
  const { monthDay: _, month: __, ...rest } = rule;
  if (!rest.weekdays) return rest;
  const turn = ((days % 7) + 7) % 7;
  return {
    ...rest,
    weekdays: rest.weekdays.map(
      (name) => weekdayNames[(weekdayNames.indexOf(name) + turn) % 7] ?? name,
    ),
  };
}

/** The event with a rule, or without one, written the way it came. */
function withRule(
  event: CalendarEvent,
  rule: RecurrenceRule | null,
  like: CalendarEvent,
  { timeZone, objectRules }: SeriesOptions,
): CalendarEvent {
  const { recurrence: _, ...rest } = event;
  if (!rule) return rest;
  return {
    ...rest,
    recurrence: writeRule(
      rule,
      like.recurrence,
      objectRules,
      event.allDay === true,
      event.timeZone ?? timeZone,
    ),
  };
}

/** The event with these days left out, or with none. */
function withExceptions(
  event: CalendarEvent,
  exceptions: readonly (Date | string)[],
): CalendarEvent {
  const { exceptions: _, ...rest } = event;
  return exceptions.length > 0 ? { ...rest, exceptions } : rest;
}

/** The days left out of a series, from the day given on or before it. */
function exceptionsFrom(
  event: CalendarEvent,
  zone: string,
  keep: (day: DayKey) => boolean,
) {
  return (event.exceptions ?? []).filter((value) => keep(toDay(value, zone)));
}

/** The series ended on the day before one of its occurrences. */
function endedBefore(
  event: CalendarEvent,
  series: Series,
  day: DayKey,
  options: SeriesOptions,
): CalendarEvent {
  const { count: _, ...rule } = series.rule;
  return withExceptions(
    withRule(event, { ...rule, until: addDays(day, -1) }, event, options),
    exceptionsFrom(event, series.zone, (left) => left < day),
  );
}

/** How many times a series happens before a day, those left out included. */
function countBefore(series: Series, day: DayKey): number {
  let count = 0;
  for (const each of seriesDays(series, day)) if (each < day) count += 1;
  return count;
}

export interface OccurrenceChange {
  changes: EventChange[];
  /** The id of the event drawn where the occurrence went, to take the focus. */
  focus: string;
}

/**
 * The changes that put an occurrence where `next` says, for the scope
 * chosen. `rule` is the series' rule after the change: `undefined` when
 * it's the same, and `null` when it no longer repeats.
 *
 * One occurrence becomes an event of its own, and is left out of the
 * series. From one on, the series ends the day before and a new one starts.
 * All of them moves the series by as many days as the occurrence moved,
 * and gives it the new times on the clock.
 */
export function changeOccurrence(
  { series: event, day }: Occurrence,
  next: CalendarEvent,
  scope: Scope,
  rule: RecurrenceRule | null | undefined,
  options: SeriesOptions,
): OccurrenceChange {
  const series = seriesOf(event, options.timeZone);
  const { recurrence: _, exceptions: __, ...fields } = unmarked(next);
  const times = timesOf(place(next, options.timeZone));
  if (!series) {
    const updated = withTimes(
      { ...event, ...fields, id: event.id },
      times,
      options.timeZone,
    );
    return {
      changes: [{ type: "update", event: updated, previous: event }],
      focus: event.id,
    };
  }
  const { zone } = series;
  const newDay = firstDayOf(times, zone);
  const moved = daysBetween(day, newDay);

  if (scope === "one") {
    const single = withTimes(
      { ...fields, id: options.createId() },
      times,
      options.timeZone,
    );
    const updated = withExceptions(event, [...(event.exceptions ?? []), day]);
    return {
      changes: [
        { type: "update", event: updated, previous: event },
        { type: "create", event: single },
      ],
      focus: single.id,
    };
  }

  if (scope === "all" || day === series.startDay) {
    if (rule === null) {
      const single = withExceptions(
        withTimes(
          { ...event, ...fields, id: event.id },
          times,
          options.timeZone,
        ),
        [],
      );
      const { recurrence: ___, ...updated } = single;
      return {
        changes: [{ type: "update", event: updated, previous: event }],
        focus: event.id,
      };
    }
    const updated = withExceptions(
      withRule(
        withTimes(
          { ...event, ...fields, id: event.id },
          shift(times, daysBetween(day, series.startDay), zone),
          options.timeZone,
        ),
        rule ?? shiftRule(series.rule, moved),
        event,
        options,
      ),
      exceptionsFrom(event, zone, () => true).map((value) =>
        addDays(toDay(value, zone), moved),
      ),
    );
    return {
      changes: [{ type: "update", event: updated, previous: event }],
      focus: `${event.id}:${addDays(series.startDay, moved)}`,
    };
  }

  const before = endedBefore(event, series, day, options);
  const id = options.createId();
  let after: CalendarEvent;
  if (rule === null) {
    after = withTimes({ ...fields, id }, times, options.timeZone);
  } else {
    const { count } = series.rule;
    const kept = shiftRule(
      count === undefined
        ? series.rule
        : {
            ...series.rule,
            count: Math.max(1, count - countBefore(series, day)),
          },
      moved,
    );
    after = withExceptions(
      withRule(
        withTimes({ ...event, ...fields, id }, times, options.timeZone),
        rule ?? kept,
        event,
        options,
      ),
      exceptionsFrom(event, zone, (left) => left > day).map((value) =>
        addDays(toDay(value, zone), moved),
      ),
    );
  }
  return {
    changes: [
      { type: "update", event: before, previous: event },
      { type: "create", event: after },
    ],
    focus: rule === null ? id : `${id}:${newDay}`,
  };
}

/**
 * The change that deletes an occurrence, for the scope chosen: it's left
 * out of the series, the series ends the day before it, or the series goes.
 */
export function deleteOccurrence(
  { series: event, day }: Occurrence,
  scope: Scope,
  options: SeriesOptions,
): EventChange {
  const series = seriesOf(event, options.timeZone);
  if (
    !series ||
    scope === "all" ||
    (scope === "following" && day === series.startDay)
  ) {
    return { type: "delete", event };
  }
  const updated =
    scope === "one"
      ? withExceptions(event, [...(event.exceptions ?? []), day])
      : endedBefore(event, series, day, options);
  return { type: "update", event: updated, previous: event };
}
