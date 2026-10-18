import { describe, expect, test, vi } from "vitest";
import { detailAt, FlowStore } from "./store";
import type { FlowEdge, FlowNode } from "./types";

const node = (
  id: string,
  x: number,
  y: number,
  extra: Partial<FlowNode> = {},
): FlowNode => ({ id, label: id.toUpperCase(), position: { x, y }, ...extra });

function storeWith(nodes: FlowNode[], edges: FlowEdge[] = []) {
  const store = new FlowStore();
  store.setNodes(nodes);
  store.setEdges(edges);
  return store;
}

describe("taking in the app's data", () => {
  test("a node is drawn at its position, at its shape's size unless it has one", () => {
    const store = storeWith([
      node("a", 10, 20),
      node("b", 0, 0, { shape: "circle" }),
      node("c", 0, 0, { size: { width: 50, height: 30 } }),
    ]);
    expect(store.node("a")?.rect).toEqual({
      x: 10,
      y: 20,
      width: 160,
      height: 56,
    });
    expect(store.node("a")?.shape).toBe("rounded");
    expect(store.node("b")?.rect.width).toBe(88);
    expect(store.node("c")?.rect).toEqual({
      x: 0,
      y: 0,
      width: 50,
      height: 30,
    });
  });

  test("the same node object is read once: a new array with it changes nothing for it", () => {
    const a = node("a", 0, 0);
    const b = node("b", 300, 0);
    const store = storeWith([a, b]);
    const before = store.node("a");
    const heard = vi.fn();
    store.subscribe("node:a", heard);

    store.setNodes([a, { ...b, label: "Bee" }]);

    expect(store.node("a")).toBe(before);
    expect(heard).not.toHaveBeenCalled();
    expect(store.node("b")?.node.label).toBe("Bee");
  });

  test("a removed node is gone, with its selection, and an edge to it isn't drawn", () => {
    const store = storeWith(
      [node("a", 0, 0), node("b", 300, 0)],
      [{ id: "ab", from: "a", to: "b" }],
    );
    store.setSelection({ nodes: ["b"], edges: [] });
    store.setNodes([node("a", 0, 0)]);

    expect(store.node("b")).toBeUndefined();
    expect(store.getSelection().nodes).toEqual([]);
    expect(store.edge("ab")?.geometry).toBeNull();
  });

  test("an edge is worked out from its ends, and again when one moves", () => {
    const store = storeWith(
      [node("a", 0, 0), node("b", 400, 0)],
      [{ id: "ab", from: "a", to: "b", path: "straight" }],
    );
    expect(store.edge("ab")?.geometry?.points).toEqual([
      { x: 160, y: 28 },
      { x: 400, y: 28 },
    ]);
    const heard = vi.fn();
    store.subscribe("edge:ab", heard);

    store.moveNodes(["b"], 100, 0);

    expect(heard).toHaveBeenCalled();
    expect(store.edge("ab")?.geometry?.points[1]).toEqual({ x: 500, y: 28 });
  });

  test("an edge without a path of its own takes the diagram's", () => {
    const store = new FlowStore();
    store.defaultPath = "step";
    store.setNodes([node("a", 0, 0), node("b", 400, 300)]);
    store.setEdges([{ id: "ab", from: "a", to: "b" }]);
    const points = store.edge("ab")?.geometry?.points ?? [];
    expect(points.length).toBeGreaterThan(2);
  });

  test("a node's name changes when its links do, or the node it leads to is renamed", () => {
    // The same object for "a" throughout, so it's never read again for
    // itself.
    const a = node("a", 0, 0);
    const store = storeWith([a, node("b", 300, 0)]);
    const first = store.node("a");
    store.setEdges([{ id: "ab", from: "a", to: "b" }]);
    const linked = store.node("a");
    expect(linked).not.toBe(first);
    expect(store.outgoing("a").map((edge) => edge.edge.to)).toEqual(["b"]);

    store.setNodes([a, node("b", 300, 0, { label: "Bee" })]);
    expect(store.node("a")).not.toBe(linked);
  });
});

