import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ModelViewer } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. What a mouse and a keyboard do is
// checked next to the component. Playwright can tap and can't drag, so
// turning the model with a finger is left to the end-to-end tests.

const rect = (element: Element) => element.getBoundingClientRect();

const webgl = (() => {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
})();

async function mount() {
  const onLoad = vi.fn();
  await render(
    <ModelViewer
      label="Box"
      src={new URL("./fixtures/box.glb", import.meta.url).href}
      onLoad={onLoad}
    />,
  );
  await expect
    .poll(() => onLoad.mock.calls.length, { timeout: 45_000 })
    .toBe(1);
}

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

test.skipIf(!webgl)("each button is 44 pixels each way", async () => {
  await mount();

  for (const name of ["Zoom in", "Zoom out", "Reset the view"]) {
    const button = rect(page.getByRole("button", { name }).element());
    expect(button.width).toBe(44);
    expect(button.height).toBe(44);
  }
});

test.skipIf(!webgl)("a tap on a button zooms", async () => {
  await mount();
  const zoomOut = page.getByRole("button", { name: "Zoom out" });
  const reset = page.getByRole("button", { name: "Reset the view" });

  for (let i = 0; i < 30; i++) {
    if ((zoomOut.element() as HTMLButtonElement).disabled) break;
    await zoomOut.click();
  }
  await expect.element(zoomOut).toBeDisabled();
  await reset.click();
  await expect.element(zoomOut).toBeEnabled();
});

test.skipIf(!webgl)(
  "the canvas takes every finger, so the page doesn't scroll under a turn",
  async () => {
    await mount();
    const canvas = document.querySelector(
      ".nuv-model-viewer canvas",
    ) as Element;

    expect(getComputedStyle(canvas).touchAction).toBe("none");
  },
);

test.skipIf(!webgl)("the viewer fits a phone's width", async () => {
  await mount();
  const root = document.querySelector(".nuv-model-viewer") as Element;

  expect(rect(root).right).toBeLessThanOrEqual(window.innerWidth);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
});
