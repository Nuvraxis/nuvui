import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MapControls, MapMarker, type MapStyle, MapView } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. What a mouse and a keyboard do is
// checked next to the component.

const rect = (element: Element) => element.getBoundingClientRect();

const blank: MapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "land",
      type: "background",
      paint: { "background-color": "#dfe7ec" },
    },
  ],
};

const webgl = (() => {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
})();

async function mount() {
  const onLoad = vi.fn();
  await render(
    <MapView
      mapStyle={blank}
      aria-label="Offices"
      defaultCenter={[13.405, 52.52]}
      defaultZoom={10}
      onLoad={onLoad}
    >
      <MapMarker
        position={[13.405, 52.52]}
        label="Berlin office"
        popup="Friedrichstraße 68"
      />
      <MapControls compass />
    </MapView>,
  );
  await expect
    .poll(() => onLoad.mock.calls.length, { timeout: 20_000 })
    .toBe(1);
}

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

test.skipIf(!webgl)("each control is 44 pixels each way", async () => {
  await mount();

  for (const name of ["Zoom in", "Zoom out", "Turn north up"]) {
    const button = rect(page.getByRole("button", { name }).element());
    expect(button.width).toBe(44);
    expect(button.height).toBe(44);
  }
});

test.skipIf(!webgl)(
  "a marker takes a tap over 44 pixels each way, whatever size it's drawn",
  async () => {
    await mount();
    const marker = page
      .getByRole("button", { name: "Berlin office" })
      .element();
    const area = getComputedStyle(marker, "::after");

    expect(Number.parseFloat(area.width)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(area.height)).toBeGreaterThanOrEqual(44);
  },
);

test.skipIf(!webgl)("a tap on a marker opens its popup", async () => {
  await mount();

  await page.getByRole("button", { name: "Berlin office" }).click();

  await expect
    .element(page.getByRole("dialog", { name: "Berlin office" }))
    .toBeVisible();
});

test.skipIf(!webgl)(
  "the popup's close button takes a tap over 44 pixels each way",
  async () => {
    await mount();
    await page.getByRole("button", { name: "Berlin office" }).click();
    const close = page.getByRole("button", { name: "Close" }).element();
    const area = getComputedStyle(close, "::after");

    expect(Number.parseFloat(area.width)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(area.height)).toBeGreaterThanOrEqual(44);
  },
);

test.skipIf(!webgl)("the map fits a phone's width", async () => {
  await mount();
  const root = document.querySelector(".nuv-map") as Element;

  expect(rect(root).right).toBeLessThanOrEqual(window.innerWidth);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
});
