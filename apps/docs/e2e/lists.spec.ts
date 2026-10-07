import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectOnScreen, open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

// The option the search field says the arrow keys are on. The page has
// several lists, so the field is found by its name, inside `within`.
function active(page: Page, field: string, within = "body") {
  return page.locator(within).evaluate((root, name) => {
    const input = [...root.querySelectorAll("[cmdk-input]")].find(
      (element) =>
        document.getElementById(element.getAttribute("aria-labelledby") ?? "")
          ?.textContent === name,
    );
    const id = input?.getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.textContent ?? null) : null;
  }, field);
}

test.describe("combobox page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/combobox");
  });

  test("typing narrows the list, and Enter picks the option the field names", async ({
    page,
    isMobile,
  }) => {
    const trigger = page.getByRole("combobox", {
      name: "Time zone",
      exact: true,
    });
    await expect(trigger).toHaveText("Europe/Berlin");

    await press(trigger, isMobile);
    const field = page.getByRole("combobox", { name: "Search time zones" });
    await expect(field).toBeFocused();
    // It opens on the option that's picked.
    await expect
      .poll(() => active(page, "Search time zones"))
      .toBe("Europe/Berlin");

    await page.keyboard.type("asia");
    await expect(page.getByRole("option")).toHaveText([
      "Asia/Kolkata",
      "Asia/Singapore",
      "Asia/Tokyo",
    ]);
    await expect
      .poll(() => active(page, "Search time zones"))
      .toBe("Asia/Kolkata");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(trigger).toHaveText("Asia/Singapore");
    await expect(trigger).toBeFocused();
  });

  test("the popup stays on the screen and lines up with its button", async ({
    page,
    isMobile,
  }) => {
    const trigger = page.getByRole("combobox", {
      name: "Time zone",
      exact: true,
    });
    await press(trigger, isMobile);
    const popup = page.getByRole("dialog", { name: "Time zone", exact: true });
    await expect(popup).toBeVisible();
    // The pop-in scales the popup, which would change what's measured.
    await expect
      .poll(() =>
        popup.evaluate((element) =>
          element.getAnimations().every((item) => item.playState !== "running"),
        ),
      )
      .toBe(true);

    await expectOnScreen(page, popup);
    const button = await trigger.boundingBox();
    const panel = await popup.boundingBox();
    if (!button || !panel) throw new Error("nothing to measure");
    expect(panel.width).toBeGreaterThanOrEqual(button.width);
    expect(Math.round(panel.x)).toBe(Math.round(button.x));
  });

  test("a tap on an option picks it", async ({ page, isMobile }) => {
    const trigger = page.getByRole("combobox", {
      name: "Time zone",
      exact: true,
    });
    await press(trigger, isMobile);
    await press(page.getByRole("option", { name: "Asia/Tokyo" }), isMobile);

    await expect(trigger).toHaveText("Asia/Tokyo");
    await expect(page.getByRole("option")).toHaveCount(0);
  });

  test("saying nothing matches doesn't break the page's accessibility", async ({
    page,
    isMobile,
  }) => {
    // A panel that is still fading in has colors it never has at rest.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await press(
      page.getByRole("combobox", { name: "Time zone", exact: true }),
      isMobile,
    );
    await page.keyboard.type("zzz");

    await expect(page.locator(".nuv-combobox__status")).toHaveText(
      "No time zone found.",
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("the trigger shows a name while the form gets the code", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "combobox/labels");
    const trigger = area.getByRole("combobox", { name: "Country" });
    await expect(area.locator("output")).toHaveText("Nothing picked yet.");

    await press(trigger, isMobile);
    // No accent typed, and one in the name.
    await page.keyboard.type("mexico");
    await expect(page.getByRole("option")).toHaveText(["México"]);
    await page.keyboard.press("Enter");

    await expect(trigger).toHaveText("México");
    await expect(area.locator("output")).toHaveText('The form gets "MX".');
    await expect(area.locator('input[name="country"]')).toHaveValue("MX");
  });

  test("with several values, picking adds one and the list stays open", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "combobox/multiple");
    const trigger = area.getByRole("combobox", { name: "Labels" });
    await expect(trigger).toHaveText("2 labels");

    await press(trigger, isMobile);
    await expect(page.getByRole("option", { name: "Bug" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await press(page.getByRole("option", { name: "Billing" }), isMobile);

    await expect(trigger).toHaveText("3 labels");
    await expect(page.getByRole("option")).toHaveCount(6);
    await expect(area.locator(".nuv-badge")).toHaveText([
      "Bug",
      "Security",
      "Billing",
    ]);

    await press(page.getByRole("option", { name: "Bug" }), isMobile);
    await expect(trigger).toHaveText("2 labels");
  });

  test("options from a server show that they're on their way, then arrive", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "combobox/async");
    await press(area.getByRole("combobox", { name: "Customer" }), isMobile);
    await expect(page.getByRole("option")).toHaveCount(8);

    await page.keyboard.type("harbor");
    await expect(page.locator(".nuv-combobox__loading")).toHaveText(
      "Loading customers",
    );
    // "No customer found" waits while the request is out.
    await expect(page.locator(".nuv-combobox__empty")).toHaveCount(0);

    await expect(page.getByRole("option")).toHaveText([
      "Blue Harbor Logistics",
      "Harbor Light Media",
    ]);
    await expect(page.locator(".nuv-combobox__loading")).toHaveCount(0);
  });

  test("in a field, an empty one is marked invalid and described by its error", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "combobox/field");
    const trigger = area.getByRole("combobox", { name: "Plan" });
    await expect(trigger).toHaveAttribute("aria-required", "true");
    await expect(trigger).toHaveAccessibleDescription(
      "You can change it later.",
    );

    await press(area.getByRole("button", { name: "Continue" }), isMobile);
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      "You can change it later. Pick a plan to continue.",
    );

    await press(trigger, isMobile);
    await press(page.getByRole("option", { name: "Team" }), isMobile);
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveText("Team");
  });

  test("the playground switches to several values, in the combobox and in the code", async ({
    page,
    isMobile,
  }) => {
    const area = playground(page);
    const trigger = area.getByRole("combobox", { name: "Fruit" });

    await area.getByLabel("multiple").check();
    await area.getByLabel("placeholder").fill("Pick some");
    await expect(area.locator("pre")).toContainText("<Combobox multiple>");
    await expect(trigger).toHaveText("Pick some");

    await press(trigger, isMobile);
    await press(page.getByRole("option", { name: "Apple" }), isMobile);
    await press(page.getByRole("option", { name: "Mango" }), isMobile);
    await expect(trigger).toHaveText("Apple, Mango");
  });
});

