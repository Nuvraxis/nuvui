import { noise3 } from "../../core/noise";
import type { Point, Scene, Size } from "../../core/scene";

export interface TopographySettings {
  speed: number;
  density: number;
}

interface Wave {
  x: number;
  y: number;
  age: number;
}

// The field is worked out on a grid this many CSS pixels apart, and the
// lines between the points are found by marching squares.
const cell = 12;
// How wide a hill of the land is, in CSS pixels.
const scale = 260;
const hillRadius = 140;
const waveSpeed = 260;
const waveLife = 2.4;
// Every fourth line is an index line, drawn stronger, as on a map.
const indexEvery = 4;

/**
 * Contour lines of a land that shifts slowly. The pointer raises a hill
 * where it is, and a press sends a wave across.
 */
export function topographyScene({ speed, density }: TopographySettings): Scene {
  const noise = noise3(11);
  let size: Size = { width: 0, height: 0, ratio: 1, rtl: false };
  let color = "";
  let time = 0;
  let columns = 0;
  let rows = 0;
  let field = new Float32Array(0);
  let pointer: Point | null = null;
  // How high the pointer's hill is, on its way up or down.
  let hill = 0;
  let hillAt: Point = { x: 0, y: 0 };
  let waves: Wave[] = [];
  const levels = Math.max(3, Math.round(14 * Math.max(density, 0.2)));

  function sample() {
    const drift = time * 0.04;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = column * cell;
        const y = row * cell;
        let value =
          noise(x / scale, y / scale, drift) +
          0.5 * noise(x / (scale / 2), y / (scale / 2), drift + 10);
        if (hill > 0.001) {
          const dx = x - hillAt.x;
          const dy = y - hillAt.y;
          value +=
            0.6 *
            hill *
            Math.exp(-(dx * dx + dy * dy) / (hillRadius * hillRadius));
        }
        for (const wave of waves) {
          const distance = Math.hypot(x - wave.x, y - wave.y);
          const front = (distance - wave.age * waveSpeed) / 40;
          value += 0.25 * (1 - wave.age / waveLife) * Math.exp(-front * front);
        }
        field[row * columns + column] = value;
      }
    }
  }

  // The two points where a level crosses a cell's edges, by marching
  // squares, as a path of short lines.
  function trace(path: Path2D, level: number) {
    for (let row = 0; row < rows - 1; row++) {
      for (let column = 0; column < columns - 1; column++) {
        const index = row * columns + column;
        const a = field[index] ?? 0;
        const b = field[index + 1] ?? 0;
        const c = field[index + columns + 1] ?? 0;
        const d = field[index + columns] ?? 0;
        const corners =
          (a > level ? 8 : 0) |
          (b > level ? 4 : 0) |
          (c > level ? 2 : 0) |
          (d > level ? 1 : 0);
        if (corners === 0 || corners === 15) continue;
        const x = column * cell;
        const y = row * cell;
        const across = (from: number, to: number) =>
          from === to ? 0.5 : (level - from) / (to - from);
        const top = { x: x + cell * across(a, b), y };
        const right = { x: x + cell, y: y + cell * across(b, c) };
        const bottom = { x: x + cell * across(d, c), y: y + cell };
        const left = { x, y: y + cell * across(a, d) };
        const line = (p: Point, q: Point) => {
          path.moveTo(p.x, p.y);
          path.lineTo(q.x, q.y);
        };
        switch (corners) {
          case 1:
          case 14:
            line(left, bottom);
            break;
          case 2:
          case 13:
            line(bottom, right);
            break;
          case 3:
          case 12:
            line(left, right);
            break;
          case 4:
          case 11:
            line(top, right);
            break;
          case 6:
          case 9:
            line(top, bottom);
            break;
          case 7:
          case 8:
            line(left, top);
            break;
          case 5:
            line(left, top);
            line(bottom, right);
            break;
          case 10:
            line(top, right);
            line(left, bottom);
            break;
        }
      }
    }
  }

  return {
    theme(theme) {
      color = theme.color("--nuv-background-ink");
    },
    resize(next) {
      size = next;
      columns = Math.ceil(next.width / cell) + 1;
      rows = Math.ceil(next.height / cell) + 1;
      field = new Float32Array(columns * rows);
      sample();
    },
    step(seconds) {
      time += seconds * speed;
      const target = pointer ? 1 : 0;
      hill += (target - hill) * (1 - Math.exp(-seconds * 4));
      if (pointer) {
        const ease = 1 - Math.exp(-seconds * 8);
        hillAt = {
          x: hillAt.x + (pointer.x - hillAt.x) * ease,
          y: hillAt.y + (pointer.y - hillAt.y) * ease,
        };
      }
      waves = waves
        .map((wave) => ({ ...wave, age: wave.age + seconds }))
        .filter((wave) => wave.age < waveLife);
      sample();
    },
    settle() {
      // The land at its first moment, with nothing raised.
      sample();
    },
    draw(context) {
      if (size.width === 0) return;
      context.strokeStyle = color;
      context.lineWidth = 1;
      const minor = new Path2D();
      const major = new Path2D();
      // The noise rarely leaves -0.9 to 0.9, so the levels are spread over
      // that, and a hill or a wave rises through more of them.
      for (let index = 0; index < levels; index++) {
        const level = -0.9 + (1.8 * (index + 0.5)) / levels;
        trace(index % indexEvery === 0 ? major : minor, level);
      }
      context.globalAlpha = 0.45;
      context.stroke(minor);
      context.globalAlpha = 0.8;
      context.stroke(major);
      context.globalAlpha = 1;
    },
    point(point) {
      if (point && !pointer) hillAt = point;
      pointer = point;
    },
    press(point) {
      waves = [...waves.slice(-3), { ...point, age: 0 }];
    },
  };
}
