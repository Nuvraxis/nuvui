import { describe, expect, test } from "vitest";
import {
  canDrag,
  dragTo,
  type EditOptions,
  nudge,
  sameTimes,
  shiftClock,
  timesAt,
  wallOf,
  withTimes,
} from "./edit";
import { type CalendarEvent, place } from "./events";

const options: EditOptions = {
  step: 15,
  defaultDuration: 60,
  timeZone: "UTC",
};

const meeting: CalendarEvent = {
  id: "meeting",
  title: "Meeting",
  start: "2026-10-14T10:00",
  end: "2026-10-14T11:00",
};
const offsite: CalendarEvent = {
  id: "offsite",
  title: "Offsite",
  start: "2026-10-15",
  end: "2026-10-16",
  allDay: true,
};

const iso = (date: Date) => date.toISOString().slice(0, 16);

describe("moving by the clock", () => {
  test("a moment moves by minutes on the clock", () => {
    const moved = shiftClock(new Date("2026-10-14T23:30:00Z"), 45, "UTC");
    expect(iso(moved)).toBe("2026-10-15T00:15");
  });

  test("nine o'clock a day later is nine o'clock across a change to winter time", () => {
    // Clocks in Paris go back on 25 October 2026.
    const nine = new Date("2026-10-24T07:00:00Z");
    const moved = shiftClock(nine, 24 * 60, "Europe/Paris");
    expect(wallOf(moved, "Europe/Paris")).toBe("2026-10-25T09:00");
    expect(moved.getTime() - nine.getTime()).toBe(25 * 3_600_000);
  });
});

describe("dragging", () => {
  const placed = place(meeting, "UTC");

  test("a move keeps the event's length, snapped to the step", () => {
    const times = dragTo(
      "move",
      placed,
      { day: "2026-10-14", minute: 10 * 60 + 20 },
      { day: "2026-10-15", minute: 13 * 60 + 27 },
      options,
    );
    expect(times.allDay).toBe(false);
    if (times.allDay) return;
    // Three hours and seven minutes later, to the nearest quarter hour.
    expect(iso(times.start)).toBe("2026-10-15T13:00");
    expect(iso(times.end)).toBe("2026-10-15T14:00");
  });

  test("onto the all-day row, a timed event takes that day", () => {
    const times = dragTo(
      "move",
      placed,
      { day: "2026-10-14", minute: 600 },
      { day: "2026-10-16", minute: null },
      options,
    );
    expect(times).toEqual({
      allDay: true,
      firstDay: "2026-10-16",
      lastDay: "2026-10-16",
    });
  });

  test("onto a time, an all-day event lasts the default length", () => {
    const times = dragTo(
      "move",
      place(offsite, "UTC"),
      { day: "2026-10-15", minute: null },
      { day: "2026-10-15", minute: 9 * 60 + 40 },
      options,
    );
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-15T09:30");
    expect(iso(times.end)).toBe("2026-10-15T10:30");
  });

  test("an all-day event moves by days, keeping how many it covers", () => {
    expect(
      dragTo(
        "move",
        place(offsite, "UTC"),
        { day: "2026-10-15", minute: null },
        { day: "2026-10-19", minute: null },
        options,
      ),
    ).toEqual({ allDay: true, firstDay: "2026-10-19", lastDay: "2026-10-20" });
  });

  test("its end is dragged later, and never before its start and a step", () => {
    const later = dragTo(
      "end",
      placed,
      { day: "2026-10-14", minute: 660 },
      { day: "2026-10-14", minute: 12 * 60 + 50 },
      options,
    );
    if (later.allDay) throw new Error("Expected a timed event");
    expect(iso(later.end)).toBe("2026-10-14T12:45");
    const before = dragTo(
      "end",
      placed,
      { day: "2026-10-14", minute: 660 },
      { day: "2026-10-14", minute: 8 * 60 },
      options,
    );
    if (before.allDay) throw new Error("Expected a timed event");
    expect(iso(before.end)).toBe("2026-10-14T10:15");
  });

  test("its start is dragged earlier", () => {
    const times = dragTo(
      "start",
      placed,
      { day: "2026-10-14", minute: 600 },
      { day: "2026-10-14", minute: 8 * 60 + 5 },
      options,
    );
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-14T08:00");
    expect(iso(times.end)).toBe("2026-10-14T11:00");
  });

  test("a bar's end is dragged by days, and not before its first", () => {
    const times = dragTo(
      "end",
      place(offsite, "UTC"),
      { day: "2026-10-16", minute: null },
      { day: "2026-10-12", minute: null },
      options,
    );
    expect(times).toEqual({
      allDay: true,
      firstDay: "2026-10-15",
      lastDay: "2026-10-15",
    });
  });

  test("dragging on empty time makes an event from one spot to the other", () => {
    const times = dragTo(
      "create",
      null,
      { day: "2026-10-14", minute: 14 * 60 + 40 },
      { day: "2026-10-14", minute: 13 * 60 + 10 },
      options,
    );
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-14T13:00");
    expect(iso(times.end)).toBe("2026-10-14T14:45");
  });

  test("dragging across whole days makes an all-day event", () => {
    expect(
      dragTo(
        "create",
        null,
        { day: "2026-10-16", minute: null },
        { day: "2026-10-14", minute: null },
        options,
      ),
    ).toEqual({ allDay: true, firstDay: "2026-10-14", lastDay: "2026-10-16" });
  });
});

