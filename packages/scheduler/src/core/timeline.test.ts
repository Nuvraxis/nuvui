import { describe, expect, test } from "vitest";
import { type CalendarEvent, place } from "./events";
import { type CalendarResource, indexResources } from "./resources";
import {
  axisOf,
  barsOf,
  columnOf,
  endPositionOf,
  eventsByRow,
  periodStart,
  positionOf,
  rowsOf,
  shiftPeriod,
  spotIn,
  type TimelineRow,
} from "./timeline";

const allDay: readonly [number, number] = [0, 24];
// Two days of hours from Wednesday 14 October 2026, eight to six.
const hourly = axisOf("hours", "2026-10-14", 2, 1, [8, 18]);
// October 2026, a column a day.
const october = axisOf("days", "2026-10-01", 1, 1, allDay);
// October and November 2026 in weeks from Monday. The 1st is a Thursday.
const weekly = axisOf("weeks", "2026-10-01", 2, 1, allDay);
const months = axisOf("months", "2026-01-01", 1, 1, allDay);

describe("periods", () => {
  test("start on the day, the month, the year or the decade", () => {
    expect(periodStart("hours", "2026-10-14", 3)).toBe("2026-10-14");
    expect(periodStart("days", "2026-10-14", 1)).toBe("2026-10-01");
    expect(periodStart("weeks", "2026-10-14", 3)).toBe("2026-10-01");
    expect(periodStart("months", "2026-10-14", 1)).toBe("2026-01-01");
    expect(periodStart("years", "2026-10-14", 10)).toBe("2020-01-01");
    expect(periodStart("years", "2026-10-14", 5)).toBe("2025-01-01");
  });

  test("move on by as much as they show", () => {
    expect(shiftPeriod("hours", "2026-10-14", 3, 1)).toBe("2026-10-17");
    expect(shiftPeriod("days", "2026-10-01", 1, -1)).toBe("2026-09-01");
    expect(shiftPeriod("weeks", "2026-10-01", 3, 1)).toBe("2027-01-01");
    expect(shiftPeriod("months", "2026-01-01", 1, 1)).toBe("2027-01-01");
    expect(shiftPeriod("years", "2020-01-01", 10, 1)).toBe("2030-01-01");
  });
});

describe("columns", () => {
  test("of hours are the hours shown of each day, grouped by day", () => {
    expect(hourly.columns).toHaveLength(20);
    expect(hourly.columns[0]).toEqual({
      first: "2026-10-14",
      last: "2026-10-14",
      hour: 8,
    });
    expect(hourly.columns[10]).toMatchObject({ first: "2026-10-15", hour: 8 });
    expect(hourly.groups).toEqual([
      { first: 0, count: 10, day: "2026-10-14" },
      { first: 10, count: 10, day: "2026-10-15" },
    ]);
    expect([hourly.first, hourly.last]).toEqual(["2026-10-14", "2026-10-15"]);
  });

  test("of days are the days of the months, grouped by month", () => {
    const two = axisOf("days", "2026-10-01", 2, 1, allDay);
    expect(two.columns).toHaveLength(61);
    expect(two.groups).toEqual([
      { first: 0, count: 31, day: "2026-10-01" },
      { first: 31, count: 30, day: "2026-11-01" },
    ]);
  });

  test("of weeks start on the locale's day, each in the month of its fourth day", () => {
    expect(weekly.columns.map((column) => column.first)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
      "2026-11-23",
      "2026-11-30",
    ]);
    expect(weekly.groups).toEqual([
      { first: 0, count: 5, day: "2026-10-01" },
      { first: 5, count: 4, day: "2026-11-05" },
      { first: 9, count: 1, day: "2026-12-03" },
    ]);
  });

  test("of months and years cover their whole length", () => {
    expect(months.columns).toHaveLength(12);
    expect(months.columns[1]).toEqual({
      first: "2026-02-01",
      last: "2026-02-28",
    });
    expect(months.groups).toEqual([{ first: 0, count: 12, day: "2026-01-01" }]);
    const years = axisOf("years", "2020-01-01", 10, 1, allDay);
    expect(years.columns).toHaveLength(10);
    expect(years.columns[0]).toEqual({
      first: "2020-01-01",
      last: "2020-12-31",
    });
    expect(years.groups).toEqual([]);
  });

  test("a day's column, or none outside them", () => {
    expect(columnOf(weekly, "2026-10-20")).toBe(3);
    expect(columnOf(october, "2026-10-31")).toBe(30);
    expect(columnOf(hourly, "2026-10-15")).toBe(10);
    expect(columnOf(october, "2026-11-01")).toBe(-1);
  });
});

describe("positions", () => {
  test("are in columns, part way into one by the time of day", () => {
    expect(positionOf(october, "2026-10-14", 12 * 60)).toEqual({
      at: 13.5,
      clipped: false,
    });
    expect(positionOf(weekly, "2026-10-15", 0).at).toBeCloseTo(2 + 3 / 7);
    expect(positionOf(months, "2026-02-15", 0).at).toBe(1.5);
    expect(positionOf(hourly, "2026-10-14", 9 * 60 + 30).at).toBe(1.5);
    expect(positionOf(hourly, "2026-10-15", 8 * 60).at).toBe(10);
  });

  test("are moved to the edge, and say so, outside the days and the hours", () => {
    expect(positionOf(october, "2026-09-30", 600)).toEqual({
      at: 0,
      clipped: true,
    });
    expect(positionOf(october, "2026-11-01", 0)).toEqual({
      at: 31,
      clipped: true,
    });
    expect(positionOf(hourly, "2026-10-14", 7 * 60)).toEqual({
      at: 0,
      clipped: true,
    });
    expect(positionOf(hourly, "2026-10-14", 19 * 60)).toEqual({
      at: 10,
      clipped: true,
    });
  });

  test("an end at midnight is the end of the day before", () => {
    expect(endPositionOf(october, "2026-10-15", 0).at).toBe(14);
  });
});

