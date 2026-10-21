import { seeded } from "../../core/random";
import type { Point, Scene, Size } from "../../core/scene";

export interface HexagonSettings {
  speed: number;
  density: number;
}

interface Cell {
  x: number;
  y: number;
  /** How lit it is, from 0 to 1, fading as time goes on. */
  light: number;
}

// The distance from a hexagon's middle to a corner, in CSS pixels, at a
// density of 1.
const radius = 30;
// The gap between neighbors.
const gap = 3;
const fade = 1.4;

/**
 * A grid of hexagons. The ones under the pointer light up and fade after
 * it, and now and then one lights on its own.
 */
export function hexagonScene({ speed, density }: HexagonSettings): Scene {
  const random = seeded(5);
  const size = radius / Math.sqrt(Math.max(density, 0.2));
  let area: Size = { width: 0, height: 0, ratio: 1, rtl: false };
  let line = "";
  let glow = "";
  let cells: Cell[] = [];
  let outlines = new Path2D();
  let pointer: Point | null = null;
  let untilNext = 0;

  const corners = (x: number, y: number, r: number) =>
    Array.from({ length: 6 }, (_, index) => {
      // Points up and down, so rows sit in each other's gaps.
      const angle = (Math.PI / 3) * index + Math.PI / 6;
      return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
    });

  const shape = (path: Path2D, cell: Cell) => {
    const points = corners(cell.x, cell.y, size - gap / 2);
    points.forEach((point, index) => {
      if (index === 0) path.moveTo(point.x, point.y);
      else path.lineTo(point.x, point.y);
    });
    path.closePath();
  };

  function light(at: Point, reach: number) {
    for (const cell of cells) {
      const distance = Math.hypot(cell.x - at.x, cell.y - at.y);
      if (distance < reach) {
        cell.light = Math.max(cell.light, 1 - distance / reach);
      }
    }
  }

  return {
    theme(theme) {
      line = theme.color("--nuv-background-ink");
      glow = theme.color("--nuv-background-accent");
    },
    resize(next) {
      area = next;
      const across = Math.sqrt(3) * size;
      const down = 1.5 * size;
      cells = [];
      for (let row = -1; row * down < next.height + size; row++) {
        const offset = row % 2 === 0 ? 0 : across / 2;
        for (let column = -1; column * across < next.width + across; column++) {
          cells.push({ x: column * across + offset, y: row * down, light: 0 });
        }
      }
      outlines = new Path2D();
      for (const cell of cells) shape(outlines, cell);
    },
    step(seconds) {
      const dim = Math.exp(-seconds * fade);
      for (const cell of cells) cell.light *= dim;
      if (pointer) light(pointer, size * 2.2);
      untilNext -= seconds * speed;
      if (untilNext <= 0 && cells.length > 0) {
        const cell = cells[Math.floor(random() * cells.length)];
        if (cell) cell.light = Math.max(cell.light, 0.6);
        untilNext = 0.35 + random() * 0.5;
      }
    },
    settle() {
      // A few lit, at different points in their fading.
      for (let index = 0; index < 60; index++) this.step(1 / 20);
    },
    draw(context) {
      if (area.width === 0) return;
      context.lineWidth = 1;
      context.strokeStyle = line;
      context.globalAlpha = 0.5;
      context.stroke(outlines);
      context.fillStyle = glow;
      context.strokeStyle = glow;
      for (const cell of cells) {
        if (cell.light < 0.02) continue;
        const path = new Path2D();
        shape(path, cell);
        context.globalAlpha = cell.light * 0.35;
        context.fill(path);
        context.globalAlpha = cell.light * 0.8;
        context.stroke(path);
      }
      context.globalAlpha = 1;
    },
    point(point) {
      pointer = point;
    },
    press(point) {
      light(point, size * 5);
    },
  };
}
