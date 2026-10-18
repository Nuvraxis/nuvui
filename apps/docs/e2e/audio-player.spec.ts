import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const time = (audio: Locator) =>
  audio.evaluate((element: HTMLAudioElement) => element.currentTime);

test.describe("audio player page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/media/audio-player");
  });

  test("the player is a region named by its title, and plays from its button", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "audio-player/basic");
    const player = area.getByRole("region", {
      name: "Demo track",
    });
    await expect(player).toBeVisible();
    await expect(player.locator("audio")).toHaveJSProperty("controls", false);
    await press(player.getByRole("button", { name: "Play" }), isMobile);
    await expect.poll(() => time(player.locator("audio"))).toBeGreaterThan(0.2);
  });

  test("the podcast has its artwork and title, and the waveform once its peaks have come", async ({
    page,
  }) => {
    const area = preview(page, "audio-player/podcast");
    await area.scrollIntoViewIfNeeded();
    await expect(area.locator(".nuv-audio-player__artwork")).toBeVisible();
    await expect(area.locator(".nuv-audio-player__title")).toHaveText(
      "Demo track",
    );
    await expect(
      area.locator(".nuv-media-waveform rect").first(),
    ).toBeAttached();
    for (const name of ["Back 15 seconds", "Ahead 30 seconds"]) {
      await expect(area.getByRole("button", { name })).toBeVisible();
    }
  });

  test("voice messages have their peaks worked out in the browser, and starting one pauses the other", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "audio-player/voice");
    await area.scrollIntoViewIfNeeded();
    const first = area.getByRole("region", { name: "Voice message from Ana" });
    const second = area.getByRole("region", { name: "Your voice message" });
    await expect(
      first.locator(".nuv-media-waveform rect").first(),
    ).toBeAttached();
    await expect(
      second.locator(".nuv-media-waveform rect").first(),
    ).toBeAttached();
    await press(first.getByRole("button", { name: "Play" }), isMobile);
    await expect.poll(() => time(first.locator("audio"))).toBeGreaterThan(0.2);
    await press(second.getByRole("button", { name: "Play" }), isMobile);
    await expect(first.getByRole("button", { name: "Play" })).toBeVisible();
    await expect(second.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("controls of your own replace the player's", async ({ page }) => {
    const area = preview(page, "audio-player/custom");
    await expect(area.locator(".nuv-audio-player__bar")).toHaveCount(0);
    await expect(
      area.getByRole("button", { name: "Back 15 seconds" }),
    ).toBeVisible();
  });

  test("the keys work while the player has focus", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A keyboard.");
    const player = preview(page, "audio-player/basic").locator(
      ".nuv-audio-player",
    );
    await player.getByRole("button", { name: "Play" }).focus();
    await page.keyboard.press("k");
    await expect.poll(() => time(player.locator("audio"))).toBeGreaterThan(0.2);
    await page.keyboard.press("k");
    await expect(player.getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("the playground's code follows its controls", async ({ page }) => {
    const area = page.locator("[data-playground]");
    await area
      .getByRole("combobox", { name: "layout" })
      .selectOption("podcast");
    await expect(area.locator("pre")).toContainText('layout="podcast"');
    await expect(area.locator(".nuv-audio-player__artwork")).toBeVisible();
    await area
      .getByRole("checkbox", { name: "waveform", exact: true })
      .uncheck();
    await expect(area.locator("pre")).not.toContainText("peaks");
    await expect(area.locator(".nuv-media-waveform")).toHaveCount(0);
  });

  test("the page doesn't scroll sideways on a phone", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "A phone's width.");
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(width).toBeLessThanOrEqual(0);
  });

  test("passes axe", async ({ page }) => {
    await expect(
      preview(page, "audio-player/voice").locator(".nuv-media-waveform rect"),
    ).not.toHaveCount(0);
    const results = await new AxeBuilder({ page })
      .include('[data-preview="audio-player/basic"] > div:first-child')
      .include('[data-preview="audio-player/podcast"] > div:first-child')
      .include('[data-preview="audio-player/voice"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("transcript page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/media/media-transcript");
  });

  test("beside the video, its lines read the captions while they're off, and a press on one plays from there", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "media-transcript/video");
    await area.scrollIntoViewIfNeeded();
    const transcript = area.getByRole("region", { name: "Transcript" });
    const lines = transcript.locator(".nuv-media-transcript__line");
    await expect(lines).toHaveCount(6);
    await press(lines.nth(3), isMobile);
    await expect
      .poll(() => time(area.locator("video")))
      .toBeGreaterThanOrEqual(12);
    await expect(lines.nth(3)).toHaveAttribute("aria-current", "time");
  });

  test("passes axe", async ({ page }) => {
    await expect(
      preview(page, "media-transcript/video").locator(
        ".nuv-media-transcript__line",
      ),
    ).toHaveCount(6);
    const results = await new AxeBuilder({ page })
      .include('[data-preview="media-transcript/video"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
