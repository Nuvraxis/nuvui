import { describe, expect, test } from "vitest";
import {
  boundaryPoint,
  boundsOf,
  contains,
  distanceToLine,
  edgeGeometry,
  type FlowShape,
  fitViewport,
  grow,
  labelBox,
  outlinePath,
  type Point,
  type Rect,
  visibleRect,
} from "./geometry";

const rect: Rect = { x: 100, y: 50, width: 160, height: 80 };
const center = { x: 180, y: 90 };
const shapes: FlowShape[] = ["box", "rounded", "circle", "diamond", "pill"];

// Whether a point is on a shape's outline: inside it, and a hair further
// out isn't.
function onOutline(shape: FlowShape, at: Rect, point: Point) {
  const c = { x: at.x + at.width / 2, y: at.y + at.height / 2 };
  const out = {
    x: c.x + (point.x - c.x) * 1.01,
    y: c.y + (point.y - c.y) * 1.01,
  };
  const inward = {
    x: c.x + (point.x - c.x) * 0.99,
    y: c.y + (point.y - c.y) * 0.99,
  };
  return contains(shape, at, inward) && !contains(shape, at, out);
}

describe("shapes", () => {
  test("every outline is a closed path from the node's corner", () => {
    for (const shape of shapes) {
      const d = outlinePath(shape, 160, 80);
      expect(d.startsWith("M"), shape).toBe(true);
      expect(d.endsWith("Z"), shape).toBe(true);
    }
  });

  test("a circle's and a diamond's corners are outside them, and a box's aren't", () => {
    const corner = { x: rect.x + 2, y: rect.y + 2 };
    expect(contains("box", rect, corner)).toBe(true);
    expect(contains("circle", rect, corner)).toBe(false);
    expect(contains("diamond", rect, corner)).toBe(false);
    expect(contains("pill", rect, corner)).toBe(false);
    for (const shape of shapes)
      expect(contains(shape, rect, center)).toBe(true);
  });

  test("a line from the middle toward any point leaves each shape on its outline", () => {
    const toward = [
      { x: 500, y: 90 },
      { x: 180, y: -300 },
      { x: -50, y: 400 },
      { x: 400, y: 300 },
      { x: 190, y: 95 },
    ];
    for (const shape of shapes) {
      for (const point of toward) {
        const edge = boundaryPoint(shape, rect, point);
        expect(
          onOutline(shape, rect, edge),
          `${shape} toward ${point.x},${point.y}`,
        ).toBe(true);
      }
    }
  });

  test("a circle's edge is its radius from the middle", () => {
    const square = { x: 0, y: 0, width: 100, height: 100 };
    const point = boundaryPoint("circle", square, { x: 300, y: 200 });
    expect(Math.hypot(point.x - 50, point.y - 50)).toBeCloseTo(50, 6);
  });

  test("toward the middle itself, the edge is the middle", () => {
    expect(boundaryPoint("box", rect, center)).toEqual(center);
  });

  test("a label sits inside its shape, so words don't run over a circle's or a diamond's outline", () => {
    for (const shape of shapes) {
      const box = labelBox(shape, rect.width, rect.height);
      // A pixel in from each corner: a circle's label box touches the
      // circle at its corners exactly.
      const corners = [
        { x: box.x + 1, y: box.y + 1 },
        { x: box.x + box.width - 1, y: box.y + box.height - 1 },
      ].map((p) => ({ x: p.x + rect.x, y: p.y + rect.y }));
      for (const corner of corners) {
        expect(contains(shape, rect, corner), shape).toBe(true);
      }
    }
  });
});

