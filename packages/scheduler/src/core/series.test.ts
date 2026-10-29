import { describe, expect, test } from "vitest";
import { withTimes } from "./edit";
import type { CalendarEvent } from "./events";
import { expandEvents, type Occurrence, occurrenceOf } from "./recurrence";
import {
  changeOccurrence,
  deleteOccurrence,
  type SeriesOptions,
} from "./series";

// Monday, Wednesday and Friday at half past nine, from Monday 12 October.
const standUp: CalendarEvent = {
  id: "stand-up",
  title: "Stand-up",
  start: "2026-10-12T09:30",
  end: "2026-10-12T09:45",
  recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
};

const options: SeriesOptions = {
  timeZone: "UTC",
  createId: () => "new",
  objectRules: false,
};

/** The occurrence of a series on a day, as the calendar draws it. */
function on(series: CalendarEvent, day: string) {
  const event = expandEvents([series], "UTC", day, day).find(
    (each) => occurrenceOf(each)?.day === day,
  );
  if (!event) throw new Error(`No occurrence on ${day}`);
  return { event, from: occurrenceOf(event) as Occurrence };
}

const at = (event: CalendarEvent, start: string, end: string) =>
  withTimes(
    event,
    {
      allDay: false,
      start: new Date(`${start}:00Z`),
      end: new Date(`${end}:00Z`),
    },
    "UTC",
  );

describe("changing one occurrence", () => {
  test("leaves it out of the series, and makes an event of its own", () => {
    const { event, from } = on(standUp, "2026-10-14");
    const next = at(event, "2026-10-14T10:00", "2026-10-14T10:15");
    const { changes, focus } = changeOccurrence(
      from,
      next,
      "one",
      undefined,
      options,
    );
    expect(changes).toEqual([
      {
        type: "update",
        event: { ...standUp, exceptions: ["2026-10-14"] },
        previous: standUp,
      },
      {
        type: "create",
        event: {
          id: "new",
          title: "Stand-up",
          start: "2026-10-14T10:00",
          end: "2026-10-14T10:15",
        },
      },
    ]);
    expect(focus).toBe("new");
  });
});

describe("changing every occurrence", () => {
  test("gives the series the new time on the clock", () => {
    const { event, from } = on(standUp, "2026-10-14");
    const next = at(event, "2026-10-14T10:00", "2026-10-14T10:15");
    const { changes, focus } = changeOccurrence(
      from,
      next,
      "all",
      undefined,
      options,
    );
    expect(changes).toEqual([
      {
        type: "update",
        event: {
          ...standUp,
          start: "2026-10-12T10:00",
          end: "2026-10-12T10:15",
        },
        previous: standUp,
      },
    ]);
    expect(focus).toBe("stand-up:2026-10-12");
  });

  test("moved a day, moves the days of the week with it", () => {
    const { event, from } = on(standUp, "2026-10-14");
    const next = at(event, "2026-10-15T09:30", "2026-10-15T09:45");
    const [change] = changeOccurrence(
      from,
      next,
      "all",
      undefined,
      options,
    ).changes;
    expect(change?.event).toMatchObject({
      start: "2026-10-13T09:30",
      recurrence: "FREQ=WEEKLY;BYDAY=TU,TH,SA",
    });
  });

  test("with no rule after, it's one event at the new time", () => {
    const { event, from } = on(standUp, "2026-10-14");
    const [change] = changeOccurrence(
      from,
      event,
      "all",
      null,
      options,
    ).changes;
    expect(change?.event).toEqual({
      id: "stand-up",
      title: "Stand-up",
      start: "2026-10-14T09:30",
      end: "2026-10-14T09:45",
    });
  });
});

describe("changing one and those after it", () => {
  test("ends the series the day before, and starts a new one", () => {
    const { event, from } = on(standUp, "2026-10-21");
    const next = at(event, "2026-10-22T10:00", "2026-10-22T10:15");
    const { changes, focus } = changeOccurrence(
      from,
      next,
      "following",
      undefined,
      options,
    );
    expect(changes).toEqual([
      {
        type: "update",
        event: {
          ...standUp,
          recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261020T235959Z",
        },
        previous: standUp,
      },
      {
        type: "create",
        event: {
          id: "new",
          title: "Stand-up",
          start: "2026-10-22T10:00",
          end: "2026-10-22T10:15",
          recurrence: "FREQ=WEEKLY;BYDAY=TU,TH,SA",
        },
      },
    ]);
    expect(focus).toBe("new:2026-10-22");
  });

  test("shares out how many times between the two", () => {
    const counted = {
      ...standUp,
      recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6",
    };
    const { event, from } = on(counted, "2026-10-19");
    const [before, after] = changeOccurrence(
      from,
      { ...event, title: "Stand-up in 4B" },
      "following",
      undefined,
      options,
    ).changes;
    expect(before?.event.recurrence).toBe(
      "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261018T235959Z",
    );
    expect(after?.event).toMatchObject({
      title: "Stand-up in 4B",
      start: "2026-10-19T09:30",
      recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=3",
    });
  });

  test("shares out the days left out", () => {
    const missed = { ...standUp, exceptions: ["2026-10-16", "2026-10-23"] };
    const { event, from } = on(missed, "2026-10-21");
    const [before, after] = changeOccurrence(
      from,
      event,
      "following",
      undefined,
      options,
    ).changes;
    expect(before?.event.exceptions).toEqual(["2026-10-16"]);
    expect(after?.event.exceptions).toEqual(["2026-10-23"]);
  });

  test("from the first, is every occurrence", () => {
    const { event, from } = on(standUp, "2026-10-12");
    const { changes } = changeOccurrence(
      from,
      { ...event, title: "Daily sync" },
      "following",
      undefined,
      options,
    );
    expect(changes).toEqual([
      {
        type: "update",
        event: { ...standUp, title: "Daily sync" },
        previous: standUp,
      },
    ]);
  });

  test("with a rule of its own, the new series takes it", () => {
    const { event, from } = on(standUp, "2026-10-21");
    const [, after] = changeOccurrence(
      from,
      event,
      "following",
      { frequency: "daily", count: 2 },
      options,
    ).changes;
    expect(after?.event.recurrence).toBe("FREQ=DAILY;COUNT=2");
  });
});

describe("deleting an occurrence", () => {
  test("one is left out of the series", () => {
    const { from } = on(standUp, "2026-10-14");
    expect(deleteOccurrence(from, "one", options)).toEqual({
      type: "update",
      event: { ...standUp, exceptions: ["2026-10-14"] },
      previous: standUp,
    });
  });

  test("one and those after it end the series the day before", () => {
    const written = {
      ...standUp,
      recurrence: {
        frequency: "weekly" as const,
        weekdays: ["MO", "WE", "FR"] as const,
      },
    };
    const { from } = on(written, "2026-10-21");
    expect(deleteOccurrence(from, "following", options)).toMatchObject({
      type: "update",
      event: {
        recurrence: {
          frequency: "weekly",
          weekdays: ["MO", "WE", "FR"],
          until: "2026-10-20",
        },
      },
    });
  });

  test("from the first, or every one, deletes the series", () => {
    expect(
      deleteOccurrence(on(standUp, "2026-10-12").from, "following", options),
    ).toEqual({ type: "delete", event: standUp });
    expect(
      deleteOccurrence(on(standUp, "2026-10-21").from, "all", options),
    ).toEqual({ type: "delete", event: standUp });
  });
});
