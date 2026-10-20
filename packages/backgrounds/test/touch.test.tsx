import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { GlyphBackground, GridBackground } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone.

const size = { inlineSize: 390, blockSize: 600 };
const root = () => document.querySelector(".nuv-background") as HTMLElement;

function tap(x: number, y: number) {
  const box = root().getBoundingClientRect();
  root().dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      pointerType: "touch",
      isPrimary: true,
      clientX: box.left + x,
      clientY: box.top + y,
    }),
  );
}

test("a background leaves scrolling and zooming to the browser", async () => {
  await render(<GlyphBackground style={size} />);

  expect(getComputedStyle(root()).touchAction).toBe("auto");
  const layer = root().querySelector(".nuv-background__layer") as Element;
  expect(getComputedStyle(layer).pointerEvents).toBe("none");
});

test("a tap answers as a press does", async () => {
  await render(<GlyphBackground style={size} paused />);
  const canvas = root().querySelector("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  const drawn = () =>
    context
      .getImageData(0, 0, canvas.width, canvas.height)
      .data.some((value, index) => index % 4 === 3 && value > 0);
  await expect.poll(drawn).toBe(true);
  const before = canvas.toDataURL();

  tap(200, 300);

  await expect.poll(() => canvas.toDataURL()).not.toBe(before);
});

test("the grid lights where a finger is", async () => {
  await render(<GridBackground style={size} />);
  tap(100, 100);

  await expect.poll(() => root().hasAttribute("data-lit")).toBe(true);
});
