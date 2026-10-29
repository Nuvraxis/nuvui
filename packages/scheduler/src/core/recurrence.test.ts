import { afterEach, describe, expect, test, vi } from "vitest";
import { type CalendarEvent, placeEvents } from "./events";
import {
  expandEvents,
  formatRule,
  occurrenceOf,
  parseRule,
  type Recurrence,
} from "./recurrence";

afterEach(() => {
  vi.restoreAllMocks();
});

const series = (
  start: string,
  recurrence: Recurrence,
  extra: Partial<CalendarEvent> = {},
): CalendarEvent => ({
  id: "series",
  title: "Series",
  start,
  end: start.includes("T") ? `${start.slice(0, 10)}T10:00` : start,
  allDay: !start.includes("T"),
  recurrence,
  ...extra,
});

/** The days a series is on, from a day to a day, in UTC. */
const days = (event: CalendarEvent, from: string, to: string) =>
  expandEvents([event], "UTC", from, to).map(
    (occurrence) => occurrenceOf(occurrence)?.day,
  );

// Worked out by hand from a calendar. 18 October 2026 is a Sunday.
const rules: [string, string, Recurrence, string[]][] = [
  [
    "every day, three times",
    "2026-10-14",
    "FREQ=DAILY;COUNT=3",
    ["2026-10-14", "2026-10-15", "2026-10-16"],
  ],
  [
    "every other day, up to a day",
    "2026-10-14",
    "FREQ=DAILY;INTERVAL=2;UNTIL=20261020",
    ["2026-10-14", "2026-10-16", "2026-10-18", "2026-10-20"],
  ],
  [
    "every week, on the start's day",
    "2026-10-14",
    "FREQ=WEEKLY;COUNT=3",
    ["2026-10-14", "2026-10-21", "2026-10-28"],
  ],
  [
    "every week on three days, from the middle one",
    "2026-10-14",
    "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=5",
    ["2026-10-14", "2026-10-16", "2026-10-19", "2026-10-21", "2026-10-23"],
  ],
  [
    "every two weeks on two days, the weeks from Monday",
    "2026-10-15",
    "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH;COUNT=4",
    ["2026-10-15", "2026-10-26", "2026-10-29", "2026-11-09"],
  ],
  [
    "every month on the 31st, past the months without one",
    "2026-01-31",
    "FREQ=MONTHLY;COUNT=4",
    ["2026-01-31", "2026-03-31", "2026-05-31", "2026-07-31"],
  ],
  [
    "every month on its last day",
    "2026-01-31",
    "FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=4",
    ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"],
  ],
  [
    "the last day of February in a leap year",
    "2028-01-31",
    "FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=2",
    ["2028-01-31", "2028-02-29"],
  ],
  [
    "the second Tuesday",
    "2026-10-13",
    "FREQ=MONTHLY;BYDAY=2TU;COUNT=3",
    ["2026-10-13", "2026-11-10", "2026-12-08"],
  ],
  [
    "the last Friday",
    "2026-10-30",
    "FREQ=MONTHLY;BYDAY=-1FR;COUNT=3",
    ["2026-10-30", "2026-11-27", "2026-12-25"],
  ],
  [
    "every year on the 29th of February, in leap years",
    "2028-02-29",
    "FREQ=YEARLY;COUNT=2",
    ["2028-02-29", "2032-02-29"],
  ],
  [
    "the fourth Thursday of November",
    "2026-11-26",
    "FREQ=YEARLY;BYMONTH=11;BYDAY=4TH;COUNT=3",
    ["2026-11-26", "2027-11-25", "2028-11-23"],
  ],
  [
    "an object, the same as its RRULE",
    "2026-10-14",
    { frequency: "weekly", weekdays: ["MO", "WE", "FR"], count: 5 },
    ["2026-10-14", "2026-10-16", "2026-10-19", "2026-10-21", "2026-10-23"],
  ],
];

