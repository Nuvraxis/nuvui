import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { burstConfetti } from "./confetti";

const canvases = () => document.querySelectorAll("canvas.nuv-confetti");
const canvas = () =>
  document.querySelector("canvas.nuv-confetti") as HTMLCanvasElement | null;
const style = (element: Element) => getComputedStyle(element);
const button = () => page.getByRole("button", { name: "Finish" }).element();

// The colors the pieces are filled with, as the canvas writes them.
function watchFills() {
  const fills = new Set<string>();
  const prototype = CanvasRenderingContext2D.prototype;
  const fillRect = prototype.fillRect;
  const fill = prototype.fill;
  vi.spyOn(prototype, "fillRect").mockImplementation(function (
    this: CanvasRenderingContext2D,
    ...rest: Parameters<CanvasRenderingContext2D["fillRect"]>
  ) {
    fills.add(String(this.fillStyle));
    fillRect.apply(this, rest);
  });
  vi.spyOn(prototype, "fill").mockImplementation(function (
    this: CanvasRenderingContext2D,
    ...rest: unknown[]
  ) {
    fills.add(String(this.fillStyle));
    (fill as (...args: unknown[]) => void).apply(this, rest);
  });
  return fills;
}

// A frame or two, for the pieces to be drawn.
const frames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a burst", () => {
  test("is drawn on one canvas over the page, hidden from screen readers and never in the way", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const onClick = vi.fn();
    await render(
      <button type="button" onClick={onClick}>
        Finish
      </button>,
    );

    const done = burstConfetti(button());

    const layer = canvas() as HTMLCanvasElement;
    expect(layer).not.toBeNull();
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(layer.parentElement).toBe(document.body);
    expect(style(layer).position).toBe("fixed");
    expect(style(layer).pointerEvents).toBe("none");
    const box = layer.getBoundingClientRect();
    expect(box.width).toBe(window.innerWidth);
    expect(box.height).toBe(window.innerHeight);
    // Over toasts, which are over everything else.
    expect(Number(style(layer).zIndex)).toBeGreaterThan(1200);

    // A press goes through it to what's under it.
    await userEvent.click(page.getByRole("button", { name: "Finish" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    await done;
  });

  test("is gone from the page when its last piece is, and the promise says so", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<button type="button">Finish</button>);

    await burstConfetti(button(), { count: 20 });

    expect(canvases()).toHaveLength(0);
  }, 10_000);

  test("two at once share the canvas", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<button type="button">Finish</button>);

    const first = burstConfetti(button(), { count: 10 });
    const second = burstConfetti(button(), { count: 10 });

    expect(canvases()).toHaveLength(1);
    await Promise.all([first, second]);
    expect(canvases()).toHaveLength(0);
  }, 10_000);

  test("takes the theme's chart colors from where the target is", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const fills = watchFills();
    await render(
      <div style={{ "--color-chart-1": "rgb(1, 2, 3)" } as never}>
        <button type="button">Finish</button>
      </div>,
    );

    const done = burstConfetti(button(), { count: 40 });
    await frames();

    expect(fills.has("#010203")).toBe(true);
    await done;
  }, 10_000);

  test("takes the colors it's given, and leaves out one a canvas can't draw", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const fills = watchFills();
    await render(<button type="button">Finish</button>);

    const done = burstConfetti(button(), {
      count: 20,
      colors: ["rgb(255, 0, 0)", "not a color"],
    });
    await frames();

    expect([...fills]).toEqual(["#ff0000"]);
    await done;
  }, 10_000);
});

test("a color given as a variable is read where the target is", async () => {
  await emulateMedia({ reducedMotion: "no-preference" });
  const fills = watchFills();
  await render(
    <div style={{ "--mine": "rgb(4, 5, 6)" } as never}>
      <button type="button">Finish</button>
    </div>,
  );

  const done = burstConfetti(button(), { count: 20, colors: ["var(--mine)"] });
  await frames();

  expect([...fills]).toEqual(["#040506"]);
  await done;
}, 10_000);

describe("when there's nothing to throw", () => {
  test("for anyone who asked for less motion", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<button type="button">Finish</button>);

    await burstConfetti(button());

    expect(canvases()).toHaveLength(0);
  });

  test("where the browser forces its own colors", async ({ skip }) => {
    await emulateMedia({ forcedColors: "active", reducedMotion: null });
    if (!matchMedia("(forced-colors: active)").matches) {
      skip("this browser can't be made to force colors");
    }
    await render(<button type="button">Finish</button>);

    await burstConfetti(button());

    expect(canvases()).toHaveLength(0);
  });

  test("for a count of none, or a target that isn't drawn", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <>
        <button type="button">Finish</button>
        <button type="button" hidden>
          Hidden
        </button>
      </>,
    );

    await burstConfetti(button(), { count: 0 });
    await burstConfetti(
      document.querySelector("button[hidden]") as HTMLButtonElement,
    );

    expect(canvases()).toHaveLength(0);
  });
});
