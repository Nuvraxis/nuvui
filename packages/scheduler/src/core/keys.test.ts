import { describe, expect, test } from "vitest";
import { withTimes } from "./edit";
import { applyChange } from "./events";
import {
  type EventKeys,
  readEvent,
  readResources,
  writeChange,
  writeEvent,
} from "./keys";

const keys: EventKeys = {
  id: "bookingId",
  title: "subject",
  start: "from",
  end: "to",
  resourceIds: "roomCode",
  description: "notes",
};

// The fields an event has, without what the calendar carries along out of
// sight.
const fields = (event: object) => Object.fromEntries(Object.entries(event));

const booking = {
  bookingId: "b-1",
  subject: "Interviews",
  from: "2026-10-14T13:00",
  to: "2026-10-14T15:00",
  roomCode: "2A",
  bookedBy: "Wren Halloway",
};

describe("reading an app's events", () => {
  test("its fields are read under the calendar's names", () => {
    expect(fields(readEvent(booking, keys))).toEqual({
      id: "b-1",
      title: "Interviews",
      start: "2026-10-14T13:00",
      end: "2026-10-14T15:00",
      resourceIds: ["2A"],
    });
  });

  test("a name it isn't given is read as the calendar's own", () => {
    expect(readEvent({ ...booking, color: "3" }, keys).color).toBe("3");
  });

  test("the same object reads as the same event", () => {
    expect(readEvent(booking, keys)).toBe(readEvent(booking, keys));
  });
});

describe("writing them back", () => {
  test("an event that hasn't changed goes back as the same object", () => {
    expect(writeEvent(readEvent(booking, keys), keys)).toBe(booking);
  });

  test("a change is written under the app's names, with the rest kept", () => {
    const read = readEvent(booking, keys);
    const moved = withTimes(
      { ...read, title: "Second interviews" },
      {
        allDay: false,
        start: new Date("2026-10-14T14:00:00Z"),
        end: new Date("2026-10-14T16:00:00Z"),
      },
      "UTC",
    );
    expect(writeEvent(moved, keys)).toEqual({
      bookingId: "b-1",
      subject: "Second interviews",
      from: "2026-10-14T14:00",
      to: "2026-10-14T16:00",
      roomCode: "2A",
      bookedBy: "Wren Halloway",
    });
  });

  test("one id stays one id, and several become a list", () => {
    const read = readEvent(booking, keys);
    expect(writeEvent({ ...read, resourceIds: ["4B"] }, keys).roomCode).toBe(
      "4B",
    );
    expect(
      writeEvent({ ...read, resourceIds: ["4B", "2A"] }, keys).roomCode,
    ).toEqual(["4B", "2A"]);
    expect(writeEvent({ ...read, resourceIds: [] }, keys)).not.toHaveProperty(
      "roomCode",
    );
  });

  test("a field taken off the event is taken off the object", () => {
    const read = readEvent({ ...booking, notes: "Two candidates" }, keys);
    const { description: _, ...rest } = read;
    expect(writeEvent(rest, keys)).not.toHaveProperty("notes");
  });

  test("a new event is written under the app's names", () => {
    const made = {
      id: "new",
      title: "Reading group",
      start: "2026-10-15T12:30",
      end: "2026-10-15T13:30",
      resourceIds: ["LIB"],
    };
    expect(writeEvent(made, keys)).toEqual({
      bookingId: "new",
      subject: "Reading group",
      from: "2026-10-15T12:30",
      to: "2026-10-15T13:30",
      roomCode: ["LIB"],
    });
    expect(writeEvent(made, keys, true).roomCode).toBe("LIB");
  });

  test("fields of the app's own, from its popover fields, are kept", () => {
    const read = readEvent(booking, keys);
    const changed = { ...read, title: "Panel", bookedBy: "Ines Porter" };
    expect(writeEvent(changed, keys)).toMatchObject({
      subject: "Panel",
      bookedBy: "Ines Porter",
    });
  });

  test("a change and the events after it come back as the app's objects", () => {
    const other = { ...booking, bookingId: "b-2", subject: "Lunch" };
    const events = [readEvent(booking, keys), readEvent(other, keys)];
    const change = {
      type: "update" as const,
      event: { ...events[0], title: "Panel" } as (typeof events)[0],
      previous: events[0] as (typeof events)[0],
    };
    const after = applyChange(events, change).map((event) =>
      writeEvent(event, keys),
    );
    expect(after[1]).toBe(other);
    expect(after[0]).toMatchObject({ bookingId: "b-1", subject: "Panel" });
    const written = writeChange(change, keys);
    expect(written.type).toBe("update");
    expect(written.type === "update" && written.previous).toBe(booking);
  });
});

describe("reading an app's resources", () => {
  test("its fields, and those inside it, are read under the calendar's names", () => {
    const rooms = readResources(
      [
        {
          code: "east",
          name: "East wing",
          tint: "2",
          rooms: [{ code: "4B", name: "Room 4B" }],
        },
      ],
      { id: "code", title: "name", color: "tint", children: "rooms" },
    );
    expect(rooms).toEqual([
      {
        id: "east",
        title: "East wing",
        color: "2",
        children: [{ id: "4B", title: "Room 4B" }],
      },
    ]);
  });
});
