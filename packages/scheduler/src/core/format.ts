import { type DayKey, noonOf } from "./dates";

/** Whether a locale writes times with AM and PM by default. */
export function usesTwelveHours(locale: string): boolean {
  const { hourCycle, hour12 } = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).resolvedOptions();
  return hour12 ?? (hourCycle === "h11" || hourCycle === "h12");
}

// Browsers and Node put a thin or a narrow space around a dash and before
// AM and PM, and not always the same one. A page drawn by a server and
// taken over in the browser has to have the same text in both.
const plain = (text: string) => text.replace(/[  ]/g, " ");

/**
 * Every date and time the calendar writes, in the page's language. Days are
 * written from their noon in UTC, so each gets its own name wherever the
 * page is read. Times are moments, written on the clock of the time zone
 * shown.
 */
export function formatters(locale: string, timeZone: string, hour12: boolean) {
  const dayFormat = (options: Intl.DateTimeFormatOptions) => {
    const format = new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: "UTC",
    });
    return (day: DayKey) => plain(format.format(noonOf(day)));
  };
  const range = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12,
    timeZone,
  });
  // Which day a moment is on, to tell whether two are on the same one.
  const dayOfMoment = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  });
  const hour = new Intl.DateTimeFormat(
    locale,
    hour12
      ? { hour: "numeric", hour12, timeZone: "UTC" }
      : { hour: "2-digit", minute: "2-digit", hour12, timeZone: "UTC" },
  );

  return {
    /** "Tuesday, 14 October" */
    day: dayFormat({ weekday: "long", day: "numeric", month: "long" }),
    /** "Tuesday, 14 October 2026" */
    fullDay: dayFormat({
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    /** "Tue" */
    weekday: dayFormat({ weekday: "short" }),
    /** "Tuesday" */
    longWeekday: dayFormat({ weekday: "long" }),
    /** "14" */
    date: dayFormat({ day: "numeric" }),
    /** "14 Oct", for the first day of a month in the month view. */
    shortDay: dayFormat({ day: "numeric", month: "short" }),
    /** "October 2026" */
    month: dayFormat({ month: "long", year: "numeric" }),
    /** "October" */
    monthName: dayFormat({ month: "long" }),
    /** "18 December 2026" */
    longDate: dayFormat({ day: "numeric", month: "long", year: "numeric" }),
    /** "12 – 18 October 2026" */
    range: (from: DayKey, to: DayKey) =>
      plain(
        from === to
          ? range.format(noonOf(from))
          : range.formatRange(noonOf(from), noonOf(to)),
      ),
    /** "9:30 AM" or "09:30" */
    time: (moment: Date) => plain(time.format(moment)),
    /**
     * "9:30 – 10:45 AM", short enough to fit in an event. Across midnight
     * it's the two times, without the dates a range would add.
     */
    timeSpan: (start: Date, end: Date) => {
      if (start.getTime() === end.getTime()) return plain(time.format(start));
      return plain(
        dayOfMoment.format(start) === dayOfMoment.format(end)
          ? time.formatRange(start, end)
          : `${time.format(start)} – ${time.format(end)}`,
      );
    },
    /** "9 AM" or "09:00", down the side of the day. */
    hour: (value: number) =>
      plain(hour.format(new Date(Date.UTC(2026, 0, 1, value)))),
  };
}

export type Formatters = ReturnType<typeof formatters>;
