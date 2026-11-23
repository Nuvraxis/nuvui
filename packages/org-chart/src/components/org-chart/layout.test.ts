import { describe, expect, test } from "vitest";
import {
  buildHierarchy,
  gaps,
  type Layout,
  type LayoutOptions,
  layoutChart,
  managersOf,
  type Rect,
} from "./layout";
import type { OrgChartPerson } from "./types";

// A head with two managers under them, one with two reports and one with
// one, and a third person who manages no one.
const people: OrgChartPerson[] = [
  { id: "ceo", name: "Ada Head" },
  { id: "ops", managerId: "ceo", name: "Bo Ops" },
  { id: "eng", managerId: "ceo", name: "Cy Eng" },
  { id: "pa", managerId: "ceo", name: "Di Assistant" },
  { id: "o1", managerId: "ops", name: "Ed One" },
  { id: "o2", managerId: "ops", name: "Fi Two" },
  { id: "e1", managerId: "eng", name: "Gus Three" },
];

const card = { width: 200, height: 60 };
const options: LayoutOptions = {
  orientation: "vertical",
  card,
  rtl: false,
  stack: false,
};
const everyone = new Set(["ceo", "ops", "eng"]);

const middle = (rect: Rect) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});
const at = (layout: Layout, id: string) => {
  const rect = layout.cards.get(id);
  if (!rect) throw new Error(`${id} isn't drawn`);
  return rect;
};
const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

function expectNoOverlaps(layout: Layout) {
  const rects = [...layout.cards.entries()];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const [a, first] = rects[i] as [string, Rect];
      const [b, second] = rects[j] as [string, Rect];
      expect(overlap(first, second), `${a} and ${b}`).toBe(false);
    }
  }
}

describe("buildHierarchy", () => {
  test("each manager's reports are in the order they were given, with each person's level", () => {
    const h = buildHierarchy(people);
    expect(h.roots).toEqual(["ceo"]);
    expect(h.reports.get("ceo")).toEqual(["ops", "eng", "pa"]);
    expect(h.reports.get("ops")).toEqual(["o1", "o2"]);
    expect(h.reports.has("pa")).toBe(false);
    expect(h.level.get("ceo")).toBe(1);
    expect(h.level.get("eng")).toBe(2);
    expect(h.level.get("e1")).toBe(3);
    expect(managersOf(h, "o2")).toEqual(["ops", "ceo"]);
  });

  test("a manager who isn't in the chart, or a person who is their own, makes a top", () => {
    const h = buildHierarchy([
      { id: "a", managerId: "nobody" },
      { id: "b", managerId: "b" },
      { id: "c", managerId: null },
      { id: "d", managerId: "c" },
    ]);
    expect(h.roots).toEqual(["a", "b", "c"]);
    expect(h.manager.get("a")).toBeNull();
    expect(h.manager.get("d")).toBe("c");
  });

  test("a second person with an id already taken is left out", () => {
    const h = buildHierarchy([
      { id: "a", name: "First" },
      { id: "a", name: "Second" },
    ]);
    expect(h.people.size).toBe(1);
    expect(h.people.get("a")?.name).toBe("First");
  });

  test("a circle of people reporting to each other is broken at the first of them, and everyone is drawn once", () => {
    const h = buildHierarchy([
      { id: "top" },
      { id: "x", managerId: "z" },
      { id: "y", managerId: "x" },
      { id: "z", managerId: "y" },
    ]);
    expect(h.roots).toEqual(["top", "x"]);
    expect(h.manager.get("x")).toBeNull();
    expect(h.reports.get("x")).toEqual(["y"]);
    expect(h.reports.get("y")).toEqual(["z"]);
    expect(h.reports.has("z")).toBe(false);
    expect(h.level.get("z")).toBe(3);
  });
});

