import { TZDate } from "@date-fns/tz";

/**
 * A day on the calendar, as `yyyy-MM-dd`. A day is a place on the page, not
 * a moment: the 14th starts at a different instant in Tokyo and in Lima.
 * Kept as text, days sort and compare as strings, and adding to one never
 * depends on a time zone or a change to summer time.
 */
export type DayKey = string;

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

function fromUtc(date: Date): DayKey {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function toUtc(day: DayKey): Date {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

export function addDays(day: DayKey, count: number): DayKey {
  const date = toUtc(day);
  date.setUTCDate(date.getUTCDate() + count);
  return fromUtc(date);
}

export function addMonths(day: DayKey, count: number): DayKey {
  const date = toUtc(day);
  const wanted = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  // The 31st of a month with 30 days is the 30th, not the 1st of the next.
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(wanted, last));
  return fromUtc(date);
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000);
}

/** 0 for Sunday to 6 for Saturday. */
export function weekdayOf(day: DayKey): number {
  return toUtc(day).getUTCDay();
}

export function startOfWeek(day: DayKey, weekStartsOn: number): DayKey {
  return addDays(day, -((weekdayOf(day) - weekStartsOn + 7) % 7));
}

export function startOfMonth(day: DayKey): DayKey {
  return `${day.slice(0, 8)}01`;
}

export function endOfMonth(day: DayKey): DayKey {
  return addDays(addMonths(startOfMonth(day), 1), -1);
}

export function isWeekend(day: DayKey): boolean {
  const weekday = weekdayOf(day);
  return weekday === 0 || weekday === 6;
}

/** Every day from `from` to `to`, both included. */
export function daysFrom(from: DayKey, to: DayKey): DayKey[] {
  const days: DayKey[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * The day as a moment at noon in UTC. Formatted with `timeZone: "UTC"`, it
 * gives the day's own name and number wherever the page is read.
 */
export function noonOf(day: DayKey): Date {
  const date = toUtc(day);
  date.setUTCHours(12);
  return date;
}

/** Which day a moment falls on, in a time zone. */
export function dayOf(moment: Date, timeZone: string): DayKey {
  const zoned = new TZDate(moment.getTime(), timeZone);
  return `${pad(zoned.getFullYear(), 4)}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`;
}

/** Minutes since midnight, on the clock in a time zone. */
export function minutesOf(moment: Date, timeZone: string): number {
  const zoned = new TZDate(moment.getTime(), timeZone);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/** The moment a day starts, plus some minutes, in a time zone. */
export function momentOf(day: DayKey, minutes: number, timeZone: string): Date {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(
    new TZDate(
      year,
      month - 1,
      date,
      Math.floor(minutes / 60),
      minutes % 60,
      timeZone,
    ).getTime(),
  );
}

// "2026-10-14", "2026-10-14T09:30" or "2026-10-14T09:30:15", with no zone.
const wallTime =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

/**
 * An event's date as a moment. A `Date`, or a string that ends in `Z` or an
 * offset, is a moment already. A string without one is a time on the clock
 * in `timeZone`, so "2026-10-14T09:00" stays at nine whichever side of a
 * change to summer time it falls on.
 */
export function toMoment(value: Date | string, timeZone: string): Date {
  if (value instanceof Date) return value;
  const match = wallTime.exec(value.trim());
  if (!match) return new Date(value);
  const [, year, month, date, hours = "0", minutes = "0", seconds = "0"] =
    match;
  return new Date(
    new TZDate(
      Number(year),
      Number(month) - 1,
      Number(date),
      Number(hours),
      Number(minutes),
      Number(seconds),
      timeZone,
    ).getTime(),
  );
}

/**
 * The day an all-day event's date names. A string's own date is taken as
 * written, so "2026-10-14" is the 14th everywhere. A `Date` is read in the
 * time zone shown.
 */
export function toDay(value: Date | string, timeZone: string): DayKey {
  if (typeof value === "string") {
    const match = wallTime.exec(value.trim());
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return dayOf(toMoment(value, timeZone), timeZone);
}

/** The time zone the browser is in. */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
