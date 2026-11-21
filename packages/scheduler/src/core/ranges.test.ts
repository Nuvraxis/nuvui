import { describe, expect, test } from "vitest";
import { mergeRanges, missingRanges, overlaps } from "./ranges";

describe("mergeRanges", () => {
  test("ranges that overlap or touch become one, in order", () => {
    expect(
      mergeRanges([
        { from: "2026-10-18", to: "2026-10-24" },
        { from: "2026-10-01", to: "2026-10-10" },
        { from: "2026-10-11", to: "2026-10-17" },
        { from: "2026-11-02", to: "2026-11-03" },
      ]),
    ).toEqual([
      { from: "2026-10-01", to: "2026-10-24" },
      { from: "2026-11-02", to: "2026-11-03" },
    ]);
  });

  test("one inside another is taken in, and an empty one is left out", () => {
    expect(
      mergeRanges([
        { from: "2026-10-01", to: "2026-10-31" },
        { from: "2026-10-10", to: "2026-10-12" },
        { from: "2026-12-05", to: "2026-12-01" },
      ]),
    ).toEqual([{ from: "2026-10-01", to: "2026-10-31" }]);
  });

  test("across the end of a month and a year", () => {
    expect(
      mergeRanges([
        { from: "2026-12-20", to: "2026-12-31" },
        { from: "2027-01-01", to: "2027-01-09" },
      ]),
    ).toEqual([{ from: "2026-12-20", to: "2027-01-09" }]);
  });
});

describe("missingRanges", () => {
  const month = { from: "2026-09-27", to: "2026-10-31" };

  test("with nothing loaded, all of it", () => {
    expect(missingRanges(month, [])).toEqual([month]);
  });

  test("the days on each side of a week that's loaded", () => {
    expect(
      missingRanges(month, [{ from: "2026-10-11", to: "2026-10-17" }]),
    ).toEqual([
      { from: "2026-09-27", to: "2026-10-10" },
      { from: "2026-10-18", to: "2026-10-31" },
    ]);
  });

  test("nothing, when it's all loaded", () => {
    expect(
      missingRanges({ from: "2026-10-11", to: "2026-10-17" }, [
        { from: "2026-10-01", to: "2026-10-12" },
        { from: "2026-10-13", to: "2026-10-31" },
      ]),
    ).toEqual([]);
  });

  test("the gaps between ranges loaded, and what's left at the end", () => {
    expect(
      missingRanges(month, [
        { from: "2026-09-01", to: "2026-09-30" },
        { from: "2026-10-05", to: "2026-10-06" },
        { from: "2026-10-20", to: "2026-10-25" },
      ]),
    ).toEqual([
      { from: "2026-10-01", to: "2026-10-04" },
      { from: "2026-10-07", to: "2026-10-19" },
      { from: "2026-10-26", to: "2026-10-31" },
    ]);
  });

  test("ranges loaded outside it change nothing", () => {
    expect(
      missingRanges({ from: "2026-10-11", to: "2026-10-17" }, [
        { from: "2026-01-01", to: "2026-01-31" },
        { from: "2027-01-01", to: "2027-01-31" },
      ]),
    ).toEqual([{ from: "2026-10-11", to: "2026-10-17" }]);
  });
});

describe("overlaps", () => {
  test("a shared day is enough, and the next day isn't", () => {
    const week = { from: "2026-10-11", to: "2026-10-17" };
    expect(overlaps(week, { from: "2026-10-17", to: "2026-10-20" })).toBe(true);
    expect(overlaps(week, { from: "2026-10-18", to: "2026-10-20" })).toBe(
      false,
    );
  });
});