describe("layoutChart", () => {
  test("a manager is centered over their first and last report, a level down, and no two cards overlap", () => {
    const layout = layoutChart(buildHierarchy(people), everyone, options);
    const ceo = at(layout, "ceo");
    const ops = at(layout, "ops");
    const pa = at(layout, "pa");
    const o1 = at(layout, "o1");
    const o2 = at(layout, "o2");

    expect(middle(ceo).x).toBeCloseTo((middle(ops).x + middle(pa).x) / 2);
    expect(middle(ops).x).toBeCloseTo((middle(o1).x + middle(o2).x) / 2);
    expect(ops.y - (ceo.y + ceo.height)).toBe(gaps.down);
    expect(o1.y).toBe(o2.y);
    expect(o2.x - (o1.x + o1.width)).toBe(gaps.across);
    expectNoOverlaps(layout);
    expect(layout.order).toEqual(["ceo", "ops", "o1", "o2", "eng", "e1", "pa"]);
  });

  test("the chart starts at 0, and its size holds every card", () => {
    const layout = layoutChart(buildHierarchy(people), everyone, options);
    const rects = [...layout.cards.values()];
    expect(Math.min(...rects.map((rect) => rect.x))).toBe(0);
    expect(Math.min(...rects.map((rect) => rect.y))).toBe(0);
    expect(Math.max(...rects.map((rect) => rect.x + rect.width))).toBe(
      layout.width,
    );
    expect(Math.max(...rects.map((rect) => rect.y + rect.height))).toBe(
      layout.height,
    );
  });

  test("a closed team isn't drawn, and its manager's place is a card's width", () => {
    const layout = layoutChart(
      buildHierarchy(people),
      new Set(["ceo"]),
      options,
    );
    expect(layout.order).toEqual(["ceo", "ops", "eng", "pa"]);
    expect(layout.cards.has("o1")).toBe(false);
    expect(layout.width).toBe(card.width * 3 + gaps.across * 2);
  });

  test("a line goes down from a manager, across to the reports, and down to each", () => {
    const layout = layoutChart(
      buildHierarchy(people),
      new Set(["ceo"]),
      options,
    );
    const ceo = middle(at(layout, "ceo"));
    const bar = card.height + gaps.down / 2;
    expect(layout.lines).toContain(`M${ceo.x} ${card.height}L${ceo.x} ${bar}`);
    expect(layout.lines).toContain(
      `M${card.width / 2} ${bar}L${layout.width - card.width / 2} ${bar}`,
    );
    for (const id of ["ops", "eng", "pa"]) {
      const x = middle(at(layout, id)).x;
      expect(layout.lines).toContain(
        `M${x} ${bar}L${x} ${card.height + gaps.down}`,
      );
    }
  });

  test("compact, reports who manage no one shown are a column under their manager, and the line runs down beside them", () => {
    const layout = layoutChart(buildHierarchy(people), everyone, {
      ...options,
      stack: true,
    });
    const ops = at(layout, "ops");
    const o1 = at(layout, "o1");
    const o2 = at(layout, "o2");
    expect(o1.x).toBe(ops.x + gaps.indent);
    expect(o2.x).toBe(o1.x);
    expect(o1.y).toBe(ops.y + ops.height + gaps.columnTop);
    expect(o2.y - (o1.y + o1.height)).toBe(gaps.column);
    // A single report is still under their manager in the middle.
    expect(middle(at(layout, "e1")).x).toBe(middle(at(layout, "eng")).x);
    const spine = ops.x + gaps.indent / 2;
    expect(layout.lines).toContain(
      `M${spine} ${ops.y + ops.height}L${spine} ${middle(o2).y}`,
    );
    expect(layout.lines).toContain(
      `M${spine} ${middle(o1).y}L${o1.x} ${middle(o1).y}`,
    );
    expectNoOverlaps(layout);
  });

  test("a column with a closed team in it leaves room between the cards for its button", () => {
    const layout = layoutChart(buildHierarchy(people), new Set(["ceo"]), {
      ...options,
      stack: true,
    });
    const ops = at(layout, "ops");
    const eng = at(layout, "eng");
    expect(eng.y - (ops.y + ops.height)).toBe(gaps.columnWithButtons);
  });

  test("sideways, each level is a step along and colleagues are one above another", () => {
    const layout = layoutChart(buildHierarchy(people), everyone, {
      ...options,
      orientation: "horizontal",
      // A column only goes down the page.
      stack: true,
    });
    const ceo = at(layout, "ceo");
    const ops = at(layout, "ops");
    const eng = at(layout, "eng");
    const o1 = at(layout, "o1");
    expect(ops.x - (ceo.x + ceo.width)).toBe(gaps.down);
    expect(o1.x - (ops.x + ops.width)).toBe(gaps.down);
    expect(ops.x).toBe(eng.x);
    expect(eng.y).toBeGreaterThan(ops.y);
    expect(middle(ceo).y).toBeCloseTo(
      (middle(ops).y + middle(at(layout, "pa")).y) / 2,
    );
    expect(ceo.width).toBe(card.width);
    expect(ceo.height).toBe(card.height);
    expectNoOverlaps(layout);
  });

  test("right to left, the chart is mirrored, the lines with it", () => {
    const h = buildHierarchy(people);
    for (const orientation of ["vertical", "horizontal"] as const) {
      const ltr = layoutChart(h, everyone, { ...options, orientation });
      const rtl = layoutChart(h, everyone, {
        ...options,
        orientation,
        rtl: true,
      });
      expect(rtl.width).toBe(ltr.width);
      for (const [id, rect] of ltr.cards) {
        const mirrored = at(rtl, id);
        expect(mirrored.x, `${orientation} ${id}`).toBeCloseTo(
          ltr.width - rect.x - rect.width,
        );
        expect(mirrored.y).toBe(rect.y);
      }
      const ceo = middle(at(rtl, "ceo"));
      if (orientation === "vertical") {
        expect(rtl.lines).toContain(`M${ceo.x} ${card.height}`);
      } else {
        // The line leaves the head's card from its left.
        expect(rtl.lines).toContain(`M${ltr.width - card.width} ${ceo.y}`);
      }
    }
  });

  test("more than one top are side by side, further apart than colleagues", () => {
    const layout = layoutChart(
      buildHierarchy([{ id: "a" }, { id: "b" }, { id: "c", managerId: "b" }]),
      new Set(["b"]),
      options,
    );
    const a = at(layout, "a");
    const b = at(layout, "b");
    expect(a.y).toBe(b.y);
    expect(b.x - (a.x + a.width)).toBe(gaps.tops);
    expect(layout.lines).not.toContain(`${a.x + a.width / 2} ${card.height}L`);
  });

  test("a chart with no one in it is empty", () => {
    const layout = layoutChart(buildHierarchy([]), new Set(), options);
    expect(layout.order).toEqual([]);
    expect(layout.lines).toBe("");
    expect(layout.width).toBe(0);
  });

  test("a thousand people under one manager, and a line of a thousand managers, are laid out", () => {
    const wide: OrgChartPerson[] = [{ id: "boss" }];
    const deep: OrgChartPerson[] = [{ id: "0" }];
    for (let i = 1; i <= 1000; i++) {
      wide.push({ id: `w${i}`, managerId: "boss" });
      deep.push({ id: String(i), managerId: String(i - 1) });
    }
    const flat = layoutChart(buildHierarchy(wide), new Set(["boss"]), options);
    expect(flat.cards.size).toBe(1001);
    const chain = buildHierarchy(deep);
    const tall = layoutChart(chain, new Set(chain.reports.keys()), options);
    expect(tall.cards.size).toBe(1001);
    expect(at(tall, "1000").y).toBe(1000 * (card.height + gaps.down));
  });
});