describe("edges", () => {
  const a: Rect = { x: 0, y: 0, width: 160, height: 56 };
  const right: Rect = { x: 400, y: 0, width: 160, height: 56 };
  const below: Rect = { x: 0, y: 300, width: 160, height: 56 };

  test("a straight edge runs from one outline to the other", () => {
    const g = edgeGeometry("straight", "circle", a, "diamond", right);
    const first = g.points[0] as Point;
    const last = g.points[g.points.length - 1] as Point;
    expect(onOutline("circle", a, first)).toBe(true);
    expect(onOutline("diamond", right, last)).toBe(true);
    expect(g.d.startsWith("M")).toBe(true);
  });

  test("a curved or a step edge joins the sides that face each other", () => {
    for (const path of ["curved", "step"] as const) {
      const across = edgeGeometry(path, "box", a, "box", right);
      expect(across.points[0]).toEqual({ x: 160, y: 28 });
      expect(across.points[across.points.length - 1]).toEqual({
        x: 400,
        y: 28,
      });
      const down = edgeGeometry(path, "box", a, "box", below);
      expect(down.points[0]).toEqual({ x: 80, y: 56 });
      expect(down.points[down.points.length - 1]).toEqual({ x: 80, y: 300 });
    }
  });

  test("two wide boxes side by side, a little apart in height, still join at their sides", () => {
    const near: Rect = { x: 240, y: 40, width: 160, height: 56 };
    const g = edgeGeometry("curved", "box", a, "box", near);
    expect(g.points[0]).toEqual({ x: 160, y: 28 });
  });

  test("a step edge turns only at right angles", () => {
    const diagonal: Rect = { x: 400, y: 260, width: 160, height: 56 };
    const g = edgeGeometry("step", "box", a, "box", diagonal);
    for (let i = 0; i < g.points.length - 1; i++) {
      const p = g.points[i] as Point;
      const q = g.points[i + 1] as Point;
      expect(p.x === q.x || p.y === q.y).toBe(true);
    }
  });

  test("an edge from a node to itself is a loop off its top right", () => {
    const g = edgeGeometry("curved", "box", a, "box", a, true);
    expect(g.bounds.y).toBeLessThan(a.y);
    expect(g.bounds.x + g.bounds.width).toBeGreaterThan(a.x + a.width);
  });

  test("its label goes in the middle of the line", () => {
    const g = edgeGeometry("straight", "box", a, "box", right);
    expect(g.middle.y).toBeCloseTo(28, 6);
    expect(g.middle.x).toBeCloseTo(280, 6);
  });

  test("the pointer is on a line when it's near it", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    expect(distanceToLine(line, { x: 50, y: 3 })).toBeCloseTo(3, 6);
    expect(distanceToLine(line, { x: 104, y: 50 })).toBeCloseTo(4, 6);
    expect(distanceToLine(line, { x: -10, y: 0 })).toBeCloseTo(10, 6);
  });
});

describe("the view", () => {
  test("fitting puts the whole diagram in the middle of the frame, with room around it", () => {
    const bounds = { x: 100, y: 100, width: 400, height: 200 };
    const v = fitViewport(bounds, { width: 848, height: 448 }, 24, 0.1, 2);
    expect(v.zoom).toBe(2);
    const shown = visibleRect(v, { width: 848, height: 448 });
    expect(shown.x).toBeLessThanOrEqual(bounds.x);
    expect(shown.y).toBeLessThanOrEqual(bounds.y);
    expect(shown.x + shown.width).toBeGreaterThanOrEqual(
      bounds.x + bounds.width,
    );
    expect(shown.y + shown.height).toBeGreaterThanOrEqual(
      bounds.y + bounds.height,
    );
    expect(shown.x + shown.width / 2).toBeCloseTo(300, 6);
  });

  test("fitting doesn't zoom in past its limit, or out past the other", () => {
    const tiny = { x: 0, y: 0, width: 10, height: 10 };
    expect(
      fitViewport(tiny, { width: 800, height: 400 }, 24, 0.1, 1).zoom,
    ).toBe(1);
    const huge = { x: 0, y: 0, width: 1e7, height: 1e7 };
    expect(
      fitViewport(huge, { width: 800, height: 400 }, 24, 0.1, 1).zoom,
    ).toBe(0.1);
  });

  test("what a view shows, and that view grown on every side", () => {
    const shown = visibleRect(
      { x: -200, y: -100, zoom: 2 },
      { width: 800, height: 400 },
    );
    expect(shown).toEqual({ x: 100, y: 50, width: 400, height: 200 });
    expect(grow(shown, 0.5)).toEqual({
      x: -100,
      y: -50,
      width: 800,
      height: 400,
    });
  });

  test("the box around nothing is nothing", () => {
    expect(boundsOf([])).toBeNull();
    expect(boundsOf([rect, { x: 0, y: 0, width: 10, height: 10 }])).toEqual({
      x: 0,
      y: 0,
      width: 260,
      height: 130,
    });
  });
});
