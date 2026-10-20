/**
 * Numbers from 0 up to 1 that come out the same for the same seed, so a
 * background's still frame is the same on every visit and in every test.
 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number between `min` and `max` from `random`. */
export const between = (random: () => number, min: number, max: number) =>
  min + (max - min) * random();
