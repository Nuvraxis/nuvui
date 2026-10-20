import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

// Whether a background's canvas has anything on it.
const drawn = (area: Locator) =>
  area.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0) return false;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    return data.some((value, index) => index % 4 === 3 && value > 0);
  });
const picture = (area: Locator) =>
  area
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

const canvases = [
  "stars-background",
  "topography-background",
  "hexagon-background",
  "fireworks-background",
  "hole-background",
  "glyph-background",
];

test.describe("background pages", () => {
  for (const name of canvases) {
    test(`${name} draws under its example, and moves`, async ({ page }) => {
      await open(page, `/docs/backgrounds/${name}`);
      const area = preview(page, `${name}/basic`);
      await expect(area.getByRole("heading")).toBeVisible();
      await expect.poll(() => drawn(area)).toBe(true);
      const first = await picture(area);
      await expect.poll(() => picture(area), { timeout: 5000 }).not.toBe(first);
    });
  }

  test("the gradient is drawn in CSS and drifts", async ({ page }) => {
    await open(page, "/docs/backgrounds/gradient-background");
    const field = preview(page, "gradient-background/basic")
      .locator(".nuv-gradient-background__field")
      .first();
    await expect(field).toHaveCSS(
      "animation-name",
      "nuv-gradient-background-drift",
    );
  });

  test("the grid lights under the pointer", async ({ page, isMobile }) => {
    test.skip(isMobile, "a phone has no pointer to hover with");
    await open(page, "/docs/backgrounds/grid-background");
    const area = preview(page, "grid-background/basic");
    const grid = area.locator(".nuv-grid-background");
    await area.getByRole("heading").hover();
    await expect(grid).toHaveAttribute("data-lit", "");
  });

  test("the button on the start page stops the stars and starts them again", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/backgrounds");
    const area = preview(page, "stars-background/pause");
    await area.scrollIntoViewIfNeeded();
    await expect.poll(() => drawn(area)).toBe(true);
    const button = area.getByRole("button", { name: "Pause the background" });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await press(button, isMobile);

    await expect(button).toHaveAttribute("aria-pressed", "true");
    const held = await picture(area);
    await page.waitForTimeout(400);
    expect(await picture(area)).toBe(held);

    await press(button, isMobile);
    await expect.poll(() => picture(area), { timeout: 5000 }).not.toBe(held);
  });

  test("for less motion, a background holds still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/backgrounds/stars-background");
    const area = preview(page, "stars-background/basic");
    await expect.poll(() => drawn(area)).toBe(true);
    const held = await picture(area);
    await page.waitForTimeout(400);
    expect(await picture(area)).toBe(held);
  });

  test("fireworks come only once something's published", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/backgrounds/fireworks-background");
    const area = preview(page, "fireworks-background/celebrate");
    await area.scrollIntoViewIfNeeded();
    await expect(area.locator("canvas")).toHaveCount(0);
    await press(area.getByRole("button", { name: "Publish" }), isMobile);
    await expect(
      area.getByRole("heading", { name: "Published" }),
    ).toBeVisible();
    await expect.poll(() => drawn(area)).toBe(true);
  });

  test("the examples pass axe", async ({ page }) => {
    for (const name of [
      "gradient-background",
      "grid-background",
      ...canvases,
    ]) {
      await open(page, `/docs/backgrounds/${name}`);
      const results = await new AxeBuilder({ page })
        .include(`[data-preview="${name}/basic"] > div:first-child`)
        .analyze();
      expect(results.violations, name).toEqual([]);
    }
  });
});
