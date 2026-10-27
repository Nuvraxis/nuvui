import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

test.describe("image zoom page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/image-zoom");
  });

  test("a mouse resting on the plan zooms in, and leaving zooms out", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no mouse");
    const zoom = preview(page, "image-zoom/basic").locator(".nuv-image-zoom");
    await zoom.scrollIntoViewIfNeeded();
    const box = await zoom.boundingBox();
    if (!box) throw new Error("the example isn't drawn");

    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await expect(zoom).toHaveAttribute("data-state", "zoomed");
    // Centred where the mouse is, a quarter of the way across.
    const across = await zoom
      .locator(".nuv-image-zoom__content")
      .evaluate((element) =>
        Number.parseFloat(
          (element as HTMLElement).style.getPropertyValue("--nuv-image-zoom-x"),
        ),
      );
    expect(across).toBeCloseTo(25, 0);

    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 120);
    await expect(zoom).toHaveAttribute("data-state", "idle");
  });

  test("a tap zooms in, and another zooms out", async ({ page, isMobile }) => {
    test.skip(!isMobile, "a tap is a phone's");
    const zoom = preview(page, "image-zoom/click").locator(".nuv-image-zoom");
    await zoom.scrollIntoViewIfNeeded();

    await zoom.tap({ position: { x: 40, y: 40 } });
    await expect(zoom).toHaveAttribute("data-state", "zoomed");
    await expect(zoom).toHaveCSS("touch-action", "none");

    await zoom.tap({ position: { x: 40, y: 40 } });
    await expect(zoom).toHaveAttribute("data-state", "idle");
  });

  test("the button zooms from the keyboard, and the arrows move the view", async ({
    page,
  }) => {
    const example = preview(page, "image-zoom/click");
    const button = example.getByRole("button", { name: "Zoom" });
    const content = example.locator(".nuv-image-zoom__content");

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(content).toHaveCSS("scale", "3");

    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() =>
        content.evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--nuv-image-zoom-x"),
        ),
      )
      .toBe("60%");

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });

  test("a switch of the page's own zooms a plan it controls", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "image-zoom/controlled");

    await press(
      example.getByRole("switch", { name: "Show the plan close up" }),
      isMobile,
    );
    await expect(example.locator(".nuv-image-zoom")).toHaveAttribute(
      "data-state",
      "zoomed",
    );
    await expect(example.getByRole("button", { name: "Zoom" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
