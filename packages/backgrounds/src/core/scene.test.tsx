import "@nuvui/react/styles.css";
import "../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { listening } from "./loop";
import { type MountOptions, mountScene, type Scene, type Theme } from "./scene";

// A scene that only notes what it's asked to do.
function fakeScene() {
  const scene = {
    theme: vi.fn<(theme: Theme) => void>(),
    resize: vi.fn(),
    step: vi.fn(),
    draw: vi.fn<(context: CanvasRenderingContext2D) => void>(
      (context: CanvasRenderingContext2D) => {
        context.fillRect(0, 0, 10, 10);
      },
    ),
    settle: vi.fn(),
    point: vi.fn(),
    press: vi.fn(),
  } satisfies Scene;
  return scene;
}

const cleanups: (() => void)[] = [];
beforeEach(async () => {
  // WebKit on Linux asks for less motion unless it's told otherwise.
  await emulateMedia({ reducedMotion: "no-preference" });
});

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.documentElement.removeAttribute("data-theme");
  await emulateMedia({ reducedMotion: null, forcedColors: null });
});

function mount(
  options: Partial<MountOptions> = {},
  { top = 0, children = "" } = {},
) {
  const root = document.createElement("div");
  root.className = "nuv-background";
  root.style.cssText = `inline-size: 300px; block-size: 200px; margin-block-start: ${top}px`;
  root.innerHTML = `<span class="nuv-background__layer"><canvas class="nuv-background__canvas"></canvas></span>${children}`;
  document.body.append(root);
  const canvas = root.querySelector("canvas") as HTMLCanvasElement;
  const scene = fakeScene();
  const mounted = mountScene(root, canvas, scene, {
    paused: false,
    interactive: true,
    ...options,
  });
  cleanups.push(() => {
    mounted.destroy();
    root.remove();
  });
  return { root, canvas, scene, mounted };
}

const pointer = (type: string, target: Element, x = 50, y = 40) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: target.getBoundingClientRect().left + x,
      clientY: target.getBoundingClientRect().top + y,
      isPrimary: true,
    }),
  );

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("drawing", () => {
  test("reads the theme, lays out, settles and draws before any frame", () => {
    const { scene, canvas } = mount();

    expect(scene.theme).toHaveBeenCalledTimes(1);
    expect(scene.resize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 300, height: 200, rtl: false }),
    );
    expect(scene.settle).toHaveBeenCalledTimes(1);
    expect(scene.draw).toHaveBeenCalled();
    const ratio = Math.min(window.devicePixelRatio, 2);
    expect(canvas.width).toBe(Math.round(300 * ratio));
  });

  test("a color is read where the background is, from any variable", () => {
    const root = document.createElement("div");
    root.style.setProperty("--nuv-background-ink", "rgb(1, 2, 3)");
    root.innerHTML = "<canvas></canvas>";
    root.style.cssText += "; inline-size: 50px; block-size: 50px";
    document.body.append(root);
    let read = "";
    const scene: Scene = {
      ...fakeScene(),
      theme(theme) {
        read = theme.color("--nuv-background-ink");
      },
    };
    const mounted = mountScene(
      root,
      root.querySelector("canvas") as HTMLCanvasElement,
      scene,
      { paused: true, interactive: false },
    );
    mounted.destroy();
    root.remove();

    expect(read).toBe("rgb(1, 2, 3)");
  });

  test("runs frames while it's seen, and stops them for paused", async () => {
    const { scene, mounted } = mount();
    await expect.poll(() => scene.step.mock.calls.length).toBeGreaterThan(3);
    // The first frame has nothing before it to measure from, and none is
    // longer than a twentieth of a second.
    for (const [seconds] of scene.step.mock.calls) {
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThanOrEqual(1 / 20);
    }

    mounted.update({ paused: true, interactive: true });
    const calls = scene.step.mock.calls.length;
    await wait(150);
    expect(scene.step.mock.calls.length).toBe(calls);

    mounted.update({ paused: false, interactive: true });
    await expect
      .poll(() => scene.step.mock.calls.length)
      .toBeGreaterThan(calls + 2);
  });

  test("runs no frames while it's out of view", async () => {
    const { scene, root } = mount({}, { top: 5000 });
    await wait(150);
    expect(scene.step).not.toHaveBeenCalled();

    root.scrollIntoView();
    await expect.poll(() => scene.step.mock.calls.length).toBeGreaterThan(2);
    window.scrollTo(0, 0);
  });

  test("lets go of its frame when it's taken away", async () => {
    const { scene, mounted } = mount();
    await expect.poll(() => scene.step.mock.calls.length).toBeGreaterThan(1);
    mounted.destroy();

    expect(listening()).toBe(0);
  });

  test("lays out again when its box changes size", async () => {
    const { scene, root } = mount();
    root.style.inlineSize = "200px";

    await expect
      .poll(() => scene.resize.mock.calls.at(-1)?.[0]?.width)
      .toBe(200);
  });

  test("reads the theme again when the page's theme changes", async () => {
    const { scene } = mount();
    document.documentElement.setAttribute("data-theme", "dark");

    await expect.poll(() => scene.theme.mock.calls.length).toBe(2);
  });

  test("knows when the page reads right to left", async () => {
    const { scene, root } = mount();
    root.setAttribute("dir", "rtl");

    await expect
      .poll(() => scene.resize.mock.calls.at(-1)?.[0]?.rtl)
      .toBe(true);
  });
});

