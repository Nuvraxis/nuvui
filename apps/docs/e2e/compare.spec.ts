import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

test.describe("compare page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/compare");
  });

  test("a drag on the divider moves it, and a drag on the picture doesn't", async ({
    page,
  }) => {
    const example = preview(page, "compare/basic");
    const divider = example.getByRole("slider", { name: "Before and after" });
    const frame = example.locator(".nuv-compare__frame");
    await expect(divider).toHaveAttribute("aria-valuenow", "50");
    const box = await frame.boundingBox();
    const handle = await divider.boundingBox();
    if (!box || !handle) throw new Error("the example isn't drawn");
    const y = box.y + box.height / 2;

    // On the picture, three quarters across: nothing moves.
    await page.mouse.move(box.x + box.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, y, { steps: 5 });
    await page.mouse.up();
    await expect(divider).toHaveAttribute("aria-valuenow", "50");

    // On the handle, to a quarter across.
    await page.mouse.move(handle.x + handle.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 5 });
    await page.mouse.up();
    const now = Number(await divider.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThan(22);
    expect(now).toBeLessThan(28);
  });

  test("the keys move the divider", async ({ page }) => {
    const divider = preview(page, "compare/basic").getByRole("slider");

    await divider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(divider).toHaveAttribute("aria-valuenow", "51");
    await page.keyboard.press("End");
    await expect(divider).toHaveAttribute("aria-valuenow", "100");
    await expect(divider).toHaveAttribute(
      "aria-valuetext",
      "100% Before, 0% After",
    );
  });

  test("buttons of the page's own move a divider it controls", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "compare/controlled");

    await press(example.getByRole("button", { name: "All before" }), isMobile);
    await expect(example.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    await expect(example.getByText("100% before")).toBeVisible();
  });

  test("the switch shows the other picture and hides the first", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "compare/toggle");
    const before = example.locator(".nuv-compare__layer--before");

    await expect(
      example.getByRole("img", { name: "The kitchen with its old cabinets" }),
    ).toBeVisible();
    await press(example.getByRole("radio", { name: "After" }), isMobile);

    await expect(example.getByRole("radio", { name: "After" })).toBeChecked();
    await expect(before).toHaveAttribute("aria-hidden", "true");
    await expect(before).toHaveAttribute("inert", "");
  });

  test("vertical: the divider goes across and moves up and down", async ({
    page,
  }) => {
    const example = preview(page, "compare/vertical");
    const divider = example.getByRole("slider", {
      name: "Old and new dashboard",
    });
    await expect(divider).toHaveAttribute("aria-orientation", "vertical");
    const box = await example.locator(".nuv-compare__frame").boundingBox();
    const line = await divider.boundingBox();
    if (!box || !line) throw new Error("the example isn't drawn");

    expect(line.width).toBeCloseTo(box.width, 0);
    expect(line.y + line.height / 2).toBeCloseTo(box.y + box.height / 2, 0);
  });
});