describe("the days a rule gives", () => {
  for (const [name, start, recurrence, expected] of rules) {
    test(name, () => {
      expect(
        days(series(`${start}T09:00`, recurrence), "2026-01-01", "2033-12-31"),
      ).toEqual(expected);
    });
  }

  test("the start is the first, even on a day the rule doesn't name", () => {
    expect(
      days(
        series("2026-10-14T09:00", "FREQ=WEEKLY;BYDAY=MO;COUNT=3"),
        "2026-10-01",
        "2026-11-30",
      ),
    ).toEqual(["2026-10-14", "2026-10-19", "2026-10-26"]);
  });

  test("a day left out still counts towards how many times", () => {
    expect(
      days(
        series("2026-10-14T09:00", "FREQ=WEEKLY;COUNT=3", {
          exceptions: ["2026-10-21"],
        }),
        "2026-10-01",
        "2026-11-30",
      ),
    ).toEqual(["2026-10-14", "2026-10-28"]);
  });

  test("a moment to stop at takes the occurrence that starts at it", () => {
    expect(
      days(
        series("2026-10-14T09:00", "FREQ=DAILY;UNTIL=20261016T090000Z"),
        "2026-10-01",
        "2026-10-31",
      ),
    ).toEqual(["2026-10-14", "2026-10-15", "2026-10-16"]);
  });

  test("only those near the days asked for, and a day either side", () => {
    expect(
      days(
        series("2020-01-01T09:00", "FREQ=DAILY"),
        "2026-10-14",
        "2026-10-15",
      ),
    ).toEqual(["2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"]);
  });

  test("a rule that finds no day after its start gives none, and ends", () => {
    expect(
      days(
        series("2026-04-30T09:00", "FREQ=YEARLY;BYMONTHDAY=31"),
        "2026-05-02",
        "2030-12-31",
      ),
    ).toEqual([]);
  });

  test("an all-day event repeats as whole days", () => {
    const [first, second] = placeEvents(
      [series("2026-10-14", "FREQ=WEEKLY;COUNT=2", { end: "2026-10-15" })],
      "UTC",
      "2026-10-01",
      "2026-10-31",
    );
    expect(first).toMatchObject({
      allDay: true,
      firstDay: "2026-10-14",
      lastDay: "2026-10-15",
    });
    expect(second).toMatchObject({
      firstDay: "2026-10-21",
      lastDay: "2026-10-22",
    });
  });

  test("each occurrence has an id of its own", () => {
    const ids = expandEvents(
      [series("2026-10-14T09:00", "FREQ=DAILY;COUNT=2")],
      "UTC",
      "2026-10-01",
      "2026-10-31",
    ).map((event) => event.id);
    expect(ids).toEqual(["series:2026-10-14", "series:2026-10-15"]);
  });
});

describe("summer time", () => {
  const startsAt = (event: CalendarEvent, shownIn: string) =>
    placeEvents([event], shownIn, "2026-01-01", "2026-12-31").map((item) =>
      item.start.toISOString(),
    );

  test("in Europe, the clock time stays as the clocks go back", () => {
    expect(
      startsAt(
        series("2026-10-23T09:00", "FREQ=DAILY;COUNT=4", {
          timeZone: "Europe/Berlin",
        }),
        "UTC",
      ),
    ).toEqual([
      "2026-10-23T07:00:00.000Z",
      "2026-10-24T07:00:00.000Z",
      "2026-10-25T08:00:00.000Z",
      "2026-10-26T08:00:00.000Z",
    ]);
  });

  test("in America, the clock time stays as the clocks go forward", () => {
    expect(
      startsAt(
        series("2026-03-06T09:00", "FREQ=DAILY;COUNT=4", {
          timeZone: "America/New_York",
        }),
        "UTC",
      ),
    ).toEqual([
      "2026-03-06T14:00:00.000Z",
      "2026-03-07T14:00:00.000Z",
      "2026-03-08T13:00:00.000Z",
      "2026-03-09T13:00:00.000Z",
    ]);
  });

  test("shown in another time zone, it moves while the two changes are apart", () => {
    const placed = placeEvents(
      [
        series("2026-10-23T09:00", "FREQ=WEEKLY;BYDAY=FR,MO;COUNT=4", {
          timeZone: "America/New_York",
        }),
      ],
      "Europe/London",
      "2026-10-01",
      "2026-11-30",
    );
    const london = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
    // London's clocks go back on the 25th, New York's on 1 November.
    expect(placed.map((item) => london.format(item.start))).toEqual([
      "14:00",
      "13:00",
      "13:00",
      "14:00",
    ]);
  });
});

describe("reading and writing an RRULE", () => {
  test("its parts are read into an object", () => {
    expect(
      parseRule(
        "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=20261218;WKST=SU",
      ),
    ).toEqual({
      frequency: "weekly",
      interval: 2,
      weekdays: ["MO", "WE"],
      until: "2026-12-18",
      weekStart: "SU",
    });
    expect(parseRule("FREQ=MONTHLY;BYDAY=-1FR;COUNT=6")).toEqual({
      frequency: "monthly",
      weekdays: ["FR"],
      week: -1,
      count: 6,
    });
  });

  test("a part the calendar doesn't take is left out, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseRule("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1")).toEqual({
      frequency: "monthly",
      weekdays: ["MO", "TU", "WE", "TH", "FR"],
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("BYSETPOS"));
  });

  test("one with no frequency doesn't repeat", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseRule("BYDAY=MO")).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  test("an object is written back as the same RRULE", () => {
    expect(
      formatRule(
        { frequency: "monthly", weekdays: ["TU"], week: 2, count: 3 },
        false,
        "UTC",
      ),
    ).toBe("FREQ=MONTHLY;BYDAY=2TU;COUNT=3");
  });

  test("a last day is the end of that day on the event's clock, in UTC", () => {
    expect(
      formatRule(
        { frequency: "weekly", until: "2026-12-18" },
        false,
        "Europe/Berlin",
      ),
    ).toBe("FREQ=WEEKLY;UNTIL=20261218T225959Z");
    expect(
      formatRule({ frequency: "weekly", until: "2026-12-18" }, true, "UTC"),
    ).toBe("FREQ=WEEKLY;UNTIL=20261218");
  });
});