describe("less motion and forced colors", () => {
  test("for less motion it draws a settled frame and runs no frames", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const { scene } = mount();
    await wait(150);

    expect(scene.settle).toHaveBeenCalled();
    expect(scene.draw).toHaveBeenCalled();
    expect(scene.step).not.toHaveBeenCalled();
  });

  test("for less motion the pointer moves nothing", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const { scene, root } = mount();
    pointer("pointermove", root);
    pointer("pointerdown", root);

    expect(scene.point).not.toHaveBeenCalled();
    expect(scene.press).not.toHaveBeenCalled();
  });

  test("where the browser forces its colors, nothing is drawn", async ({
    skip,
  }) => {
    await emulateMedia({ forcedColors: "active" });
    if (!matchMedia("(forced-colors: active)").matches) {
      skip("this browser doesn't report forced colors");
    }
    const { scene, canvas } = mount();
    await wait(100);

    expect(scene.draw).not.toHaveBeenCalled();
    expect(scene.step).not.toHaveBeenCalled();
    const layer = canvas.parentElement as HTMLElement;
    expect(getComputedStyle(layer).display).toBe("none");
  });
});

describe("the pointer", () => {
  test("is followed over the background and over what's laid on it", () => {
    const { scene, root } = mount({}, { children: "<p>Text on top</p>" });
    pointer("pointermove", root.querySelector("p") as Element, 10, 5);

    const point = scene.point.mock.calls.at(-1)?.[0];
    const text = root.querySelector("p")?.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    expect(point?.x).toBeCloseTo((text?.left ?? 0) - box.left + 10, 0);
    expect(point?.y).toBeCloseTo((text?.top ?? 0) - box.top + 5, 0);

    pointer("pointerleave", root);
    expect(scene.point).toHaveBeenLastCalledWith(null);
  });

  test("a press on the background or its text is the scene's, but one on a control isn't", () => {
    const { scene, root } = mount(
      {},
      {
        children:
          "<p>Text</p><button type='button'>Go</button><a href='#x'>Link</a>",
      },
    );
    pointer("pointerdown", root.querySelector("p") as Element);
    pointer("pointerdown", root.querySelector("button") as Element);
    pointer("pointerdown", root.querySelector("a") as Element);
    pointer("pointerdown", root);

    expect(scene.press).toHaveBeenCalledTimes(2);
  });

  test("isn't followed with interactive off", () => {
    const { scene, root, mounted } = mount({ interactive: false });
    pointer("pointermove", root);
    pointer("pointerdown", root);
    expect(scene.point).not.toHaveBeenCalled();
    expect(scene.press).not.toHaveBeenCalled();

    mounted.update({ paused: false, interactive: true });
    pointer("pointermove", root);
    expect(scene.point).toHaveBeenCalled();
  });

  test("a press shows while paused", () => {
    const { scene, root } = mount({ paused: true });
    const draws = scene.draw.mock.calls.length;
    pointer("pointerdown", root);

    expect(scene.press).toHaveBeenCalled();
    expect(scene.draw.mock.calls.length).toBe(draws + 1);
  });
});
