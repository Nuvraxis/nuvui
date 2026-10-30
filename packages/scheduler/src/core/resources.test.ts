import { describe, expect, test } from "vitest";
import type { CalendarEvent } from "./events";
import {
  type CalendarResource,
  indexResources,
  isShown,
  moveResource,
  rulesOf,
  shownState,
  toggleResource,
} from "./resources";

const resources: CalendarResource[] = [
  {
    id: "rooms",
    title: "Rooms",
    color: "1",
    readOnly: true,
    children: [
      { id: "4b", title: "Room 4B" },
      { id: "library", title: "The library", color: "5", readOnly: false },
    ],
  },
  {
    id: "people",
    title: "People",
    children: [
      { id: "ines", title: "Ines Porter", color: "6", draggable: false },
      { id: "tomas", title: "Tomas Reyna", resizable: "end" },
      { id: "wren", title: "Wren Halloway", resizable: "start" },
    ],
  },
];
const index = indexResources(resources);

const event = (resourceIds?: string[]): CalendarEvent => ({
  id: "event",
  title: "Event",
  start: "2026-10-14T10:00",
  end: "2026-10-14T11:00",
  ...(resourceIds ? { resourceIds } : null),
});

describe("the index of resources", () => {
  test("lists every resource, parents first, in the order given", () => {
    expect([...index.keys()]).toEqual([
      "rooms",
      "4b",
      "library",
      "people",
      "ines",
      "tomas",
      "wren",
    ]);
  });

  test("knows how deep each is and what's inside it", () => {
    expect(index.get("rooms")).toMatchObject({
      depth: 0,
      parents: [],
      descendants: ["4b", "library"],
    });
    expect(index.get("library")).toMatchObject({
      depth: 1,
      parents: ["rooms"],
      descendants: [],
    });
  });

  test("a resource takes what it doesn't say from the one it's in", () => {
    expect(index.get("4b")?.settings).toMatchObject({
      color: "1",
      readOnly: true,
    });
    expect(index.get("library")?.settings).toMatchObject({
      color: "5",
      readOnly: false,
    });
  });
});

describe("what an event may do", () => {
  test("an event with no resources has its own settings", () => {
    expect(rulesOf(event(), index)).toEqual({
      color: undefined,
      readOnly: false,
      draggable: true,
      resizable: true,
    });
  });

  test("an event takes its resource's settings, and its own win", () => {
    expect(rulesOf(event(["4b"]), index)).toMatchObject({
      color: "1",
      readOnly: true,
    });
    expect(
      rulesOf({ ...event(["4b"]), color: "8", readOnly: false }, index),
    ).toMatchObject({ color: "8", readOnly: false });
  });

  test("with several resources, the first color and the holding back win", () => {
    const rules = rulesOf(event(["tomas", "ines", "library"]), index);
    expect(rules.color).toBe("6");
    expect(rules.draggable).toBe(false);
    expect(rules.readOnly).toBe(false);
    expect(rules.resizable).toBe("end");
  });

  test("two resources that each let a different end go let neither", () => {
    expect(rulesOf(event(["tomas", "wren"]), index).resizable).toBe(false);
    expect(rulesOf(event(["tomas", "tomas"]), index).resizable).toBe("end");
  });

  test("ids that aren't among the resources are passed by", () => {
    expect(rulesOf(event(["gone"]), index).color).toBeUndefined();
  });
});

describe("showing and hiding", () => {
  test("an event is shown while one of its resources is", () => {
    const hidden = new Set(["4b"]);
    expect(isShown(event(["4b"]), index, hidden)).toBe(false);
    expect(isShown(event(["4b", "ines"]), index, hidden)).toBe(true);
    expect(isShown(event(), index, hidden)).toBe(true);
    expect(isShown(event(["gone"]), index, hidden)).toBe(true);
  });

  test("a group hides and shows with everything in it", () => {
    expect(toggleResource("rooms", index, [])).toEqual([
      "rooms",
      "4b",
      "library",
    ]);
    expect(toggleResource("rooms", index, ["4b", "ines"])).toEqual(["ines"]);
    expect(toggleResource("4b", index, [])).toEqual(["4b"]);
    expect(toggleResource("4b", index, ["4b"])).toEqual([]);
  });

  test("a group is shown, hidden, or some of each", () => {
    expect(shownState("rooms", index, new Set())).toBe(true);
    expect(shownState("rooms", index, new Set(["4b"]))).toBe("indeterminate");
    expect(
      shownState("rooms", index, new Set(["rooms", "4b", "library"])),
    ).toBe(false);
    expect(shownState("4b", index, new Set(["4b"]))).toBe(false);
  });
});

describe("moving an event to another row", () => {
  test("swaps the row it left for the one it's put on, where it was", () => {
    expect(moveResource(["4b", "ines"], "4b", "library")).toEqual([
      "library",
      "ines",
    ]);
  });

  test("onto a row it's already in, it leaves the one it came from", () => {
    expect(moveResource(["4b", "ines"], "4b", "ines")).toEqual(["ines"]);
  });

  test("from the row for none, it's given the row, and keeps ids it had", () => {
    expect(moveResource(undefined, null, "4b")).toEqual(["4b"]);
    expect(moveResource(["gone"], null, "4b")).toEqual(["gone", "4b"]);
  });

  test("onto the row for none, it loses the row it left", () => {
    expect(moveResource(["4b"], "4b", null)).toEqual([]);
    expect(moveResource(["4b", "ines"], "4b", null)).toEqual(["ines"]);
  });

  test("to the same row, nothing changes", () => {
    expect(moveResource(["4b"], "4b", "4b")).toEqual(["4b"]);
  });
});
