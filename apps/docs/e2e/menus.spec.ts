import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectOnScreen, open, press } from "./helpers";

// A context menu opens on a right click with a mouse, and on a touch screen
// when a finger stays down. Playwright can tap but can't hold, so the hold is
// made from the two pointer events a finger would send.
async function openContextMenu(area: Locator, isMobile: boolean) {
  await area.scrollIntoViewIfNeeded();
  if (!isMobile) {
    await area.click({ button: "right" });
    return;
  }

  const box = await area.boundingBox();
  if (!box) throw new Error("nothing to press on");
  const finger = {
    pointerType: "touch",
    bubbles: true,
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2,
  };
  await area.dispatchEvent("pointerdown", finger);
  // Radix waits 700ms before it takes a press for a long one.
  await area.page().getByRole("menu").first().waitFor();
  await area.dispatchEvent("pointerup", finger);
}

test.describe("context menu page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/context-menu");
  });

  const area = (page: Page, name: string) =>
    page.locator(`[data-preview="context-menu/${name}"] [data-state]`).first();

  test("a right click, or a long press on a phone, opens the menu, and Escape closes it", async ({
    page,
    isMobile,
  }) => {
    await openContextMenu(area(page, "basic"), isMobile);

    const menu = page.getByRole("menu", { name: "report.pdf" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Share" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expectOnScreen(page, menu);

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("a plain click on the area opens nothing", async ({
    page,
    isMobile,
  }) => {
    await press(area(page, "basic"), isMobile);
    await page.waitForTimeout(300);

    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("the menu opens where the pointer is", async ({ page, isMobile }) => {
    test.skip(isMobile, "This is about a mouse.");
    const target = area(page, "basic");
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error("nothing to measure");

    await page.mouse.click(box.x + 30, box.y + 20, { button: "right" });

    const menu = await page.getByRole("menu").boundingBox();
    // Radix leaves 2px between the pointer and the menu's corner, and puts
    // the menu on a whole pixel.
    expect(Math.abs((menu?.x ?? 0) - (box.x + 30 + 2))).toBeLessThanOrEqual(1);
    expect(Math.abs((menu?.y ?? 0) - (box.y + 20))).toBeLessThanOrEqual(1);
  });

  test("the arrow keys and Enter work inside it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await openContextMenu(area(page, "basic"), isMobile);
    const menu = page.getByRole("menu", { name: "report.pdf" });
    await expect(menu).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Open" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Rename" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(menu).toBeHidden();
  });

  test("the shortcut isn't part of the item's name", async ({
    page,
    isMobile,
  }) => {
    await openContextMenu(area(page, "basic"), isMobile);

    const item = page.getByRole("menuitem", { name: "Rename", exact: true });
    await expect(item).toBeVisible();
    await expect(item).toContainText("F2");
  });

  test("the same actions are behind a button too", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="context-menu/with-button"]');

    await openContextMenu(preview.getByText("report.pdf").first(), isMobile);
    await press(page.getByRole("menuitem", { name: "Rename" }), isMobile);
    await expect(preview.getByText("Last chosen: Rename")).toBeVisible();

    await press(
      preview.getByRole("button", { name: "Actions for report.pdf" }),
      isMobile,
    );
    await press(page.getByRole("menuitem", { name: "Move" }), isMobile);
    await expect(preview.getByText("Last chosen: Move")).toBeVisible();
  });

  test("a checkbox item and a radio item keep their state between openings", async ({
    page,
    isMobile,
  }) => {
    const target = area(page, "checkable");

    await openContextMenu(target, isMobile);
    await press(
      page.getByRole("menuitemcheckbox", { name: "Show hidden files" }),
      isMobile,
    );
    await expect(target).toContainText("hidden files shown");

    await openContextMenu(target, isMobile);
    await expect(
      page.getByRole("menuitemcheckbox", { name: "Show hidden files" }),
    ).toHaveAttribute("aria-checked", "true");
    await press(page.getByRole("menuitemradio", { name: "Date" }), isMobile);
    await expect(target).toContainText("Sorted by date");
  });

  test("rows are finger-sized on a phone", async ({ page, isMobile }) => {
    await openContextMenu(area(page, "basic"), isMobile);

    const row = await page
      .getByRole("menuitem", { name: "Open" })
      .boundingBox();
    expect(row?.height).toBe(isMobile ? 44 : 32);
  });

  test("a submenu opens from its item and stays on the screen", async ({
    page,
    isMobile,
  }) => {
    await openContextMenu(area(page, "submenu"), isMobile);
    await press(page.getByRole("menuitem", { name: "Send to" }), isMobile);

    const submenu = page.getByRole("menu", { name: "Send to" });
    await expect(submenu).toBeVisible();
    await expectOnScreen(page, submenu);
  });

  test("the playground turns the area off", async ({ page, isMobile }) => {
    test.skip(isMobile, "The browser's own menu can't be told apart here.");
    const playground = page.locator("[data-playground]");
    const target = playground.locator("[data-state]").first();

    await target.click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Delete" })).toHaveClass(
      /nuv-context-menu__item--danger/,
    );
    await page.keyboard.press("Escape");

    await playground.getByLabel("disabled (trigger)").check();
    await target.click({ button: "right" });
    await page.waitForTimeout(300);

    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(playground.locator("pre")).toContainText(
      "<ContextMenuTrigger disabled>",
    );
  });
});

