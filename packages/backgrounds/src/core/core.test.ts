import { afterEach, describe, expect, test, vi } from "vitest";
import { listening, onFrame } from "./loop";
import { noise3 } from "./noise";
import { between, seeded } from "./random";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("seeded", () => {
  test("gives the same numbers for the same seed, and others for another", () => {
    const take = (seed: number) => {
      const random = seeded(seed);
      return Array.from({ length: 5 }, () => random());
    };

    expect(take(7)).toEqual(take(7));
    expect(take(7)).not.toEqual(take(8));
  });

  test("stays from 0 up to 1, spread over all of it", () => {
    const random = seeded(1);
    const numbers = Array.from({ length: 2000 }, () => random());

    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...numbers)).toBeLessThan(1);
    expect(numbers.filter((n) => n < 0.5).length).toBeGreaterThan(900);
    expect(numbers.filter((n) => n < 0.5).length).toBeLessThan(1100);
    expect(between(() => 0.5, 10, 20)).toBe(15);
  });
});

describe("noise3", () => {
  const noise = noise3(3);

  test("stays near -1 to 1, and is the same for the same seed", () => {
    const values: number[] = [];
    for (let x = 0; x < 20; x += 0.37) {
      for (let y = 0; y < 20; y += 0.41) values.push(noise(x, y, 0.5));
    }

    expect(Math.min(...values)).toBeGreaterThan(-1.1);
    expect(Math.max(...values)).toBeLessThan(1.1);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.8);
    expect(noise3(3)(1.5, 2.5, 3.5)).toBe(noise(1.5, 2.5, 3.5));
  });

  test("changes smoothly, with nothing at the corners of its cells", () => {
    for (const at of [0, 1, 2.5, 7]) {
      const step = noise(at + 0.001, at, at) - noise(at, at, at);
      expect(Math.abs(step), String(at)).toBeLessThan(0.01);
    }
    // At a whole number every corner's weight is level, so the value is 0.
    expect(noise(4, 5, 6)).toBeCloseTo(0, 10);
  });
});

describe("onFrame", () => {
  test("every background shares one frame, and the loop stops with the last", async () => {
    const frames = vi.spyOn(window, "requestAnimationFrame");
    const first = vi.fn();
    const second = vi.fn();

    const stopFirst = onFrame(first);
    const stopSecond = onFrame(second);
    expect(listening()).toBe(2);
    await expect.poll(() => second.mock.calls.length).toBeGreaterThan(2);

    // One request a frame for both, and not one each.
    expect(frames.mock.calls.length).toBeLessThanOrEqual(
      first.mock.calls.length + 1,
    );
    stopFirst();
    stopSecond();
    expect(listening()).toBe(0);

    const calls = second.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(second.mock.calls.length).toBe(calls);
  });

  test("a tick that stops itself doesn't stop the others", async () => {
    const other = vi.fn();
    const stop = onFrame(() => stop());
    const stopOther = onFrame(other);

    await expect.poll(() => other.mock.calls.length).toBeGreaterThan(2);
    expect(listening()).toBe(1);
    stopOther();
  });
});
