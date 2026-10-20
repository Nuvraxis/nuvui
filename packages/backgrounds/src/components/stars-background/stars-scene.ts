import { between, seeded } from "../../core/random";
import type { Point, Scene, Size } from "../../core/scene";

export interface StarsSettings {
  speed: number;
  density: number;
}

interface Star {
  x: number;
  y: number;
  /** How near it is, from 0.2 far away to 1 near: nearer is larger, brighter and faster. */
  depth: number;
  phase: number;
  rate: number;
}

// One star for this many square CSS pixels, at a density of 1.
const areaPerStar = 4000;
// The brightest a star is drawn, so text on a strong scrim still reads.
const brightest = 0.8;

/** Dots of several sizes drifting at several speeds, nearer ones faster. */
export function starsScene({ speed, density }: StarsSettings): Scene {
  const random = seeded(7);
  let size: Size = { width: 0, height: 0, ratio: 1, rtl: false };
  let stars: Star[] = [];
  let color = "";
  let time = 0;
  // Where the pointer pulls the field, and where it is on the way there.
  let aim = { x: 0, y: 0 };
  let shift = { x: 0, y: 0 };

  const wrap = (value: number, length: number) =>
    ((value % length) + length) % length;

  return {
    theme(theme) {
      color = theme.color("--nuv-background-ink");
    },
    resize(next) {
      const count = Math.round(
        (next.width * next.height * Math.max(density, 0)) / areaPerStar,
      );
      // A new size keeps the stars there are, spread over the new area,
      // and adds or drops some to keep the density.
      const scaleX = size.width > 0 ? next.width / size.width : 1;
      const scaleY = size.height > 0 ? next.height / size.height : 1;
      stars = stars.slice(0, count).map((star) => ({
        ...star,
        x: star.x * scaleX,
        y: star.y * scaleY,
      }));
      while (stars.length < count) {
        stars.push({
          x: random() * next.width,
          y: random() * next.height,
          depth: 0.2 + 0.8 * random() ** 2,
          phase: random() * Math.PI * 2,
          rate: between(random, 0.6, 1.8),
        });
      }
      size = next;
    },
    step(seconds) {
      time += seconds;
      // Toward the end of the line, the way the page reads.
      const way = size.rtl ? -1 : 1;
      for (const star of stars) {
        star.x = wrap(
          star.x + way * seconds * speed * (4 + star.depth * 16),
          size.width,
        );
      }
      const ease = 1 - Math.exp(-seconds * 3);
      shift = {
        x: shift.x + (aim.x - shift.x) * ease,
        y: shift.y + (aim.y - shift.y) * ease,
      };
    },
    settle() {
      for (let index = 0; index < 30; index++) this.step(1 / 30);
    },
    draw(context) {
      context.fillStyle = color;
      for (const star of stars) {
        const twinkle = 0.75 + 0.25 * Math.sin(star.phase + time * star.rate);
        context.globalAlpha = brightest * (0.3 + 0.7 * star.depth) * twinkle;
        const x = wrap(star.x + shift.x * star.depth, size.width);
        const y = wrap(star.y + shift.y * star.depth, size.height);
        const radius = 0.5 + star.depth * 1.1;
        if (radius < 1) {
          context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        } else {
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
    },
    point(point: Point | null) {
      // The near stars lean away from the pointer a little, which reads
      // as depth.
      aim = point
        ? {
            x: (size.width / 2 - point.x) * 0.04,
            y: (size.height / 2 - point.y) * 0.04,
          }
        : { x: 0, y: 0 };
    },
  };
}
