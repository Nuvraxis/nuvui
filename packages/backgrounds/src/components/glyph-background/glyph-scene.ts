import { noise3 } from "../../core/noise";
import { seeded } from "../../core/random";
import type { Point, Scene, Size } from "../../core/scene";

export interface GlyphSettings {
  speed: number;
  density: number;
  glyphs: string;
}

interface Mark extends Point {
  age: number;
}

// The size of a character's cell, in CSS pixels, at a density of 1.
const cellSize = 20;
// How bright every character is with no light on it.
const restingAlpha = 0.14;
const glows = 3;
const trailLife = 0.9;
const trailReach = 70;
const rippleSpeed = 320;
const rippleBand = 36;
const rippleLife = 1.6;

/**
 * A field of characters, lit by glows that wander over it. The pointer
 * leaves a trail of light and a press sends a ring of it outward. Now and
 * then a character changes.
 */
export function glyphScene({ speed, density, glyphs }: GlyphSettings): Scene {
  const random = seeded(13);
  const noise = noise3(17);
  const characters = Array.from(glyphs.length > 0 ? glyphs : "0");
  const cell = cellSize / Math.sqrt(Math.max(density, 0.2));
  let size: Size = { width: 0, height: 0, ratio: 1, rtl: false };
  let ink = "";
  let accent = "";
  let font = "monospace";
  let columns = 0;
  let rows = 0;
  let shown = new Uint16Array(0);
  let time = 0;
  let untilChange = 0;
  let trail: Mark[] = [];
  let ripples: Mark[] = [];
  // Every character at rest, drawn once, and again where one changes.
  const cache = document.createElement("canvas");
  const restingContext = () => cache.getContext("2d");

  const fontAt = () => `${Math.round(cell * 0.62)}px ${font}`;
  const middle = (index: number) => ({
    x: (index % columns) * cell + cell / 2,
    y: Math.floor(index / columns) * cell + cell / 2,
  });

  function drawResting(index: number, clear: boolean) {
    const context = restingContext();
    if (!context) return;
    const { x, y } = middle(index);
    if (clear) context.clearRect(x - cell / 2, y - cell / 2, cell, cell);
    context.fillText(characters[shown[index] ?? 0] ?? "", x, y);
  }

  function paintResting() {
    const context = restingContext();
    if (!context) return;
    cache.width = Math.round(size.width * size.ratio);
    cache.height = Math.round(size.height * size.ratio);
    context.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
    context.font = fontAt();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = ink;
    context.globalAlpha = restingAlpha;
    for (let index = 0; index < shown.length; index++)
      drawResting(index, false);
  }

  const glowAt = (index: number): Point => ({
    x: size.width * (0.5 + 0.55 * noise(time * 0.06, index * 7.3, 0)),
    y: size.height * (0.5 + 0.55 * noise(index * 7.3, time * 0.06, 3)),
  });

  return {
    theme(theme) {
      ink = theme.color("--nuv-background-ink");
      accent = theme.color("--nuv-background-accent");
      font = theme.value("--font-mono") || "monospace";
      if (size.width > 0) paintResting();
    },
    resize(next) {
      size = next;
      columns = Math.ceil(next.width / cell);
      rows = Math.ceil(next.height / cell);
      shown = new Uint16Array(columns * rows);
      for (let index = 0; index < shown.length; index++) {
        shown[index] = Math.floor(random() * characters.length);
      }
      paintResting();
    },
    step(seconds) {
      time += seconds * speed;
      untilChange -= seconds * speed;
      if (untilChange <= 0 && shown.length > 0) {
        const context = restingContext();
        if (context) {
          for (let count = Math.ceil(shown.length * 0.01); count > 0; count--) {
            const index = Math.floor(random() * shown.length);
            shown[index] = Math.floor(random() * characters.length);
            drawResting(index, true);
          }
        }
        untilChange = 0.12;
      }
      trail = trail
        .map((mark) => ({ ...mark, age: mark.age + seconds }))
        .filter((mark) => mark.age < trailLife);
      ripples = ripples
        .map((mark) => ({ ...mark, age: mark.age + seconds }))
        .filter((mark) => mark.age < rippleLife);
    },
    settle() {
      for (let index = 0; index < 10; index++) this.step(1 / 30);
    },
    draw(context) {
      if (size.width === 0) return;
      context.drawImage(cache, 0, 0, size.width, size.height);
      const lights = Array.from({ length: glows }, (_, index) => glowAt(index));
      const reach = Math.min(size.width, size.height) * 0.22 + 80;
      context.font = fontAt();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = accent;
      for (let index = 0; index < shown.length; index++) {
        const { x, y } = middle(index);
        let light = 0;
        for (const glow of lights) {
          const distance = Math.hypot(x - glow.x, y - glow.y);
          if (distance < reach) light += 0.55 * (1 - distance / reach) ** 2;
        }
        for (const mark of trail) {
          const distance = Math.hypot(x - mark.x, y - mark.y);
          if (distance < trailReach) {
            light +=
              (1 - mark.age / trailLife) * (1 - distance / trailReach) * 0.6;
          }
        }
        for (const ripple of ripples) {
          const distance = Math.hypot(x - ripple.x, y - ripple.y);
          const off = Math.abs(distance - ripple.age * rippleSpeed);
          if (off < rippleBand) {
            light += (1 - ripple.age / rippleLife) * (1 - off / rippleBand);
          }
        }
        if (light < 0.05) continue;
        context.globalAlpha = Math.min(light, 1) * 0.85;
        context.fillText(characters[shown[index] ?? 0] ?? "", x, y);
      }
      context.globalAlpha = 1;
    },
    point(point) {
      if (!point) return;
      const last = trail[trail.length - 1];
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 8) {
        trail = [...trail.slice(-29), { ...point, age: 0 }];
      }
    },
    press(point) {
      ripples = [...ripples.slice(-3), { ...point, age: 0 }];
    },
  };
}
