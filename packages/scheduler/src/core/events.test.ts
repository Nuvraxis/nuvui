import { describe, expect, test } from "vitest";
import {
  type CalendarEvent,
  eventsOn,
  placeEvents,
  segmentsOn,
} from "./events";

const event = (
  id: string,
  start: string,
  end: string,
  extra: Partial<CalendarEvent> = {},
): CalendarEvent => ({ id, title: id, start, end, ...extra });

describe("placing events", () => {
  test("only those that touch the days asked for", () => {
    const placed = placeEvents(
      [
        event("before", "2026-10-11T09:00", "2026-10-11T10:00"),
        event("in", "2026-10-14T09:00", "2026-10-14T10:00"),
        event("across", "2026-10-10", "2026-10-12", { allDay: true }),
        event("after", "2026-10-19T09:00", "2026-10-19T10:00"),
      ],
      "UTC",
      "2026-10-12",
      "2026-10-18",
    );
    expect(placed.map((item) => item.event.id)).toEqual(["across", "in"]);
  });

  test("an all-day event covers its first and last day", () => {
    const [offsite] = placeEvents(
      [event("offsite", "2026-10-15", "2026-10-16", { allDay: true })],
      "Asia/Tokyo",
      "2026-10-01",
      "2026-10-31",
    );
    expect(offsite).toMatchObject({
      firstDay: "2026-10-15",
      lastDay: "2026-10-16",
      allDay: true,
      spansDays: true,
    });
  });

  test("a timed event that ends at midnight ends on the day before", () => {
    const [late] = placeEvents(
      [event("late", "2026-10-14T20:00", "2026-10-15T00:00")],
      "UTC",
      "2026-10-01",
      "2026-10-31",
    );
    expect(late).toMatchObject({
      firstDay: "2026-10-14",
      lastDay: "2026-10-14",
      spansDays: false,
    });
  });

  test("a timed event a day long or longer is drawn across days", () => {
    const [long] = placeEvents(
      [event("long", "2026-10-14T09:00", "2026-10-15T09:00")],
      "UTC",
      "2026-10-01",
      "2026-10-31",
    );
    expect(long?.spansDays).toBe(true);
  });

  test("an event's own time zone says where its clock times are", () => {
    const [call] = placeEvents(
      [
        event("call", "2026-10-14T09:00", "2026-10-14T10:00", {
          timeZone: "Europe/London",
        }),
      ],
      "Asia/Tokyo",
      "2026-10-01",
      "2026-10-31",
    );
    // Nine in London is five in the afternoon in Tokyo.
    expect(segmentsOn(call ? [call] : [], "2026-10-14", "Asia/Tokyo")).toEqual([
      expect.objectContaining({ startMinute: 17 * 60, endMinute: 18 * 60 }),
    ]);
  });

  test("an end before the start is taken as the start", () => {
    const [backwards] = placeEvents(
      [event("backwards", "2026-10-14T10:00", "2026-10-14T09:00")],
      "UTC",
      "2026-10-01",
      "2026-10-31",
    );
    expect(backwards?.end.getTime()).toBe(backwards?.start.getTime());
  });

  test("all-day events come first on their day, then by start, the longer first", () => {
    const placed = placeEvents(
      [
        event("short", "2026-10-14T09:00", "2026-10-14T09:30"),
        event("later", "2026-10-14T11:00", "2026-10-14T12:00"),
        event("long", "2026-10-14T09:00", "2026-10-14T11:00"),
        event("day", "2026-10-14", "2026-10-14", { allDay: true }),
      ],
      "UTC",
      "2026-10-14",
      "2026-10-14",
    );
    expect(placed.map((item) => item.event.id)).toEqual([
      "day",
      "long",
      "short",
      "later",
    ]);
  });
});

describe("a day's part of an event", () => {
  test("is cut at midnight on each day it crosses", () => {
    const placed = placeEvents(
      [event("night", "2026-10-14T22:00", "2026-10-15T02:00")],
      "UTC",
      "2026-10-14",
      "2026-10-15",
    );
    expect(segmentsOn(placed, "2026-10-14", "UTC")).toEqual([
      expect.objectContaining({
        startMinute: 22 * 60,
        endMinute: 24 * 60,
        startsBefore: false,
        endsAfter: true,
      }),
    ]);
    expect(segmentsOn(placed, "2026-10-15", "UTC")).toEqual([
      expect.objectContaining({
        startMinute: 0,
        endMinute: 2 * 60,
        startsBefore: true,
        endsAfter: false,
      }),
    ]);
  });

  test("an event that ends at midnight runs to the end of its day", () => {
    const placed = placeEvents(
      [event("late", "2026-10-14T20:00", "2026-10-15T00:00")],
      "UTC",
      "2026-10-14",
      "2026-10-15",
    );
    expect(segmentsOn(placed, "2026-10-14", "UTC")[0]?.endMinute).toBe(24 * 60);
    expect(segmentsOn(placed, "2026-10-15", "UTC")).toEqual([]);
  });

  test("leaves out events drawn across days", () => {
    const placed = placeEvents(
      [event("day", "2026-10-14", "2026-10-14", { allDay: true })],
      "UTC",
      "2026-10-14",
      "2026-10-14",
    );
    expect(segmentsOn(placed, "2026-10-14", "UTC")).toEqual([]);
    expect(eventsOn(placed, "2026-10-14")).toHaveLength(1);
  });

  test("a list of a day puts what takes the day before what was carried over", () => {
    const placed = placeEvents(
      [
        event("night", "2026-10-13T22:00", "2026-10-14T02:00"),
        event("day", "2026-10-14", "2026-10-14", { allDay: true }),
      ],
      "UTC",
      "2026-10-13",
      "2026-10-14",
    );
    expect(eventsOn(placed, "2026-10-14").map((item) => item.event.id)).toEqual(
      ["day", "night"],
    );
  });
});
