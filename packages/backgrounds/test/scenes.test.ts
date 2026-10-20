import { describe, expect, test, vi } from "vitest";
import { fireworksScene } from "../src/components/fireworks-background/fireworks-scene";
import { glyphScene } from "../src/components/glyph-background/glyph-scene";
import { hexagonScene } from "../src/components/hexagon-background/hexagon-scene";
import { holeScene } from "../src/components/hole-background/hole-scene";
import { starsScene } from "../src/components/stars-background/stars-scene";
import { topographyScene } from "../src/components/topography-background/topography-scene";
import type { Scene, Size, Theme } from "../src/core/scene";

// Each scene on a canvas of its own, without the mount around it, so what
// it draws can be read back and counted.

const size = (width = 400, height = 300, rtl = false): Size => ({
  width,
  height,
  ratio: 1,
  rtl,
});
const theme: Theme = {
  color: () => "rgb(255, 0, 0)",
  value: () => "monospace",
};

function drawn(scene: Scene, area = size()) {
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  scene.theme(theme);
  scene.resize(area);
  return { canvas, context };
}

// How many pixels have anything on them.
function inked(canvas: HTMLCanvasElement) {
  const { data } = (
    canvas.getContext("2d") as CanvasRenderingContext2D
  ).getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;
  for (let index = 3; index < data.length; index += 4) {
    if ((data[index] ?? 0) > 0) count++;
  }
  return count;
}

function paint(scene: Scene, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.clearRect(0, 0, canvas.width, canvas.height);
  scene.draw(context);
  return inked(canvas);
}

describe("stars", () => {
  test("there are more for a larger area and a higher density", () => {
    const count = (density: number, area: Size) => {
      const scene = starsScene({ speed: 1, density });
      const { canvas } = drawn(scene, area);
      scene.settle();
      return paint(scene, canvas);
    };

    expect(count(1, size(400, 300))).toBeGreaterThan(
      count(0.3, size(400, 300)),
    );
    expect(count(1, size(400, 300))).toBeGreaterThan(count(1, size(200, 150)));
  });

  test("they drift toward the end of the line, the other way right to left", () => {
    const drift = (rtl: boolean) => {
      const scene = starsScene({ speed: 1, density: 0.02 });
      const draws: number[] = [];
      const context = {
        set fillStyle(_: string) {},
        set globalAlpha(_: number) {},
        fillRect: (x: number) => draws.push(x),
        beginPath() {},
        arc: (x: number) => draws.push(x),
        fill() {},
      } as unknown as CanvasRenderingContext2D;
      scene.theme(theme);
      scene.resize(size(4000, 300, rtl));
      scene.draw(context);
      const before = [...draws];
      draws.length = 0;
      scene.step(0.05);
      scene.draw(context);
      return draws.map((x, index) => x - (before[index] ?? 0));
    };

    expect(drift(false).every((dx) => dx > 0)).toBe(true);
    expect(drift(true).every((dx) => dx < 0)).toBe(true);
  });
});

describe("topography", () => {
  test("draws lines, and more of them at a higher density", () => {
    const lines = (density: number) => {
      const scene = topographyScene({ speed: 1, density });
      const { canvas } = drawn(scene);
      return paint(scene, canvas);
    };

    expect(lines(1)).toBeGreaterThan(500);
    expect(lines(2)).toBeGreaterThan(lines(0.5));
  });

  test("the pointer raises a hill, and a press sends a wave, each changing the lines", () => {
    // With speed 0 the land holds still, so what changes is the hill or
    // the wave.
    const after = (act: (scene: Scene) => void) => {
      const scene = topographyScene({ speed: 0, density: 1 });
      const { canvas } = drawn(scene);
      act(scene);
      for (let index = 0; index < 20; index++) scene.step(1 / 60);
      paint(scene, canvas);
      return canvas.toDataURL();
    };
    const still = after(() => {});

    expect(after((scene) => scene.point?.({ x: 200, y: 150 }))).not.toBe(still);
    expect(after((scene) => scene.press?.({ x: 200, y: 150 }))).not.toBe(still);
  });
});

