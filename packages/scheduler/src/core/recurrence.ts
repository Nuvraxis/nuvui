import {
  addDays,
  addMonths,
  type DayKey,
  dayOf,
  daysBetween,
  endOfMonth,
  minutesOf,
  momentOf,
  startOfMonth,
  startOfWeek,
  toDay,
  toMoment,
  weekdayOf,
} from "./dates";
import { withTimes } from "./edit";
import type { CalendarEvent } from "./events";

/** A day of the week, as RFC 5545 writes it. */
export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

/** The days of the week from Sunday, as `weekdayOf` numbers them. */
export const weekdayNames: readonly Weekday[] = [
  "SU",
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
];

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

/** How an event repeats, as an object. */
export interface RecurrenceRule {
  frequency: Frequency;
  /**
   * Every so many days, weeks, months or years.
   * @default 1
   */
  interval?: number;
  /**
   * The days of the week it's on. Weekly, the days in each week, the
   * start's by default. Monthly or yearly with `week`, the day in that week
   * of the month, and without it, every one of them in the month. Daily,
   * the only days it's on.
   */
  weekdays?: readonly Weekday[];
  /**
   * Monthly or yearly, with `weekdays`: which of them in the month, from
   * `1` for the first to `5`, or `-1` for the last.
   */
  week?: number;
  /**
   * Monthly or yearly: the day of the month, `1` to `31`, or `-1` for the
   * last. The start's by default. A month without that day is passed by.
   */
  monthDay?: number;
  /** Yearly: the month, `1` to `12`. The start's by default. */
  month?: number;
  /**
   * The last day it can be on, such as `"2026-12-18"`, or the last moment
   * it can start.
   */
  until?: Date | string;
  /** How many times it happens, the first included. */
  count?: number;
  /**
   * The first day of the week, which says where the weeks of a rule every
   * two weeks or more begin.
   * @default "MO"
   */
  weekStart?: Weekday;
}

/**
 * How an event repeats: an RRULE from RFC 5545, such as
 * `"FREQ=WEEKLY;BYDAY=MO,WE"`, or the same as an object.
 */
export type Recurrence = string | RecurrenceRule;

const frequencies: Record<string, Frequency> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

const known = new Set([
  "FREQ",
  "INTERVAL",
  "BYDAY",
  "BYMONTHDAY",
  "BYMONTH",
  "UNTIL",
  "COUNT",
  "WKST",
]);

function warn(message: string) {
  if (typeof console !== "undefined") {
    console.warn(`@nuvui/scheduler: ${message}`);
  }
}

const isWeekday = (value: string): value is Weekday =>
  weekdayNames.includes(value as Weekday);

// "20261218" or "20261218T170000Z", as a date the rest of the calendar reads.
function untilFrom(text: string): string | undefined {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/.exec(
    text,
  );
  if (!match) return undefined;
  const [, year, month, day, hours, minutes, seconds, utc] = match;
  const date = `${year}-${month}-${day}`;
  return hours ? `${date}T${hours}:${minutes}:${seconds}${utc}` : date;
}

/**
 * An RRULE read as an object, or `null` when it has no frequency the
 * calendar knows. Parts the calendar doesn't take are left out, with a
 * warning.
 */
export function parseRule(text: string): RecurrenceRule | null {
  const parts = new Map<string, string>();
  for (const part of text
    .trim()
    .replace(/^RRULE:/i, "")
    .split(";")) {
    const [name, value] = part.split("=");
    if (name && value) {
      parts.set(name.trim().toUpperCase(), value.trim().toUpperCase());
    }
  }
  const frequency = frequencies[parts.get("FREQ") ?? ""];
  if (!frequency) {
    warn(
      `"${text}" has no FREQ of DAILY, WEEKLY, MONTHLY or YEARLY, so the event doesn't repeat.`,
    );
    return null;
  }
  const left = [...parts.keys()].filter((name) => !known.has(name));
  if (left.length > 0) {
    warn(`"${text}" has ${left.join(", ")}, which the calendar leaves out.`);
  }
  const number = (name: string) => {
    const value = Number(parts.get(name)?.split(",")[0]);
    return Number.isInteger(value) ? value : undefined;
  };
  const rule: RecurrenceRule = { frequency };
  const interval = number("INTERVAL");
  if (interval !== undefined && interval > 1) rule.interval = interval;
  const days = parts.get("BYDAY")?.split(",") ?? [];
  const weekdays: Weekday[] = [];
  for (const day of days) {
    const match = /^([+-]?\d)?([A-Z]{2})$/.exec(day);
    const name = match?.[2] ?? "";
    if (!match || !isWeekday(name)) continue;
    weekdays.push(name);
    if (match[1] !== undefined) rule.week ??= Number(match[1]);
  }
  if (weekdays.length > 0) rule.weekdays = weekdays;
  if ((parts.get("BYMONTHDAY") ?? "").includes(",")) {
    warn(`"${text}" has more than one BYMONTHDAY, and only the first is used.`);
  }
  const monthDay = number("BYMONTHDAY");
  if (monthDay !== undefined) rule.monthDay = monthDay;
  const month = number("BYMONTH");
  if (month !== undefined) rule.month = month;
  const until = untilFrom(parts.get("UNTIL") ?? "");
  if (until) rule.until = until;
  const count = number("COUNT");
  if (count !== undefined) rule.count = count;
  const weekStart = parts.get("WKST") ?? "";
  if (isWeekday(weekStart)) rule.weekStart = weekStart;
  return rule;
}