describe("moving", () => {
  test("nodes move without the app, and the app's nodes with the new positions are made only for those", () => {
    const a = node("a", 0, 0);
    const b = node("b", 300, 0);
    const store = storeWith([a, b]);
    store.moveNodes(["a"], 15, 25);

    const next = store.nodesWithPositions(new Set(["a"]));
    expect(next[0]?.position).toEqual({ x: 15, y: 25 });
    expect(next[1]).toBe(b);
    expect(store.currentNodes()[0]).toBe(a);
  });

  test("placing nodes moves the edges between them once", () => {
    const store = storeWith(
      [node("a", 0, 0), node("b", 400, 0)],
      [{ id: "ab", from: "a", to: "b" }],
    );
    const heard = vi.fn();
    store.subscribe("edge:ab", heard);
    store.placeNodes(
      new Map([
        ["a", { x: 10, y: 10 }],
        ["b", { x: 410, y: 10 }],
      ]),
    );
    expect(heard).toHaveBeenCalledTimes(1);
  });

  test("put back where the app says, after a move the app didn't take", () => {
    const store = storeWith([node("a", 0, 0)]);
    store.moveNodes(["a"], 50, 0);
    store.resync(["a"]);
    expect(store.node("a")?.rect.x).toBe(0);
  });
});

describe("selection", () => {
  test("is kept in the app's order, and only the nodes that change hear of it", () => {
    const store = storeWith([
      node("a", 0, 0),
      node("b", 300, 0),
      node("c", 600, 0),
    ]);
    const heardA = vi.fn();
    const heardC = vi.fn();
    store.subscribe("node:a", heardA);
    store.subscribe("node:c", heardC);

    store.setSelection({ nodes: ["c", "a"], edges: [] });

    expect(store.getSelection().nodes).toEqual(["a", "c"]);
    expect(store.node("a")?.selected).toBe(true);
    expect(heardA).toHaveBeenCalledTimes(1);
    store.setSelection({ nodes: ["c", "a"], edges: [] });
    expect(heardA).toHaveBeenCalledTimes(1);
    expect(heardC).toHaveBeenCalledTimes(1);
  });
});

