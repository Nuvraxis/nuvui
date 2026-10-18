import { intersects, type Rect } from "./geometry";

// More cells than this and a thing is kept in a list of its own, checked
// on every query. A long edge across a large diagram would otherwise be
// written into thousands of cells, and moved out of them on every drag.
const maxCells = 64;

/**
 * A spatial index: the diagram cut into square cells, each holding what
 * overlaps it. Finding what's in a part of the diagram looks at the cells
 * that part covers, not at everything.
 */
export class Grid {
  private readonly cells = new Map<string, Set<string>>();
  private readonly rects = new Map<string, Rect>();
  private readonly keys = new Map<string, string[]>();
  private readonly large = new Set<string>();

  constructor(private readonly cellSize = 256) {}

  get size() {
    return this.rects.size;
  }

  private range(rect: Rect) {
    const s = this.cellSize;
    return {
      x0: Math.floor(rect.x / s),
      y0: Math.floor(rect.y / s),
      x1: Math.floor((rect.x + rect.width) / s),
      y1: Math.floor((rect.y + rect.height) / s),
    };
  }

  /** Adds `id`, or moves it if it's already in. */
  set(id: string, rect: Rect) {
    const old = this.rects.get(id);
    if (old) {
      const a = this.range(old);
      const b = this.range(rect);
      if (
        a.x0 === b.x0 &&
        a.y0 === b.y0 &&
        a.x1 === b.x1 &&
        a.y1 === b.y1 &&
        this.large.has(id) === false
      ) {
        // In the same cells as before: only its box changes.
        this.rects.set(id, rect);
        return;
      }
      this.delete(id);
    }
    this.rects.set(id, rect);
    const { x0, y0, x1, y1 } = this.range(rect);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > maxCells) {
      this.large.add(id);
      return;
    }
    const keys: string[] = [];
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const key = `${x},${y}`;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = new Set();
          this.cells.set(key, cell);
        }
        cell.add(id);
        keys.push(key);
      }
    }
    this.keys.set(id, keys);
  }

  delete(id: string) {
    if (!this.rects.delete(id)) return;
    if (this.large.delete(id)) return;
    for (const key of this.keys.get(id) ?? []) {
      const cell = this.cells.get(key);
      if (!cell) continue;
      cell.delete(id);
      if (cell.size === 0) this.cells.delete(key);
    }
    this.keys.delete(id);
  }

  /** What overlaps `rect`, added to `into`. */
  query(rect: Rect, into = new Set<string>()) {
    const { x0, y0, x1, y1 } = this.range(rect);
    const wide = (x1 - x0 + 1) * (y1 - y0 + 1);
    if (wide > this.cells.size) {
      // Zoomed far out the view covers more cells than there are full
      // ones, and going through the full ones is quicker.
      for (const [id, box] of this.rects) {
        if (intersects(box, rect)) into.add(id);
      }
      return into;
    }
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const cell = this.cells.get(`${x},${y}`);
        if (!cell) continue;
        for (const id of cell) {
          if (!into.has(id) && intersects(this.rects.get(id) as Rect, rect)) {
            into.add(id);
          }
        }
      }
    }
    for (const id of this.large) {
      if (intersects(this.rects.get(id) as Rect, rect)) into.add(id);
    }
    return into;
  }

  clear() {
    this.cells.clear();
    this.rects.clear();
    this.keys.clear();
    this.large.clear();
  }
}