// Rules read from text, so each is read, and warned about, once.
const parsed = new Map<string, RecurrenceRule | null>();

/** An event's recurrence as an object, or `null` when it doesn't repeat. */
export function ruleOf(
  recurrence: Recurrence | undefined,
): RecurrenceRule | null {
  if (!recurrence) return null;
  if (typeof recurrence !== "string") return recurrence;
  let rule = parsed.get(recurrence);
  if (rule === undefined) {
    rule = parseRule(recurrence);
    parsed.set(recurrence, rule);
  }
  return rule;
}

const pad = (value: number) => String(value).padStart(2, "0");

// A moment as RFC 5545 writes one in UTC: "20261218T170000Z".
const utcText = (moment: Date) =>
  `${moment.getUTCFullYear()}${pad(moment.getUTCMonth() + 1)}${pad(moment.getUTCDate())}T${pad(moment.getUTCHours())}${pad(moment.getUTCMinutes())}${pad(moment.getUTCSeconds())}Z`;

/**
 * A rule as an RRULE. `until` is a date for an event that takes whole
 * days, and a moment in UTC for one with a time, as RFC 5545 has it: a day
 * on its own is the end of that day in `timeZone`.
 */
export function formatRule(
  rule: RecurrenceRule,
  allDay: boolean,
  timeZone: string,
): string {
  const parts = [`FREQ=${rule.frequency.toUpperCase()}`];
  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }
  if (rule.weekdays?.length) {
    const week = rule.week ? String(rule.week) : "";
    parts.push(`BYDAY=${rule.weekdays.map((day) => week + day).join(",")}`);
  }
  if (rule.monthDay) parts.push(`BYMONTHDAY=${rule.monthDay}`);
  if (rule.month) parts.push(`BYMONTH=${rule.month}`);
  const until = untilOf(rule, timeZone);
  if (until?.day) {
    parts.push(
      `UNTIL=${
        allDay
          ? until.day.replaceAll("-", "")
          : utcText(
              new Date(
                momentOf(addDays(until.day, 1), 0, timeZone).getTime() - 1000,
              ),
            )
      }`,
    );
  } else if (until?.moment) {
    parts.push(
      `UNTIL=${allDay ? dayOf(until.moment, timeZone).replaceAll("-", "") : utcText(until.moment)}`,
    );
  }
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  if (rule.weekStart && rule.weekStart !== "MO") {
    parts.push(`WKST=${rule.weekStart}`);
  }
  return parts.join(";");
}

/**
 * A rule written the way the event's was: as an RRULE if it was one, and
 * as an object if it was one. An event that had none takes `asObject`.
 */
export function writeRule(
  rule: RecurrenceRule,
  like: Recurrence | undefined,
  asObject: boolean,
  allDay: boolean,
  timeZone: string,
): Recurrence {
  const text = like === undefined ? !asObject : typeof like === "string";
  return text ? formatRule(rule, allDay, timeZone) : rule;
}

/** Where a rule stops: the last day it can be on, or the last moment it can start. */
export function untilOf(
  rule: RecurrenceRule,
  timeZone: string,
): { day?: DayKey; moment?: Date } | null {
  const { until } = rule;
  if (until === undefined) return null;
  if (typeof until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(until.trim())) {
    return { day: until.trim() };
  }
  return { moment: toMoment(until, timeZone) };
}

/** A repeating event, worked out in its own time zone. */
export interface Series {
  rule: RecurrenceRule;
  /** The event's own time zone, or the calendar's. */
  zone: string;
  allDay: boolean;
  startDay: DayKey;
  /** Minutes into its day that it starts and ends, on its own clock. */
  startMinute: number;
  endMinute: number;
  /** Days from the day it starts to the day it ends. */
  length: number;
  /** The days left out. */
  exceptions: Set<DayKey>;
}