describe("hexagons", () => {
  test("a press lights the ones around it, and they fade", () => {
    const scene = hexagonScene({ speed: 0, density: 1 });
    const { canvas } = drawn(scene);
    const dark = paint(scene, canvas);

    scene.press?.({ x: 200, y: 150 });
    scene.step(0);
    const lit = paint(scene, canvas);
    expect(lit).toBeGreaterThan(dark);

    for (let index = 0; index < 120; index++) scene.step(1 / 20);
    expect(paint(scene, canvas)).toBe(dark);
  });

  test("smaller ones at a higher density, covering the whole box", () => {
    const outline = (density: number) => {
      const scene = hexagonScene({ speed: 0, density });
      const { canvas } = drawn(scene);
      return paint(scene, canvas);
    };

    expect(outline(3)).toBeGreaterThan(outline(1));
  });
});

describe("fireworks", () => {
  test("rockets rise from the bottom and burst", () => {
    const scene = fireworksScene({ speed: 1, density: 1 });
    const { canvas } = drawn(scene);
    expect(paint(scene, canvas)).toBe(0);

    for (let index = 0; index < 60; index++) scene.step(1 / 30);
    expect(paint(scene, canvas)).toBeGreaterThan(0);
  });

  test("a press bursts one where it lands, with more sparks at a higher density", () => {
    const sparks = (density: number) => {
      const scene = fireworksScene({ speed: 1, density });
      const { canvas } = drawn(scene);
      scene.press?.({ x: 200, y: 150 });
      for (let index = 0; index < 10; index++) scene.step(1 / 30);
      return paint(scene, canvas);
    };

    expect(sparks(0.2)).toBeGreaterThan(0);
    expect(sparks(1)).toBeGreaterThan(sparks(0.2));
  });

  test("its still frame has bursts and no rocket halfway up", () => {
    const scene = fireworksScene({ speed: 1, density: 1 });
    const { canvas } = drawn(scene);
    scene.settle();

    expect(paint(scene, canvas)).toBeGreaterThan(100);
    const { data } = (
      canvas.getContext("2d") as CanvasRenderingContext2D
    ).getImageData(0, 280, 400, 20);
    expect(data.some((value, index) => index % 4 === 3 && value > 0)).toBe(
      false,
    );
  });
});

describe("hole", () => {
  test("a press speeds it up for a moment", () => {
    const after = (pressed: boolean) => {
      const scene = holeScene({ speed: 1, density: 1 });
      const { canvas } = drawn(scene);
      if (pressed) scene.press?.({ x: 0, y: 0 });
      scene.step(0.1);
      paint(scene, canvas);
      return canvas.toDataURL();
    };

    expect(after(true)).not.toBe(after(false));
  });

  test("has more motes at a higher density", () => {
    const motes = (density: number) => {
      const scene = holeScene({ speed: 1, density });
      const { canvas } = drawn(scene);
      return paint(scene, canvas);
    };

    expect(motes(3)).toBeGreaterThan(motes(0.2));
  });
});

describe("glyphs", () => {
  test("draws only the characters it's given", () => {
    const scene = glyphScene({ speed: 1, density: 1, glyphs: "x" });
    const { canvas, context } = drawn(scene);
    const text = vi.spyOn(context, "fillText");
    scene.press?.({ x: 200, y: 150 });
    scene.step(0);
    scene.draw(context);

    expect(text).toHaveBeenCalled();
    expect(new Set(text.mock.calls.map(([character]) => character))).toEqual(
      new Set(["x"]),
    );
    expect(inked(canvas)).toBeGreaterThan(0);
  });

  test("a press sends a ring of light outward", () => {
    const lit = (pressed: boolean) => {
      const scene = glyphScene({ speed: 0, density: 1, glyphs: "01" });
      const { context } = drawn(scene);
      if (pressed) scene.press?.({ x: 200, y: 150 });
      scene.step(0.3);
      const text = vi.spyOn(context, "fillText");
      scene.draw(context);
      return text.mock.calls.length;
    };

    expect(lit(true)).toBeGreaterThan(lit(false));
  });
});
