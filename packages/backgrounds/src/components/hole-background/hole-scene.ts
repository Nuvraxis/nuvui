import { between, seeded } from "../../core/random";
import type { Point, Scene, Size } from "../../core/scene";

export interface HoleSettings {
  speed: number;
  density: number;
}

interface Mote {
  angle: number;
  /** How far across the tunnel it is, from the middle to the wall. */
  across: number;
  /** How far along the tunnel it is, from 0 deep in it to 1 at the mouth. */
  depth: number;
  size: number;
}

const rings = 18;
const spokes = 24;
// Rings are seen from a little above, so each is an ellipse this much as
// tall as it's wide.
const tilt = 0.55;

/**
 * A tunnel of rings receding into the distance, with motes rising through
 * it toward the viewer. The far end leans toward the pointer, and a press
 * speeds it up for a moment.
 */
export function holeScene({ speed, density }: HoleSettings): Scene {
  const random = seeded(9);
  let size: Size = { width: 0, height: 0, ratio: 1, rtl: false };
  let ink = "";
  let accent = "";
  let phase = 0;
  let motes: Mote[] = [];
  let lean: Point = { x: 0, y: 0 };
  let leanTo: Point = { x: 0, y: 0 };
  let boost = 0;

  const center = () => ({
    x: size.width / 2 + lean.x,
    y: size.height * 0.4 + lean.y,
  });
  const far = () => Math.min(size.width, size.height) * 0.02;
  const near = () => Math.hypot(size.width, size.height) * 0.8;
  // Nearer rings are further apart, as in a real tunnel.
  const radiusAt = (depth: number) => far() + (near() - far()) * depth ** 2.4;

  const newMote = (depth = 0): Mote => ({
    angle: random() * Math.PI * 2,
    across: between(random, 0.15, 0.85),
    depth,
    size: between(random, 0.6, 1.6),
  });

  return {
    theme(theme) {
      ink = theme.color("--nuv-background-ink");
      accent = theme.color("--nuv-background-accent");
    },
    resize(next) {
      size = next;
      const count = Math.round(70 * Math.max(density, 0.1));
      while (motes.length < count) motes.push(newMote(random()));
      motes = motes.slice(0, count);
    },
    step(seconds) {
      boost *= Math.exp(-seconds * 2);
      const pace = seconds * speed * (1 + boost);
      phase = (phase + pace * 0.06) % (1 / rings);
      for (const mote of motes) {
        mote.depth += pace * 0.12 * (0.6 + mote.size * 0.4);
        if (mote.depth >= 1) Object.assign(mote, newMote());
      }
      const ease = 1 - Math.exp(-seconds * 2.5);
      lean = {
        x: lean.x + (leanTo.x - lean.x) * ease,
        y: lean.y + (leanTo.y - lean.y) * ease,
      };
    },
    settle() {
      for (let index = 0; index < 20; index++) this.step(1 / 30);
    },
    draw(context) {
      if (size.width === 0) return;
      const { x, y } = center();
      context.lineWidth = 1;
      context.strokeStyle = ink;

      // Spokes along the walls, faint, and fainter toward the far end.
      for (let index = 0; index < spokes; index++) {
        const angle = (index / spokes) * Math.PI * 2;
        const from = radiusAt(0.25);
        const to = near();
        context.globalAlpha = 0.18;
        context.beginPath();
        context.moveTo(
          x + Math.cos(angle) * from,
          y + Math.sin(angle) * from * tilt,
        );
        context.lineTo(
          x + Math.cos(angle) * to,
          y + Math.sin(angle) * to * tilt,
        );
        context.stroke();
      }

      for (let index = 0; index < rings; index++) {
        const depth = index / rings + phase;
        const radius = radiusAt(depth);
        // Out of the dark at the far end, and gone past the mouth.
        context.globalAlpha = 0.55 * Math.min(1, depth / 0.2);
        context.beginPath();
        context.ellipse(x, y, radius, radius * tilt, 0, 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = accent;
      for (const mote of motes) {
        const radius = radiusAt(mote.depth) * mote.across;
        const mx = x + Math.cos(mote.angle) * radius;
        const my = y + Math.sin(mote.angle) * radius * tilt;
        const dot = mote.size * (0.4 + mote.depth * 1.6);
        context.globalAlpha =
          0.8 * Math.min(1, mote.depth / 0.15) * (1 - mote.depth) ** 0.5;
        context.fillRect(mx - dot / 2, my - dot / 2, dot, dot);
      }
      context.globalAlpha = 1;
    },
    point(point) {
      leanTo = point
        ? {
            x: (point.x - size.width / 2) * 0.08,
            y: (point.y - size.height * 0.4) * 0.08,
          }
        : { x: 0, y: 0 };
    },
    press() {
      boost = 3;
    },
  };
}
