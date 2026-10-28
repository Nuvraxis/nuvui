import { describe, expect, test } from "vitest";
import { arrangeDay, packLanes, visibleRuns } from "./layout";

const timed = (name: string, from: number, to: number) => ({
  name,
  startMinute: from * 60,
  endMinute: to * 60,
});

const columns = (
  items: ReturnType<typeof arrangeDay<ReturnType<typeof timed>>>,
) =>
  Object.fromEntries(
    items.map(({ item, column, span, columns: total }) => [
      item.name,
      [column, span, total],
    ]),
  );

describe("events side by side", () => {
  test("one alone takes the whole day", () => {
    expect(columns(arrangeDay([timed("a", 9, 10)]))).toEqual({ a: [0, 1, 1] });
  });

  test("two that overlap take a column each", () => {
    expect(
      columns(arrangeDay([timed("a", 9, 11), timed("b", 10, 12)])),
    ).toEqual({ a: [0, 1, 2], b: [1, 1, 2] });
  });

  test("one after another share a column", () => {
    expect(
      columns(arrangeDay([timed("a", 9, 10), timed("b", 10, 11)])),
    ).toEqual({ a: [0, 1, 1], b: [0, 1, 1] });
  });

  test("an event widens into the columns that stay free beside it", () => {
    // a covers the morning. b and c overlap it one after the other, and d
    // overlaps b only. c has the third column free beside it.
    expect(
      columns(
        arrangeDay([
          timed("a", 9, 13),
          timed("b", 9, 10),
          timed("c", 11, 12),
          timed("d", 9.5, 10.5),
        ]),
      ),
    ).toEqual({
      a: [0, 1, 3],
      b: [1, 1, 3],
      d: [2, 1, 3],
      c: [1, 2, 3],
    });
  });

  test("groups that don't touch are laid out on their own", () => {
    const result = columns(
      arrangeDay([timed("a", 9, 10), timed("b", 9, 10), timed("c", 14, 15)]),
    );
    expect(result.c).toEqual([0, 1, 1]);
  });

  test("a very short event is laid out as if it lasted the minimum", () => {
    const result = columns(
      arrangeDay([
        { name: "a", startMinute: 600, endMinute: 605 },
        { name: "b", startMinute: 610, endMinute: 640 },
      ]),
    );
    expect(result).toEqual({ a: [0, 1, 2], b: [1, 1, 2] });
  });
});

describe("bars across days", () => {
  test("each takes the first lane free for all its days", () => {
    const laned = packLanes([
      { item: "a", first: 0, last: 2 },
      { item: "b", first: 1, last: 1 },
      { item: "c", first: 3, last: 4 },
      { item: "d", first: 2, last: 3 },
    ]);
    expect(laned.map(({ item, lane }) => [item, lane])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 0],
      ["d", 1],
    ]);
  });

  test("a bar is cut where a day has no room for its lane", () => {
    // Room for two lanes on the first and last day, one in the middle.
    expect(visibleRuns({ lane: 1, first: 0, last: 2 }, [2, 1, 2])).toEqual([
      { first: 0, last: 0 },
      { first: 2, last: 2 },
    ]);
    expect(visibleRuns({ lane: 0, first: 0, last: 2 }, [2, 1, 2])).toEqual([
      { first: 0, last: 2 },
    ]);
    expect(visibleRuns({ lane: 2, first: 0, last: 2 }, [2, 1, 2])).toEqual([]);
  });
});
