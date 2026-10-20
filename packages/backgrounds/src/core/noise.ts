import { seeded } from "./random";

// Gradient noise in three dimensions: a value at every point that changes
// smoothly from one point to the next, with no pattern that repeats. The
// third dimension is time, so a slice of it drifts. Each corner of a unit
// cube has a direction, picked from the twelve that point at a cube's
// edges, and a point's value is the corners' directions weighed by how near
// it is to each.
const directions = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
] as const;

// Eases a fraction so the value's slope is level at each corner, which is
// what keeps cells from showing.
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A noise function, from about -1 to 1, the same for the same seed. */
export function noise3(seed = 1): (x: number, y: number, z: number) => number {
  const random = seeded(seed);
  const order = Array.from({ length: 256 }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other] ?? 0, order[index] ?? 0];
  }
  // Twice over, so a corner's index never has to wrap.
  const table = new Uint8Array(512);
  for (let index = 0; index < 512; index++)
    table[index] = order[index & 255] ?? 0;

  const corner = (
    x: number,
    y: number,
    z: number,
    dx: number,
    dy: number,
    dz: number,
  ) => {
    const hash =
      table[(table[(table[x & 255] ?? 0) + (y & 255)] ?? 0) + (z & 255)] ?? 0;
    const [gx, gy, gz] = directions[hash % 12] ?? directions[0];
    return gx * dx + gy * dy + gz * dz;
  };

  return (x, y, z) => {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    const cz = Math.floor(z);
    const fx = x - cx;
    const fy = y - cy;
    const fz = z - cz;
    const u = ease(fx);
    const v = ease(fy);
    const w = ease(fz);
    return mix(
      mix(
        mix(
          corner(cx, cy, cz, fx, fy, fz),
          corner(cx + 1, cy, cz, fx - 1, fy, fz),
          u,
        ),
        mix(
          corner(cx, cy + 1, cz, fx, fy - 1, fz),
          corner(cx + 1, cy + 1, cz, fx - 1, fy - 1, fz),
          u,
        ),
        v,
      ),
      mix(
        mix(
          corner(cx, cy, cz + 1, fx, fy, fz - 1),
          corner(cx + 1, cy, cz + 1, fx - 1, fy, fz - 1),
          u,
        ),
        mix(
          corner(cx, cy + 1, cz + 1, fx, fy - 1, fz - 1),
          corner(cx + 1, cy + 1, cz + 1, fx - 1, fy - 1, fz - 1),
          u,
        ),
        v,
      ),
      w,
    );
  };
}
