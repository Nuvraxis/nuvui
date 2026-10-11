import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

test.describe("color picker page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/color-picker");
  });

  test("the button shows the color, opens the picker, and follows a preset", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "color-picker/basic");
    const trigger = area.getByRole("button", { name: "Brand color" });
    await expect(trigger).toHaveText("#2563eb");
    await expect(trigger).toHaveAccessibleDescription("#2563eb");

    await press(trigger, isMobile);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Blue" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await press(dialog.getByRole("button", { name: "Green" }), isMobile);
    await expect(dialog.getByRole("button", { name: "Green" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      dialog.getByRole("textbox", { name: "Hex color" }),
    ).toHaveValue("#16a34a");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveText("#16a34a");
  });

  test("the popover stays on the screen", async ({ page, isMobile }) => {
    const trigger = preview(page, "color-picker/basic").getByRole("button", {
      name: "Brand color",
    });
    await press(trigger, isMobile);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
  });

  test("a drag in the area picks the color, and the text follows", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "A drag with a mouse. A tap is tried in the next test.",
    );
    const area = preview(page, "color-picker/inline");
    const square = area.locator(".nuv-color-picker__area");
    const thumb = area.getByRole("slider", {
      name: "Saturation and brightness",
    });
    await square.scrollIntoViewIfNeeded();
    const box = await square.boundingBox();
    if (!box) throw new Error("nothing to drag in");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // Past the corner: the drag goes on outside the area and stops at it.
    await page.mouse.move(box.x + box.width + 40, box.y - 40, { steps: 5 });
    await page.mouse.up();

    await expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "Saturation 100%, brightness 100%",
    );
    await expect(area.getByText("The color is #00ffe8.")).toBeVisible();
    await expect(thumb).toBeFocused();
  });

  test("a tap in the area picks from where it lands", async ({ page }) => {
    const area = preview(page, "color-picker/inline");
    const square = area.locator(".nuv-color-picker__area");
    const thumb = area.getByRole("slider", {
      name: "Saturation and brightness",
    });
    await square.scrollIntoViewIfNeeded();
    await expect(thumb).not.toHaveAttribute(
      "aria-valuetext",
      "Saturation 50%, brightness 50%",
    );

    await square.click();

    await expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "Saturation 50%, brightness 50%",
    );
  });

  test("the arrow keys move the area's thumb and the hue", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "color-picker/inline");
    const thumb = area.getByRole("slider", {
      name: "Saturation and brightness",
    });
    const hue = area.getByRole("slider", { name: "Hue" });

    await thumb.focus();
    await page.keyboard.press("End");
    await page.keyboard.press("PageUp");
    await page.keyboard.press("PageUp");
    await page.keyboard.press("PageUp");
    await page.keyboard.press("PageUp");
    await page.keyboard.press("PageUp");
    await expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "Saturation 100%, brightness 100%",
    );
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Shift+ArrowDown");
    await expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "Saturation 99%, brightness 90%",
    );

    await hue.focus();
    await page.keyboard.press("Home");
    await expect(hue).toHaveAttribute("aria-valuenow", "0");
    await expect(area.getByText("The color is #e60202.")).toBeVisible();
  });

  test("a typed color is taken, and something else is put back", async ({
    page,
  }) => {
    const area = preview(page, "color-picker/inline");
    const field = area.getByRole("textbox", { name: "Hex color" });
    await expect(field).toHaveValue("#0d9488");

    await field.fill("7C3AED");
    await expect(area.getByText("The color is #7c3aed.")).toBeVisible();
    await field.press("Enter");
    await expect(field).toHaveValue("#7c3aed");

    await field.fill("purple");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await field.blur();
    await expect(field).toHaveValue("#7c3aed");
    await expect(field).not.toHaveAttribute("aria-invalid");
  });

  test("with presets only, the button shows the name and says the color", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "color-picker/presets");
    const trigger = area.getByRole("button", { name: "Label color" });
    await expect(trigger).toContainText("Done");
    await expect(trigger).toHaveAccessibleDescription("#15803d");

    await press(trigger, isMobile);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("slider")).toHaveCount(0);
    await press(dialog.getByRole("button", { name: "Urgent" }), isMobile);
    await page.keyboard.press("Escape");

    await expect(trigger).toContainText("Urgent");
    await expect(trigger).toHaveAccessibleDescription("#b91c1c");
  });

  test("a drag is saved once, when it ends", async ({ page, isMobile }) => {
    test.skip(isMobile, "A drag with a mouse.");
    const area = preview(page, "color-picker/commit");
    const square = area.locator(".nuv-color-picker__area");
    await square.scrollIntoViewIfNeeded();
    const box = await square.boundingBox();
    if (!box) throw new Error("nothing to drag in");
    await expect(area.getByRole("status")).toHaveText("Saved 0 times.");

    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 80, { steps: 8 });
    await page.mouse.up();

    await expect(area.getByRole("status")).toContainText(
      "Saved 1 time, last as #",
    );
  });

  test("in a form the field names the button, and the color is sent", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "color-picker/form");
    const trigger = area.getByRole("button", { name: "Accent color" });
    await expect(trigger).toHaveAccessibleDescription(
      /Used for links and buttons\./,
    );
    await expect(trigger).toHaveAccessibleDescription(/#7c3aed/);

    await press(trigger, isMobile);
    await page.getByRole("dialog").getByRole("textbox").fill("#0d9488");
    await page.keyboard.press("Enter");
    // Enter in the field takes the color. It doesn't send the form.
    await expect(area.getByRole("status")).toHaveText("");
    await page.keyboard.press("Escape");

    await press(area.getByRole("button", { name: "Save" }), isMobile);
    await expect(area.getByRole("status")).toHaveText("Sent accent=#0d9488");
  });

  test("the playground changes the picker and the code together", async ({
    page,
    isMobile,
  }) => {
    const area = playground(page);
    const trigger = area.getByRole("button", { name: "Brand color" });
    await press(trigger, isMobile);
    await expect(
      page.getByRole("dialog").getByRole("textbox", { name: "Hex color" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await area.getByLabel("ColorPickerInput", { exact: true }).uncheck();
    await expect(area.locator("pre")).not.toContainText("<ColorPickerInput />");
    await press(trigger, isMobile);
    await expect(page.getByRole("dialog").getByRole("textbox")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await area.getByLabel("disabled", { exact: true }).check();
    await expect(trigger).toBeDisabled();
    await expect(area.locator("pre")).toContainText(
      '<ColorPicker defaultValue="#2563eb" disabled>',
    );
  });
});