describe("from the keyboard", () => {
  const placed = place(meeting, "UTC");

  test("a step later", () => {
    const times = nudge(placed, { minutes: 15 }, false, options);
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-14T10:15");
    expect(iso(times.end)).toBe("2026-10-14T11:15");
  });

  test("a day on", () => {
    const times = nudge(placed, { days: 1 }, false, options);
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-15T10:00");
  });

  test("with Shift, only the end moves, and not past the start", () => {
    const times = nudge(placed, { minutes: -120 }, true, options);
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-14T10:00");
    expect(iso(times.end)).toBe("2026-10-14T10:15");
  });

  test("an all-day event moves by days, and takes no minutes", () => {
    expect(
      nudge(place(offsite, "UTC"), { minutes: 15 }, false, options),
    ).toEqual({ allDay: true, firstDay: "2026-10-15", lastDay: "2026-10-16" });
    expect(nudge(place(offsite, "UTC"), { days: 7 }, true, options)).toEqual({
      allDay: true,
      firstDay: "2026-10-15",
      lastDay: "2026-10-23",
    });
  });
});

describe("writing the event back", () => {
  test("a clock time stays a clock time, on the event's own clock", () => {
    const event = { ...meeting, timeZone: "America/New_York" };
    const times = {
      allDay: false as const,
      start: new Date("2026-10-14T18:00:00Z"),
      end: new Date("2026-10-14T19:30:00Z"),
    };
    expect(withTimes(event, times, "UTC")).toMatchObject({
      start: "2026-10-14T14:00",
      end: "2026-10-14T15:30",
    });
  });

  test("a Date stays a Date, and a string with a zone stays one", () => {
    const start = new Date("2026-10-14T09:00:00Z");
    const end = new Date("2026-10-14T10:00:00Z");
    const dated = withTimes(
      { ...meeting, start: new Date(0), end: "2026-10-14T11:00:00Z" },
      { allDay: false, start, end },
      "UTC",
    );
    expect(dated.start).toBeInstanceOf(Date);
    expect(dated.end).toBe("2026-10-14T10:00:00.000Z");
  });

  test("whole days are written as days, and a timed event loses allDay", () => {
    expect(
      withTimes(
        meeting,
        { allDay: true, firstDay: "2026-10-20", lastDay: "2026-10-21" },
        "UTC",
      ),
    ).toMatchObject({ allDay: true, start: "2026-10-20", end: "2026-10-21" });
    const timed = withTimes(
      offsite,
      {
        allDay: false,
        start: new Date("2026-10-15T09:00:00Z"),
        end: new Date("2026-10-15T10:00:00Z"),
      },
      "UTC",
    );
    expect(timed.allDay).toBeUndefined();
    expect(timed.start).toBe("2026-10-15T09:00");
  });
});

describe("made at a spot", () => {
  test("a time is snapped down to the step, for the length given", () => {
    const times = timesAt(
      { day: "2026-10-14", minute: 9 * 60 + 50 },
      30,
      options,
    );
    if (times.allDay) throw new Error("Expected a timed event");
    expect(iso(times.start)).toBe("2026-10-14T09:45");
    expect(iso(times.end)).toBe("2026-10-14T10:15");
  });

  test("a whole day, or anything that asks for one, is all day", () => {
    const day = { allDay: true, firstDay: "2026-10-14", lastDay: "2026-10-14" };
    expect(timesAt({ day: "2026-10-14", minute: null }, 30, options)).toEqual(
      day,
    );
    expect(
      timesAt({ day: "2026-10-14", minute: 600 }, 30, options, true),
    ).toEqual(day);
  });

  test("times are compared by when they are", () => {
    const a = place(meeting, "UTC");
    const b = place(
      { ...meeting, start: new Date("2026-10-14T10:00:00Z") },
      "UTC",
    );
    expect(
      sameTimes(
        { allDay: false, start: a.start, end: a.end },
        { allDay: false, start: b.start, end: b.end },
      ),
    ).toBe(true);
  });
});

describe("what can be dragged", () => {
  test("the closest setting wins", () => {
    expect(canDrag(meeting, true, "move")).toBe(true);
    expect(canDrag(meeting, false, "move")).toBe(false);
    expect(canDrag({ ...meeting, readOnly: true }, true, "end")).toBe(false);
    expect(canDrag({ ...meeting, draggable: false }, true, "move")).toBe(false);
    expect(canDrag({ ...meeting, draggable: false }, true, "end")).toBe(true);
    expect(canDrag({ ...meeting, resizable: "end" }, true, "start")).toBe(
      false,
    );
    expect(canDrag({ ...meeting, resizable: "end" }, true, "end")).toBe(true);
  });
});
