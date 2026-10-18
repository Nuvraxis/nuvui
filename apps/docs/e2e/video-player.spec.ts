import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="video-player/${name}"] > div:first-child`);
const player = (within: Locator) => within.locator(".nuv-video-player");
const time = (within: Locator) =>
  within.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime);
const bar = (within: Locator) => within.locator(".nuv-video-player__bar");

async function play(within: Locator, isMobile: boolean) {
  await within.scrollIntoViewIfNeeded();
  // The big button over the poster, before it first plays.
  await press(within.locator(".nuv-video-player__big-play"), isMobile);
  await expect.poll(() => time(within)).toBeGreaterThan(0.2);
}

test.describe("media start page", () => {
  test("says what to install, leads to the player, and has one", async ({
    page,
  }) => {
    await open(page, "/docs/media");
    const article = page.locator("article").first();
    await expect(
      article.getByText("pnpm add @nuvui/media @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "VideoPlayer", exact: true }),
    ).toHaveAttribute("href", "/docs/media/video-player");
    await expect(
      player(preview(page, "chapters")).locator(".nuv-media-seek__part"),
    ).toHaveCount(3);
  });
});

test.describe("video player page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/media/video-player");
  });

  test("the player is a region named by its title, and plays from the big button", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "basic");
    await expect(
      area.getByRole("region", { name: "Building a screen with nuvui" }),
    ).toBeVisible();
    await expect(area.locator("video")).toHaveJSProperty("controls", false);
    await play(area, isMobile);
  });

  test("captions are drawn in the theme, and the menu holds both languages", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "captions");
    await area.scrollIntoViewIfNeeded();
    await press(bar(area).getByRole("button", { name: "Settings" }), isMobile);
    await press(page.getByRole("menuitem", { name: /Captions/ }), isMobile);
    await expect(
      page.getByRole("menuitemradio", { name: "Español" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    await play(area, isMobile);
    await expect(area.locator(".nuv-video-player__cue").first()).toContainText(
      "This clip was made for the nuvui docs",
    );
  });

  test("chapters split the seek bar, and the preview names one with a frame", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A pointer that hovers.");
    const area = preview(page, "chapters");
    await area.scrollIntoViewIfNeeded();
    const seek = area.getByRole("slider", { name: "Seek" });
    await expect(seek.locator(".nuv-media-seek__part")).toHaveCount(3);
    const box = await seek.boundingBox();
    if (!box) throw new Error("no seek bar");
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
    const previewBox = area.locator(".nuv-media-seek__preview");
    await expect(previewBox).toBeVisible();
    await expect(previewBox).toContainText("Building the screen");
    await expect(area.locator(".nuv-media-seek__frame")).toHaveCSS(
      "background-image",
      /thumbnails\.jpg/,
    );
  });

  test("two qualities fill the quality menu", async ({ page, isMobile }) => {
    const area = preview(page, "qualities");
    await area.scrollIntoViewIfNeeded();
    await press(bar(area).getByRole("button", { name: "Settings" }), isMobile);
    await press(page.getByRole("menuitem", { name: /Quality/ }), isMobile);
    await expect(
      page.getByRole("menuitemradio", { name: "720p" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitemradio", { name: "360p" }),
    ).toBeVisible();
  });

  test("an HLS stream plays through hls.js, with its qualities in the menu", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "hls");
    await area.scrollIntoViewIfNeeded();
    await press(bar(area).getByRole("button", { name: "Settings" }), isMobile);
    await press(page.getByRole("menuitem", { name: /Quality/ }), isMobile);
    await expect(
      page.getByRole("menuitemradio", { name: "360p" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await play(area, isMobile);
  });

  test("a DASH stream plays through dashjs", async ({ page, isMobile }) => {
    const area = preview(page, "dash");
    await play(area, isMobile);
    expect(
      await area.locator("video").evaluate((v: HTMLVideoElement) => v.src),
    ).toMatch(/^blob:/);
  });

  test("with a facade, the video comes at the first press", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "facade");
    await area.scrollIntoViewIfNeeded();
    await expect(area.locator("video")).toHaveCount(0);
    await press(area.getByRole("button", { name: "Play" }), isMobile);
    await expect.poll(() => time(area)).toBeGreaterThan(0.2);
  });

  test("controls of your own replace the player's", async ({ page }) => {
    const area = preview(page, "custom");
    await expect(area.locator(".nuv-video-player__bar")).toHaveCount(0);
    await expect(
      area.getByRole("button", { name: "Back 10 seconds" }),
    ).toBeVisible();
    await expect(area.getByRole("slider", { name: "Seek" })).toBeVisible();
  });

  test("the keys work while the player has focus", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A keyboard.");
    const area = preview(page, "basic");
    await area.scrollIntoViewIfNeeded();
    await bar(area).getByRole("button", { name: "Play" }).focus();
    await page.keyboard.press("k");
    await expect.poll(() => time(area)).toBeGreaterThan(0.2);
    await page.keyboard.press("k");
    await expect(bar(area).getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("the playground's code follows its controls", async ({ page }) => {
    const area = page.locator("[data-playground]");
    // The player in the playground has a Captions button of its own.
    await area.getByRole("checkbox", { name: "ambient", exact: true }).check();
    await area
      .getByRole("checkbox", { name: "captions", exact: true })
      .uncheck();
    await expect(area.locator("pre")).toContainText("ambient");
    await expect(area.locator("pre")).not.toContainText("captions.en.vtt");
    await expect(area.locator(".nuv-video-player")).toHaveAttribute(
      "data-ambient",
      "",
    );
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
    const results = await new AxeBuilder({ page })
      .include('[data-preview="video-player/demo"] > div:first-child')
      .include('[data-preview="video-player/basic"] > div:first-child')
      .include('[data-preview="video-player/captions"] > div:first-child')
      .include('[data-preview="video-player/custom"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