/** An event's series, or `null` when it doesn't repeat. */
export function seriesOf(
  event: CalendarEvent,
  timeZone: string,
): Series | null {
  const rule = ruleOf(event.recurrence);
  if (!rule) return null;
  const zone = event.timeZone ?? timeZone;
  const exceptions = new Set(
    (event.exceptions ?? []).map((value) => toDay(value, zone)),
  );
  if (event.allDay) {
    const startDay = toDay(event.start, zone);
    const lastDay = toDay(event.end, zone);
    return {
      rule,
      zone,
      allDay: true,
      startDay,
      startMinute: 0,
      endMinute: 0,
      length: Math.max(0, daysBetween(startDay, lastDay)),
      exceptions,
    };
  }
  const start = toMoment(event.start, zone);
  const given = toMoment(event.end, zone);
  const end = given < start ? start : given;
  const startDay = dayOf(start, zone);
  return {
    rule,
    zone,
    allDay: false,
    startDay,
    startMinute: minutesOf(start, zone),
    endMinute: minutesOf(end, zone),
    length: daysBetween(startDay, dayOf(end, zone)),
    exceptions,
  };
}

// Periods looked through for a day before giving up: a rule that finds
// none, such as the 31st of every April, would go on for ever.
const mostPeriods = 50_000;

const year = (day: DayKey) => Number(day.slice(0, 4));
const monthNumber = (day: DayKey) => Number(day.slice(5, 7));
const dateNumber = (day: DayKey) => Number(day.slice(8, 10));

/** The days in a month the rule puts the event on, in order. */
function inMonth(
  rule: RecurrenceRule,
  first: DayKey,
  startDay: DayKey,
): DayKey[] {
  const length = dateNumber(endOfMonth(first));
  if (rule.weekdays?.length) {
    const days: DayKey[] = [];
    for (const name of rule.weekdays) {
      const weekday = weekdayNames.indexOf(name);
      const all: DayKey[] = [];
      let day = addDays(first, (weekday - weekdayOf(first) + 7) % 7);
      while (day.slice(0, 7) === first.slice(0, 7)) {
        all.push(day);
        day = addDays(day, 7);
      }
      if (rule.week) {
        const picked =
          all[rule.week > 0 ? rule.week - 1 : all.length + rule.week];
        if (picked) days.push(picked);
      } else days.push(...all);
    }
    return days.sort();
  }
  const wanted = rule.monthDay ?? dateNumber(startDay);
  const date = wanted > 0 ? wanted : length + 1 + wanted;
  return date >= 1 && date <= length
    ? [`${first.slice(0, 8)}${pad(date)}`]
    : [];
}

const weekStartOf = (rule: RecurrenceRule) =>
  weekdayNames.indexOf(rule.weekStart ?? "MO");

/** The first day of a period, so far from the first period. */
function periodStart(rule: RecurrenceRule, startDay: DayKey, offset: number) {
  switch (rule.frequency) {
    case "daily":
      return addDays(startDay, offset);
    case "weekly":
      return addDays(startOfWeek(startDay, weekStartOf(rule)), offset * 7);
    case "monthly":
      return addMonths(startOfMonth(startDay), offset);
    default:
      return `${String(year(startDay) + offset).padStart(4, "0")}-01-01`;
  }
}

/** The days the rule puts the event on in a period, in order. */
function inPeriod(
  rule: RecurrenceRule,
  startDay: DayKey,
  offset: number,
): DayKey[] {
  const first = periodStart(rule, startDay, offset);
  switch (rule.frequency) {
    case "daily":
      return !rule.weekdays?.length ||
        rule.weekdays.includes(weekdayNames[weekdayOf(first)] as Weekday)
        ? [first]
        : [];
    case "weekly": {
      const names = rule.weekdays?.length
        ? rule.weekdays
        : [weekdayNames[weekdayOf(startDay)] as Weekday];
      return [0, 1, 2, 3, 4, 5, 6]
        .map((index) => addDays(first, index))
        .filter((day) =>
          names.includes(weekdayNames[weekdayOf(day)] as Weekday),
        );
    }
    case "monthly":
      return inMonth(rule, first, startDay);
    default: {
      const month = rule.month ?? monthNumber(startDay);
      return inMonth(rule, `${first.slice(0, 5)}${pad(month)}-01`, startDay);
    }
  }
}

