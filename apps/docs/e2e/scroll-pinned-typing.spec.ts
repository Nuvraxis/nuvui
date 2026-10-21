import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

// How much of its length a scroll progress bar fills.
const filled = (page: Page, name: string) =>
  preview(page, name)
    .locator(".nuv-scroll-progress__bar")
    .evaluate(
      (bar) => new DOMMatrixReadOnly(getComputedStyle(bar).transform).a,
    );

test.describe("scroll progress page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/scroll-progress");
  });

  test("the bar fills as the notes are scrolled, and is hidden from screen readers", async ({
    page,
  }) => {
    const example = preview(page, "scroll-progress/basic");
    const notes = example.getByRole("region", { name: "Release notes" });
    await expect(example.locator(".nuv-scroll-progress")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(await filled(page, "scroll-progress/basic")).toBe(0);

    await notes.evaluate((box) => {
      box.scrollTop = box.scrollHeight;
    });

    await expect.poll(() => filled(page, "scroll-progress/basic")).toBe(1);
  });

  test("along the line, it follows the row of months", async ({ page }) => {
    const row = preview(page, "scroll-progress/inline").getByRole("list", {
      name: "Months",
    });

    await row.evaluate((box) => {
      box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2;
    });

    await expect
      .poll(() => filled(page, "scroll-progress/inline"))
      .toBeCloseTo(0.5, 1);
  });

  test("the box can be scrolled with the keyboard", async ({ page }) => {
    const notes = preview(page, "scroll-progress/basic").getByRole("region", {
      name: "Release notes",
    });

    await notes.focus();
    await page.keyboard.press("End");

    await expect
      .poll(() => notes.evaluate((box) => box.scrollTop))
      .toBeGreaterThan(0);
    await expect.poll(() => filled(page, "scroll-progress/basic")).toBe(1);
  });

  test("the examples pass axe", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('[data-preview^="scroll-progress/"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("pinned list page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/pinned-list");
  });

  const group = (page: Page, name: string) =>
    preview(page, "pinned-list/basic").getByRole("list", { name });

  test("a pin moves a report to the top, says so, and keeps the focus", async ({
    page,
    isMobile,
  }) => {
    await expect(group(page, "Pinned")).toContainText("Sales pipeline");
    const pin = preview(page, "pinned-list/basic").getByRole("button", {
      name: "Pin Churn by plan",
    });
    await expect(pin).toHaveAttribute("aria-pressed", "false");

    await press(pin, isMobile);

    await expect(group(page, "Pinned")).toContainText("Churn by plan");
    await expect(pin).toHaveAttribute("aria-pressed", "true");
    await expect(
      preview(page, "pinned-list/basic").getByRole("status"),
    ).toHaveText("Pinned Churn by plan");
  });

  test("with the keyboard, the focus stays on the pin as its item moves", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no keyboard");
    const pin = preview(page, "pinned-list/basic").getByRole("button", {
      name: "Pin Hiring plan",
    });

    await pin.focus();
    await page.keyboard.press("Enter");

    await expect(group(page, "Pinned")).toContainText("Hiring plan");
    await expect(pin).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(group(page, "Pinned")).not.toContainText("Hiring plan");
    await expect(pin).toBeFocused();
  });

  test("a list kept by the page says how many are pinned", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "pinned-list/kept");
    await example.scrollIntoViewIfNeeded();
    await expect(example.getByText("1 pinned")).toBeVisible();

    await press(example.getByRole("button", { name: "Pin Atlas" }), isMobile);

    await expect(example.getByText("2 pinned")).toBeVisible();
    await expect(
      example.getByRole("list", { name: "Pinned projects" }),
    ).toContainText("Atlas");
  });

  test("the examples pass axe", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('[data-preview^="pinned-list/"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("code block page, typing", () => {
  test("the code types itself out, and all of it is there once it's done", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, "/docs/chat/code-block");
    const example = preview(page, "code-block/typing");
    await example.scrollIntoViewIfNeeded();
    const block = example.locator(".nuv-code-block");

    await expect(block).toHaveAttribute("data-typing", "done", {
      timeout: 10_000,
    });
    await expect(block.locator("code")).toContainText("Save changes");
    await expect(block.locator(".nuv-code-block__caret")).toHaveCount(0);

    await press(example.getByRole("button", { name: "Type again" }), isMobile);
    await expect(block).not.toHaveAttribute("data-typing", "done");
    await expect(block).toHaveAttribute("data-typing", "done", {
      timeout: 10_000,
    });
  });

  test("with less motion the code is there at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/chat/code-block");
    const block = preview(page, "code-block/typing").locator(".nuv-code-block");

    await expect(block).toHaveAttribute("data-typing", "done");
    await expect(block.locator(".nuv-code-block__untyped")).toHaveCount(0);
  });
});
