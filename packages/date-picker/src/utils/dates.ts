import { TZDate } from "@date-fns/tz";
import { format, isValid, type Locale, parse, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { dateMatchModifiers, type Matcher } from "react-day-picker";

// The same moment, read in the given time zone. The day of the month is a
// property of a place as much as of a moment: one instant is the 14th in
// Samoa and the 15th in Kiribati.
function inZone(date: Date, timeZone: string | undefined): Date {
  if (!timeZone) return date;
  if (date instanceof TZDate && date.timeZone === timeZone) return date;
  return new TZDate(date, timeZone);
}

/**
 * A date as `yyyy-MM-dd`, which is what a form submits. `toISOString` would
 * be wrong here: it gives the day in UTC, which is the day before or after
 * for anyone far enough from Greenwich.
 */
export function isoDate(date: Date | undefined, timeZone?: string): string {
  return date ? format(inZone(date, timeZone), "yyyy-MM-dd") : "";
}

/** The pattern a locale writes a short date in, such as `MM/dd/yyyy`. */
export function shortPattern(locale: Locale | undefined): string {
  return (locale ?? enUS).formatLong.date({ width: "short" });
}

export function formatDate(
  date: Date,
  pattern: string,
  locale: Locale | undefined,
  timeZone: string | undefined,
): string {
  return format(inZone(date, timeZone), pattern, { locale });
}

/**
 * Reads a date someone typed. Gives `undefined` for text that isn't a date
 * in the pattern, a day that doesn't exist included.
 */
export function parseDate(
  text: string,
  pattern: string,
  locale: Locale | undefined,
  timeZone: string | undefined,
): Date | undefined {
  const typed = text.trim();
  if (!typed) return undefined;

  // The result takes its time of day and its time zone from this.
  const midnight = startOfDay(timeZone ? TZDate.tz(timeZone) : new Date());
  const date = parse(typed, pattern, midnight, { locale });
  if (!isValid(date)) return undefined;

  // "1/5/26" matches a pattern with a four-digit year, as the year 26. Read
  // it the way it was meant, unless the year was written out with zeros.
  if (date.getFullYear() < 100 && !/\d{3}/.test(typed)) {
    const expanded = pattern === "P" ? shortPattern(locale) : pattern;
    const short = expanded.replace(/y+/, "yy");
    const again = parse(typed, short, midnight, { locale });
    return isValid(again) ? again : undefined;
  }
  return date;
}

// Every day that can't be picked: those outside the allowed span, and those
// the matchers rule out. The two ends are read in the time zone, which is
// what the calendar does with them too.
export function disabledDays(
  min: Date | undefined,
  max: Date | undefined,
  disabledDates: Matcher | Matcher[] | undefined,
  timeZone: string | undefined,
): Matcher[] {
  return [
    ...(min ? [{ before: inZone(min, timeZone) }] : []),
    ...(max ? [{ after: inZone(max, timeZone) }] : []),
    ...(Array.isArray(disabledDates)
      ? disabledDates
      : disabledDates === undefined
        ? []
        : [disabledDates]),
  ];
}

export function isDisabled(date: Date, matchers: Matcher[]): boolean {
  return matchers.length > 0 && dateMatchModifiers(date, matchers);
}