/** How many periods from the one a day is in to the one another is in. */
function periodsBetween(rule: RecurrenceRule, from: DayKey, to: DayKey) {
  switch (rule.frequency) {
    case "daily":
      return daysBetween(from, to);
    case "weekly": {
      const start = weekStartOf(rule);
      return daysBetween(startOfWeek(from, start), startOfWeek(to, start)) / 7;
    }
    case "monthly":
      return (year(to) - year(from)) * 12 + monthNumber(to) - monthNumber(from);
    default:
      return year(to) - year(from);
  }
}

/**
 * The days a series starts on, in order, up to `last`: its first day
 * always, as RFC 5545 has it, then each the rule gives, until it ends.
 * Days left out are among them, since they count towards `count`. With no
 * `count`, it starts near `near` rather than at the first.
 */
export function* seriesDays(
  series: Series,
  last: DayKey,
  near?: DayKey,
): Generator<DayKey> {
  const { rule, startDay, zone } = series;
  const interval = Math.max(1, Math.floor(rule.interval ?? 1));
  const until = untilOf(rule, zone);
  const within = (day: DayKey) =>
    until?.day
      ? day <= until.day
      : until?.moment
        ? series.allDay
          ? day <= dayOf(until.moment, zone)
          : momentOf(day, series.startMinute, zone) <= until.moment
        : true;
  if (!within(startDay)) return;
  yield startDay;
  let made = 1;
  if (rule.count !== undefined && made >= rule.count) return;
  let period =
    rule.count === undefined && near && near > startDay
      ? Math.max(
          0,
          Math.floor(periodsBetween(rule, startDay, near) / interval) - 1,
        )
      : 0;
  for (let tries = 0; tries < mostPeriods; tries += 1, period += 1) {
    if (periodStart(rule, startDay, period * interval) > last) return;
    for (const day of inPeriod(rule, startDay, period * interval)) {
      if (day <= startDay) continue;
      if (day > last || !within(day)) return;
      yield day;
      made += 1;
      if (rule.count !== undefined && made >= rule.count) return;
    }
  }
}

const occurrenceKey = Symbol("occurrence");

/** Where an occurrence of a repeating event comes from. */
export interface Occurrence {
  /** The repeating event, as it was given. */
  series: CalendarEvent;
  /** The day it was due to start on, in the series' time zone. */
  day: DayKey;
}

type Marked = CalendarEvent & { [occurrenceKey]?: Occurrence };

/**
 * The series an event drawn on the calendar is an occurrence of, or
 * `undefined` for one that doesn't repeat. It's kept through copies, so an
 * occurrence being dragged still knows it.
 */
export function occurrenceOf(event: CalendarEvent): Occurrence | undefined {
  return (event as Marked)[occurrenceKey];
}

/** An event without what marks it as an occurrence. */
export function unmarked(event: CalendarEvent): CalendarEvent {
  const { [occurrenceKey]: _, ...rest } = event as Marked;
  return rest;
}

/** The occurrence of a series on a day, with an id of its own. */
export function occurrenceOn(
  event: CalendarEvent,
  series: Series,
  day: DayKey,
  timeZone: string,
): CalendarEvent {
  const { recurrence: _, exceptions: __, ...base } = event;
  const occurrence: Marked = withTimes(
    { ...base, id: `${event.id}:${day}` },
    series.allDay
      ? { allDay: true, firstDay: day, lastDay: addDays(day, series.length) }
      : {
          allDay: false,
          start: momentOf(day, series.startMinute, series.zone),
          end: momentOf(
            addDays(day, series.length),
            series.endMinute,
            series.zone,
          ),
        },
    timeZone,
  );
  occurrence[occurrenceKey] = { series: event, day };
  return occurrence;
}

/**
 * The events with each that repeats in place of its occurrences that touch
 * the days from `from` to `to`, each with an id of its own.
 */
export function expandEvents(
  events: readonly CalendarEvent[],
  timeZone: string,
  from: DayKey,
  to: DayKey,
): CalendarEvent[] {
  if (!events.some((event) => event.recurrence)) return [...events];
  const out: CalendarEvent[] = [];
  for (const event of events) {
    const series = seriesOf(event, timeZone);
    if (!series) {
      out.push(event);
      continue;
    }
    // A day either side, for a time zone ahead of or behind the one shown.
    const lowest = addDays(from, -series.length - 1);
    for (const day of seriesDays(series, addDays(to, 1), lowest)) {
      if (day < lowest || series.exceptions.has(day)) continue;
      out.push(occurrenceOn(event, series, day, timeZone));
    }
  }
  return out;
}