test.describe("command page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/command");
  });

  test("typing filters the list, by keyword too, and the field names the best match", async ({
    page,
  }) => {
    const area = preview(page, "command/basic");
    const field = area.getByRole("combobox", { name: "Commands" });

    await field.click();
    await expect.poll(() => active(page, "Commands")).toContain("New file");

    await page.keyboard.type("dark");
    await expect(area.getByRole("option")).toHaveText(["Toggle theme"]);
    await expect.poll(() => active(page, "Commands")).toBe("Toggle theme");
    // The group nothing matched in has gone, and its heading with it.
    await expect(area.getByText("Files", { exact: true })).toBeHidden();

    await field.fill("qqq");
    await expect(area.getByRole("status")).toHaveText("No commands found.");
  });

  test("the palette opens from its button, runs a command and closes", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "command/dialog");
    await press(
      area.getByRole("button", { name: "Open the palette" }),
      isMobile,
    );
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("combobox", { name: "Search commands" }),
    ).toBeFocused();
    await expectOnScreen(page, dialog);

    await page.keyboard.type("invite");
    await expect(dialog.getByRole("option")).toHaveText(["Invite a teammate"]);
    await page.keyboard.press("Enter");

    await expect(dialog).toBeHidden();
    await expect(area.locator("output")).toHaveText("Ran: Invite a teammate");
  });

  test("on a phone the palette is at the top of the screen", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "On a wider screen it's in the middle.");
    await preview(page, "command/dialog")
      .getByRole("button", { name: "Open the palette" })
      .tap();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate((element) =>
          element.getAnimations().every((item) => item.playState !== "running"),
        ),
      )
      .toBe(true);

    const box = await dialog.boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    expect(box?.x).toBe(16);
    expect(box?.width).toBe(width - 32);
    expect(box?.y).toBeLessThan(80);
  });

  test("its shortcut opens and closes it, and gives focus back", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no Ctrl key.");
    const button = preview(page, "command/dialog").getByRole("button", {
      name: "Open the palette",
    });
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await button.focus();

    await page.keyboard.press("Control+j");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Control+j");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();

    await page.keyboard.press("Control+j");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("the open palette passes axe", async ({ page, isMobile }) => {
    // A panel that is still fading in has colors it never has at rest.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await press(
      preview(page, "command/dialog").getByRole("button", {
        name: "Open the palette",
      }),
      isMobile,
    );
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate((element) =>
          element.getAnimations().every((item) => item.playState !== "running"),
        ),
      )
      .toBe(true);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("items from a server show that they're on their way, then arrive", async ({
    page,
  }) => {
    const area = preview(page, "command/loading");
    await expect(area.getByRole("option")).toHaveCount(5);

    await area.getByRole("combobox", { name: "Search orders" }).fill("delta");
    await expect(area.locator(".nuv-command__loading")).toHaveText(
      "Loading orders",
    );
    await expect(area.locator(".nuv-command__empty")).toHaveCount(0);

    await expect(area.getByRole("option")).toHaveText([
      "10251 · Delta Freight",
    ]);
  });

  test("the playground takes the shortcuts out of the rows and the code", async ({
    page,
  }) => {
    const area = playground(page);
    await expect(area.locator(".nuv-command__shortcut")).toHaveCount(3);

    await area.getByLabel("with CommandShortcut").uncheck();
    await area.getByLabel("loop").check();

    await expect(area.locator(".nuv-command__shortcut")).toHaveCount(0);
    await expect(area.locator("pre")).not.toContainText("<CommandShortcut>");
    await expect(area.locator("pre")).toContainText(
      '<Command label="Commands" loop>',
    );

    // With loop, up from the first item is the last.
    await area.getByRole("combobox", { name: "Commands" }).click();
    const here = "[data-playground]";
    // An item is known by its text, and the first one's has just changed,
    // so nothing is active until a key says what is.
    await page.keyboard.press("Home");
    await expect.poll(() => active(page, "Commands", here)).toBe("New file");
    await page.keyboard.press("ArrowUp");
    await expect.poll(() => active(page, "Commands", here)).toBe("Save file");
  });
});