describe("what's drawn", () => {
  // Nodes 300 apart in a row, and a frame that shows about two of them.
  const row = (count: number) =>
    Array.from({ length: count }, (_, i) => node(`n${i}`, i * 300, 0));

  test("before the frame is measured, everything up to the server's limit, and nothing over it", () => {
    const store = storeWith(row(5));
    expect(store.getVisible().nodes).toHaveLength(5);
    store.serverLimit = 3;
    store.refresh();
    expect(store.getVisible().nodes).toHaveLength(0);
  });

  test("once measured, only what's in view and a margin around it, in the app's order", () => {
    const store = storeWith(row(1000));
    store.setSize({ width: 600, height: 400 });
    store.setViewport({ x: -3000, y: 0, zoom: 1 });
    store.refresh();
    const shown = store.getVisible().nodes;
    expect(shown.length).toBeGreaterThan(1);
    expect(shown.length).toBeLessThan(10);
    expect(shown).toContain("n10");
    const indexes = shown.map((id) => Number(id.slice(1)));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  test("the active node is drawn wherever it is", () => {
    const store = storeWith(row(1000));
    store.setSize({ width: 600, height: 400 });
    store.setViewport({ x: 0, y: 0, zoom: 1 });
    store.setActive("n900");
    expect(store.getVisible().nodes).toContain("n900");
  });

  test("an unchanged view is the same list, so nothing re-renders", () => {
    const store = storeWith(row(100));
    store.setSize({ width: 600, height: 400 });
    store.refresh();
    const before = store.getVisible();
    store.refresh();
    expect(store.getVisible()).toBe(before);
  });

  test("detail goes by the zoom: everything, then no words, then the overview", () => {
    expect(detailAt(1)).toBe(0);
    expect(detailAt(0.5)).toBe(0);
    expect(detailAt(0.3)).toBe(1);
    expect(detailAt(0.1)).toBe(2);
  });

  test("with too many nodes in view to draw one by one, it's the overview at any zoom, and it's left again only well under that", () => {
    // Touching boxes, 60 by 60, and a view on the middle of them.
    const tiles = Array.from({ length: 3600 }, (_, i) =>
      node(`t${i}`, (i % 60) * 100, Math.floor(i / 60) * 50, {
        size: { width: 100, height: 50 },
      }),
    );
    const store = storeWith(tiles);
    store.setSize({ width: 600, height: 400 });
    const look = (zoom: number) => {
      store.setViewport({ x: 300 - 3000 * zoom, y: 200 - 1500 * zoom, zoom });
      store.refresh();
      return store.getDetail();
    };

    expect(look(0.25)).toBe(2);
    // 192 in view: still the overview, coming from it.
    expect(look(0.8)).toBe(2);
    expect(look(1)).toBe(0);
    // The same 192, coming from up close: drawn one by one.
    expect(look(0.8)).toBe(0);
    expect(store.getVisible().nodes.length).toBe(192);
  });

  test("from far out the nodes are one path for each color, and none is drawn one by one", () => {
    const store = storeWith([
      ...row(10),
      node("p", 0, 300, { intent: "primary" }),
    ]);
    store.setSize({ width: 600, height: 400 });
    store.setViewport({ x: 0, y: 0, zoom: 0.1 });
    store.refresh();
    const overview = store.getOverview();
    expect(Object.keys(overview.nodes).sort()).toEqual(["neutral", "primary"]);
    expect(overview.nodes.neutral?.match(/M/g)).toHaveLength(10);
    expect(store.getVisible().nodes).toEqual([]);
  });
});

describe("finding things", () => {
  test("the node under a point, the last drawn on top, inside its shape only", () => {
    const store = storeWith([
      node("under", 0, 0),
      node("over", 50, 0),
      node("round", 400, 0, { shape: "circle" }),
    ]);
    expect(store.hitTest({ x: 100, y: 20 }, 1, false)).toEqual({
      kind: "node",
      id: "over",
    });
    expect(store.hitTest({ x: 20, y: 20 }, 1, false)).toEqual({
      kind: "node",
      id: "under",
    });
    // A circle's corner is empty.
    expect(store.hitTest({ x: 402, y: 2 }, 1, false)).toBeNull();
  });

  test("an edge near the pointer, by an amount that's the same on the screen at any zoom", () => {
    const store = storeWith(
      [node("a", 0, 0), node("b", 600, 0)],
      [{ id: "ab", from: "a", to: "b", path: "straight" }],
    );
    expect(store.hitTest({ x: 300, y: 33 }, 1, false)).toEqual({
      kind: "edge",
      id: "ab",
    });
    expect(store.hitTest({ x: 300, y: 50 }, 1, false)).toBeNull();
    expect(store.hitTest({ x: 300, y: 50 }, 0.25, false)).toEqual({
      kind: "edge",
      id: "ab",
    });
  });

  test("a handle comes before its node, only when handles are asked for, and never on a locked node", () => {
    const store = storeWith([
      node("a", 0, 0),
      node("lock", 400, 0, { locked: true }),
    ]);
    store.setHandlesOn("a");
    expect(store.hitTest({ x: 160, y: 28 }, 1, true)).toEqual({
      kind: "handle",
      id: "a",
      point: { x: 160, y: 28 },
    });
    expect(store.hitTest({ x: 158, y: 28 }, 1, false)).toEqual({
      kind: "node",
      id: "a",
    });
    store.setHandlesOn("lock");
    expect(store.hitTest({ x: 560, y: 28 }, 1, true)?.kind).toBe("node");
  });

  test("zoomed out, a node's middle is the node and not its handle, and below full detail there are no handles", () => {
    const store = storeWith([node("a", 0, 0)]);
    store.setHandlesOn("a");
    store.setSize({ width: 300, height: 400 });
    // Full detail still. The top handle is 28 from the middle, inside
    // the 33 a handle reaches at this zoom.
    store.setViewport({ x: 0, y: 0, zoom: 0.6 });
    store.refresh();
    expect(store.getDetail()).toBe(0);
    expect(store.hitTest({ x: 80, y: 28 }, 0.42, true)).toEqual({
      kind: "node",
      id: "a",
    });
    expect(store.hitTest({ x: 80, y: 2 }, 0.42, true)?.kind).toBe("handle");

    store.setViewport({ x: 0, y: 0, zoom: 0.42 });
    store.refresh();
    expect(store.getDetail()).toBe(1);
    expect(store.hitTest({ x: 80, y: 2 }, 0.42, true)?.kind).toBe("node");
  });

  test("the nodes a box touches", () => {
    const store = storeWith([
      node("a", 0, 0),
      node("b", 300, 0),
      node("c", 0, 300),
    ]);
    expect(
      store.nodesIn({ x: -10, y: -10, width: 320, height: 20 }).sort(),
    ).toEqual(["a", "b"]);
  });

  test("the arrow keys go to the nearest node the way they point", () => {
    const store = storeWith([
      node("mid", 300, 300),
      node("right", 600, 320),
      node("far", 1200, 300),
      node("up", 300, 0),
      node("corner", 600, 0),
    ]);
    expect(store.nearest("mid", 1, 0)).toBe("right");
    expect(store.nearest("mid", 0, -1)).toBe("up");
    expect(store.nearest("mid", -1, 0)).toBeNull();
    expect(store.nearest("up", 0, 1)).toBe("mid");
  });
});
