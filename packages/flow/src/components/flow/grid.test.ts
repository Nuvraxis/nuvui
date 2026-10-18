import { describe, expect, test } from "vitest";
import { Grid } from "./grid";

const box = (x: number, y: number, width = 10, height = 10) => ({
  x,
  y,
  width,
  height,
});

describe("the spatial index", () => {
  test("finds what overlaps a box, and nothing else", () => {
    const grid = new Grid(100);
    grid.set("a", box(10, 10));
    grid.set("b", box(150, 10));
    grid.set("c", box(1000, 1000));

    expect([...grid.query(box(0, 0, 200, 50))].sort()).toEqual(["a", "b"]);
    expect([...grid.query(box(990, 990, 30, 30))]).toEqual(["c"]);
    expect(grid.query(box(500, 500, 10, 10)).size).toBe(0);
  });

  test("a thing across two cells is found from either, once", () => {
    const grid = new Grid(100);
    grid.set("wide", box(90, 0, 30, 10));
    expect([...grid.query(box(0, 0, 95, 10))]).toEqual(["wide"]);
    expect([...grid.query(box(110, 0, 10, 10))]).toEqual(["wide"]);
    expect([...grid.query(box(0, 0, 500, 500))]).toEqual(["wide"]);
  });

  test("a moved thing is found where it went and not where it was", () => {
    const grid = new Grid(100);
    grid.set("a", box(10, 10));
    grid.set("a", box(510, 510));
    expect(grid.query(box(0, 0, 50, 50)).size).toBe(0);
    expect([...grid.query(box(500, 500, 50, 50))]).toEqual(["a"]);
    // Moved within its cell, its box still changes.
    grid.set("a", box(560, 560));
    expect(grid.query(box(500, 500, 30, 30)).size).toBe(0);
    expect(grid.size).toBe(1);
  });

  test("a removed thing isn't found", () => {
    const grid = new Grid(100);
    grid.set("a", box(10, 10));
    grid.delete("a");
    grid.delete("never there");
    expect(grid.query(box(0, 0, 100, 100)).size).toBe(0);
    expect(grid.size).toBe(0);
  });

  test("a thing too large for the cells, like a long edge, is still found, and moved", () => {
    const grid = new Grid(10);
    grid.set("long", box(0, 0, 5000, 20));
    expect([...grid.query(box(4000, 0, 5, 5))]).toEqual(["long"]);
    expect(grid.query(box(4000, 100, 5, 5)).size).toBe(0);
    grid.set("long", box(0, 1000, 20, 20));
    expect(grid.query(box(4000, 0, 5, 5)).size).toBe(0);
    expect([...grid.query(box(0, 1000, 5, 5))]).toEqual(["long"]);
  });

  test("a query wider than the full cells looks at each thing once, and finds the same", () => {
    const grid = new Grid(100);
    for (let i = 0; i < 50; i++) grid.set(`n${i}`, box(i * 200, 0));
    const everything = grid.query(box(-1e6, -1e6, 2e6, 2e6));
    expect(everything.size).toBe(50);
    const some = grid.query(box(-1e6, -1e6, 1e6 + 1000, 2e6));
    expect([...some].sort()).toEqual(
      ["n0", "n1", "n2", "n3", "n4", "n5"].sort(),
    );
  });
});
