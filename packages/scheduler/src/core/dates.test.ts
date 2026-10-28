import { describe, expect, test } from "vitest";
import {
  addDays,
  addMonths,
  dayOf,
  daysBetween,
  daysFrom,
  endOfMonth,
  isWeekend,
  minutesOf,
  momentOf,
  startOfWeek,
  toDay,
  toMoment,
  weekdayOf,
} from "./dates";

describe("days", () => {
  test("add and count across months, years and a leap day", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-25", "2026-11-01")).toBe(7);
  });

  test("don't move across a change to summer time, which has no day of its own", () => {
    // Europe changed on 29 March 2026, and America on 8 March.
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });

  test("a month later is the same date, or the last day of a shorter month", () => {
    expect(addMonths("2026-10-14", 1)).toBe("2026-11-14");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });

  test("a week starts on the day asked for", () => {
    // 28 October 2026 is a Wednesday.
    expect(weekdayOf("2026-10-28")).toBe(3);
    expect(startOfWeek("2026-10-28", 0)).toBe("2026-10-25");
    expect(startOfWeek("2026-10-28", 1)).toBe("2026-10-26");
    expect(startOfWeek("2026-10-25", 1)).toBe("2026-10-19");
    expect(startOfWeek("2026-10-28", 6)).toBe("2026-10-24");
  });

  test("weekends are Saturday and Sunday", () => {
    expect(daysFrom("2026-10-23", "2026-10-26").map(isWeekend)).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });
});

describe("moments", () => {
  test("a string with Z or an offset is the same moment anywhere", () => {
    expect(toMoment("2026-10-14T08:00:00Z", "Asia/Tokyo").toISOString()).toBe(
      "2026-10-14T08:00:00.000Z",
    );
    expect(
      toMoment("2026-10-14T10:00:00+02:00", "America/Lima").toISOString(),
    ).toBe("2026-10-14T08:00:00.000Z");
  });

  test("a string without one is on the clock in the time zone given", () => {
    expect(toMoment("2026-10-14T09:00", "Europe/Paris").toISOString()).toBe(
      "2026-10-14T07:00:00.000Z",
    );
    expect(toMoment("2026-10-14T09:00", "America/New_York").toISOString()).toBe(
      "2026-10-14T13:00:00.000Z",
    );
  });

  test("nine on the clock stays nine on either side of a change to winter time", () => {
    // Europe goes back an hour on 25 October 2026.
    const before = toMoment("2026-10-24T09:00", "Europe/Berlin");
    const after = toMoment("2026-10-26T09:00", "Europe/Berlin");
    expect(minutesOf(before, "Europe/Berlin")).toBe(9 * 60);
    expect(minutesOf(after, "Europe/Berlin")).toBe(9 * 60);
    expect(after.getTime() - before.getTime()).toBe(49 * 3_600_000);
  });

  test("the day a moment falls on depends on where it's read", () => {
    const moment = new Date("2026-10-14T23:30:00Z");
    expect(dayOf(moment, "UTC")).toBe("2026-10-14");
    expect(dayOf(moment, "Asia/Tokyo")).toBe("2026-10-15");
    expect(dayOf(moment, "America/Los_Angeles")).toBe("2026-10-14");
  });

  test("a day and some minutes make a moment in a time zone", () => {
    expect(momentOf("2026-10-14", 90, "Europe/London").toISOString()).toBe(
      "2026-10-14T00:30:00.000Z",
    );
  });

  test("an all-day date written as a string is that date everywhere", () => {
    expect(toDay("2026-10-14", "Pacific/Kiritimati")).toBe("2026-10-14");
    expect(toDay("2026-10-14", "Pacific/Pago_Pago")).toBe("2026-10-14");
    expect(toDay(new Date("2026-10-14T23:30:00Z"), "Asia/Tokyo")).toBe(
      "2026-10-15",
    );
  });
});