test.describe("menubar page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/menubar");
  });

  const bar = (page: Page, name: string) =>
    page.locator(`[data-preview="menubar/${name}"]`).getByRole("menubar");

  test("an entry opens its menu, and choosing an item closes it", async ({
    page,
    isMobile,
  }) => {
    const file = bar(page, "basic").getByRole("menuitem", { name: "File" });

    await press(file, isMobile);
    const menu = page.getByRole("menu", { name: "File" });
    await expect(menu).toBeVisible();
    await expect(file).toHaveAttribute("aria-expanded", "true");
    await expectOnScreen(page, menu);

    await press(menu.getByRole("menuitem", { name: "New" }), isMobile);
    await expect(menu).toBeHidden();
  });

  test("with a menu open, moving to another entry opens that one", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "There's no hover on a touch screen.");
    const entries = bar(page, "basic");

    await entries.getByRole("menuitem", { name: "File" }).click();
    await expect(page.getByRole("menu", { name: "File" })).toBeVisible();
    await entries.getByRole("menuitem", { name: "Edit" }).hover();

    await expect(page.getByRole("menu", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("menu", { name: "File" })).toHaveCount(0);
  });

  test("the keyboard moves along the bar and between menus", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const entries = bar(page, "basic");
    const entry = (name: string) => entries.getByRole("menuitem", { name });

    await entry("File").focus();
    await page.keyboard.press("ArrowRight");
    await expect(entry("Edit")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(entry("File")).toBeFocused();

    await page.keyboard.press("Enter");
    const file = page.getByRole("menu", { name: "File" });
    await expect(file.getByRole("menuitem", { name: "New" })).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("menu", { name: "Edit" })).toBeVisible();
    await expect(file).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(entry("Edit")).toBeFocused();
  });

  test("the keys shown next to an item are also in aria-keyshortcuts, not in its name", async ({
    page,
    isMobile,
  }) => {
    await press(
      bar(page, "basic").getByRole("menuitem", { name: "Edit" }),
      isMobile,
    );

    const undo = page.getByRole("menuitem", { name: "Undo", exact: true });
    await expect(undo).toContainText("Ctrl+Z");
    await expect(undo).toHaveAttribute("aria-keyshortcuts", "Control+Z");
  });

  test("checkable items change what the example reports", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="menubar/checkable"]');
    const view = preview.getByRole("menuitem", { name: "View" });

    await press(view, isMobile);
    await press(
      page.getByRole("menuitemcheckbox", { name: "Show ruler" }),
      isMobile,
    );
    await expect(preview.locator("p")).toHaveText("Zoom 100%, ruler hidden");

    await press(view, isMobile);
    await press(page.getByRole("menuitemradio", { name: "200%" }), isMobile);
    await expect(preview.locator("p")).toHaveText("Zoom 200%, ruler hidden");
  });

  test("a submenu opens from its item and stays on the screen", async ({
    page,
    isMobile,
  }) => {
    await press(
      bar(page, "submenu").getByRole("menuitem", { name: "Share" }),
      isMobile,
    );
    await press(page.getByRole("menuitem", { name: "Export as" }), isMobile);

    const submenu = page.getByRole("menu", { name: "Export as" });
    await expect(submenu).toBeVisible();
    await expectOnScreen(page, submenu);
  });

  test("entries and rows are finger-sized on a phone", async ({
    page,
    isMobile,
  }) => {
    const file = bar(page, "basic").getByRole("menuitem", { name: "File" });
    expect((await file.boundingBox())?.height).toBe(isMobile ? 44 : 32);

    await press(file, isMobile);
    const row = await page
      .getByRole("menuitem", { name: "Open", exact: true })
      .boundingBox();
    // The menu sits on a fraction of a pixel on a phone's dense screen.
    expect(row?.height).toBeCloseTo(isMobile ? 44 : 32, 1);
  });

  test("the playground turns the bar right to left", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const playground = page.locator("[data-playground]");
    const entry = (name: string) =>
      playground.getByRole("menubar").getByRole("menuitem", { name });

    await playground.getByLabel("dir").selectOption("rtl");
    await entry("File").focus();
    await page.keyboard.press("ArrowLeft");

    await expect(entry("Edit")).toBeFocused();
    await expect(playground.locator("pre")).toContainText(
      '<Menubar dir="rtl">',
    );
  });
});

test.describe("dropdown menu page", () => {
  test("a shortcut shows in its row and stays out of the item's name", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/dropdown-menu");

    await press(
      page
        .locator('[data-preview="dropdown-menu/shortcuts"]')
        .getByRole("button", { name: "Edit" }),
      isMobile,
    );

    const item = page.getByRole("menuitem", { name: "Duplicate", exact: true });
    await expect(item).toContainText("Ctrl+D");
    await expect(item).toHaveAttribute("aria-keyshortcuts", "Control+D");
  });
});