describe("the spot in a column", () => {
  test("is a minute on the hours scale", () => {
    expect(spotIn(hourly, 1, 0.5)).toEqual({ day: "2026-10-14", minute: 570 });
  });

  test("is a day of a week, and the last at the far edge", () => {
    expect(spotIn(weekly, 2, 0.5)).toEqual({ day: "2026-10-15", minute: null });
    expect(spotIn(weekly, 2, 1)).toEqual({ day: "2026-10-18", minute: null });
    expect(spotIn(weekly, 40, 0.5)).toBeNull();
  });
});

const resources: CalendarResource[] = [
  {
    id: "north",
    title: "North depot",
    children: [
      { id: "van-1", title: "Van 1" },
      { id: "van-2", title: "Van 2" },
    ],
  },
  { id: "van-3", title: "Van 3" },
];

describe("rows", () => {
  test("are each resource, followed by those inside it", () => {
    expect(
      rowsOf(resources, new Set()).map((row) => [
        row.id,
        row.depth,
        row.parent,
      ]),
    ).toEqual([
      ["north", 0, true],
      ["van-1", 1, false],
      ["van-2", 1, false],
      ["van-3", 0, false],
    ]);
  });

  test("leave out those inside a folded one", () => {
    expect(rowsOf(resources, new Set(["north"])).map((row) => row.id)).toEqual([
      "north",
      "van-3",
    ]);
  });

  test("hold an event in each of its resources' rows, and one with none in the row for none", () => {
    const rows: TimelineRow[] = [
      ...rowsOf(resources, new Set(["north"])),
      { id: null, resource: null, depth: 0, parent: false },
    ];
    const index = indexResources(resources);
    const event = (id: string, resourceIds?: string[]) =>
      place(
        {
          id,
          title: id,
          start: "2026-10-14",
          end: "2026-10-14",
          allDay: true,
          ...(resourceIds ? { resourceIds } : null),
        },
        "UTC",
      );
    const byRow = eventsByRow(
      [
        event("both", ["north", "van-3"]),
        event("none"),
        event("unknown", ["gone"]),
        event("folded", ["van-1"]),
      ],
      rows,
      index,
    );
    const ids = (row: string) =>
      (byRow.get(row) ?? []).map((item) => item.event.id);
    expect(ids("north")).toEqual(["both"]);
    expect(ids("van-3")).toEqual(["both"]);
    expect(ids("")).toEqual(["none", "unknown"]);
    expect(ids("van-1")).toEqual([]);
  });
});

describe("bars", () => {
  const placed = (event: Omit<CalendarEvent, "title">) =>
    place({ title: event.id, ...event }, "UTC");

  test("are in the first lane free, a short one as long as the shortest", () => {
    const { bars, lanes } = barsOf(
      october,
      [
        placed({
          id: "a",
          start: "2026-10-14",
          end: "2026-10-15",
          allDay: true,
        }),
        placed({ id: "b", start: "2026-10-14T12:00", end: "2026-10-16T00:00" }),
        placed({ id: "c", start: "2026-10-20T10:00", end: "2026-10-20T10:00" }),
        placed({
          id: "d",
          start: "2026-09-28",
          end: "2026-10-02",
          allDay: true,
        }),
        placed({
          id: "e",
          start: "2026-11-05",
          end: "2026-11-05",
          allDay: true,
        }),
      ],
      "UTC",
      0.5,
    );
    expect(lanes).toBe(2);
    expect(
      Object.fromEntries(
        bars.map((bar) => [
          bar.placed.event.id,
          [bar.start, bar.length, bar.lane, bar.startsBefore, bar.endsAfter],
        ]),
      ),
    ).toEqual({
      d: [0, 2, 0, true, false],
      a: [13, 2, 0, false, false],
      b: [13.5, 1.5, 1, false, false],
      c: [19 + 10 / 24, 0.5, 0, false, false],
    });
  });

  test("are cut at the hours shown, and left out when wholly outside them", () => {
    const { bars } = barsOf(
      hourly,
      [
        placed({
          id: "late",
          start: "2026-10-14T17:00",
          end: "2026-10-14T19:00",
        }),
        placed({
          id: "night",
          start: "2026-10-14T20:00",
          end: "2026-10-14T22:00",
        }),
        placed({
          id: "day",
          start: "2026-10-15",
          end: "2026-10-15",
          allDay: true,
        }),
      ],
      "UTC",
      0,
    );
    expect(
      bars.map((bar) => [
        bar.placed.event.id,
        bar.start,
        bar.length,
        bar.startsBefore,
        bar.endsAfter,
      ]),
    ).toEqual([
      ["late", 9, 1, false, true],
      // A whole day is the hours shown of it, and isn't cut by them.
      ["day", 10, 10, false, false],
    ]);
  });
});
