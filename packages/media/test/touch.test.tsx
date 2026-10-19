import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AudioPlayer, VideoPlayer } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone.

const clip = new URL("./fixtures/clip.mp4", import.meta.url).href;
const tone = new URL("./fixtures/tone.mp3", import.meta.url).href;
const video = () =>
  document.querySelector(".nuv-video-player video") as HTMLVideoElement;
const root = () => document.querySelector(".nuv-video-player") as HTMLElement;
const surface = () =>
  document.querySelector(".nuv-video-player__surface") as HTMLElement;

async function loaded() {
  await expect
    .poll(() => video()?.readyState ?? 0, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_METADATA);
}

// A finger lifted at a share of the way across the picture.
function tap(across: number) {
  const box = surface().getBoundingClientRect();
  surface().dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      pointerType: "touch",
      isPrimary: true,
      clientX: box.left + box.width * across,
      clientY: box.top + box.height / 2,
    }),
  );
}

test("the controls are 44px each way, and the big button more", async () => {
  await render(<VideoPlayer title="Clip" src={clip} />);
  await loaded();
  for (const name of ["Mute", "Settings"]) {
    const box = page
      .elementLocator(
        document.querySelector(".nuv-video-player__bar") as HTMLElement,
      )
      .getByRole("button", { name })
      .element()
      .getBoundingClientRect();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const big = document
    .querySelector(".nuv-video-player__big-play")
    ?.getBoundingClientRect();
  expect(big?.width).toBeGreaterThanOrEqual(64);
});

test("the volume slider isn't there, since a phone's volume is in its buttons", async () => {
  await render(<VideoPlayer title="Clip" src={clip} />);
  await loaded();
  const slider = document.querySelector(".nuv-media-volume__slider") as Element;
  expect(getComputedStyle(slider).display).toBe("none");
});

test("the big button can be pressed in a short player, over the controls", async () => {
  await render(<VideoPlayer title="Clip" src={clip} defaultMuted />);
  await loaded();
  const big = document.querySelector(
    ".nuv-video-player__big-play",
  ) as HTMLElement;
  const box = big.getBoundingClientRect();
  expect(
    document
      .elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      ?.closest(".nuv-video-player__big-play"),
  ).toBe(big);
  await page.getByRole("button", { name: "Play" }).first().click();
  await expect.poll(() => video().paused).toBe(false);
});

test("a double tap on the right skips ahead and on the left back, with a mark, and a tap shows the controls", async () => {
  await render(<VideoPlayer title="Clip" src={clip} skip={2} defaultMuted />);
  await loaded();
  video().currentTime = 3;

  tap(0.85);
  tap(0.85);
  await expect.poll(() => video().currentTime).toBeCloseTo(5, 1);
  expect(
    document
      .querySelector(".nuv-video-player__ripple")
      ?.getAttribute("data-side"),
  ).toBe("ahead");

  await new Promise((resolve) => setTimeout(resolve, 400));
  tap(0.1);
  tap(0.1);
  await expect.poll(() => video().currentTime).toBeCloseTo(3, 1);

  // While it plays, a single tap hides the controls and another brings them back.
  await video().play();
  await new Promise((resolve) => setTimeout(resolve, 400));
  tap(0.5);
  await expect.poll(() => root().hasAttribute("data-controls")).toBe(false);
  tap(0.5);
  await expect.poll(() => root().hasAttribute("data-controls")).toBe(true);
});

test("a double tap doesn't go fullscreen", async () => {
  await render(<VideoPlayer title="Clip" src={clip} />);
  await loaded();
  tap(0.5);
  surface().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  expect(document.fullscreenElement).toBeNull();
});

test("a voice message's play button and speed are 44px to a finger, however small they look", async () => {
  await render(<AudioPlayer src={tone} layout="voice" />);
  await expect
    .poll(() => document.querySelector("audio")?.readyState ?? 0)
    .toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_METADATA);
  const play = page.getByRole("button", { name: "Play" }).element();
  expect(play.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
  expect(play.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  // The speed is drawn small, and answers a tap around it.
  const speed = page.getByRole("button", { name: /Speed/ }).element();
  const area = getComputedStyle(speed, "::after");
  expect(Number.parseFloat(area.width)).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(area.height)).toBeGreaterThanOrEqual(44);
});
