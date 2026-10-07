import { expect, type Page, test } from "@playwright/test";
import { expectOnScreen, open, press, scrollSettled } from "./helpers";

test.describe("popover page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/popover");
  });

  test("the example opens, and Done closes it", async ({ page, isMobile }) => {
    const trigger = page
      .locator('[data-preview="popover/basic"]')
      .getByRole("button", { name: "Share" });

    await press(trigger, isMobile);
    const popover = page.getByRole("dialog", { name: "Share this page" });
    await expect(popover).toBeVisible();

    await press(popover.getByRole("button", { name: "Done" }), isMobile);

    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("Escape closes it and returns focus to the trigger", async ({
    page,
  }) => {
    const trigger = page
      .locator('[data-preview="popover/basic"]')
      .getByRole("button", { name: "Share" });

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("a popover asked to open sideways still stays on the screen", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="popover/placement"]');

    for (const side of ["left", "right"]) {
      const trigger = preview.getByRole("button", { name: side });
      await trigger.scrollIntoViewIfNeeded();
      await press(trigger, isMobile);

      const popover = page.getByRole("dialog", {
        name: `Opens on the ${side}`,
      });
      await expect(popover).toBeVisible();
      await expectOnScreen(page, popover);

      await page.keyboard.press("Escape");
      await expect(popover).toBeHidden();
    }
  });

  test("the arrow points at the middle of its trigger", async ({
    page,
    isMobile,
  }) => {
    const trigger = page
      .locator('[data-preview="popover/arrow"]')
      .getByRole("button", { name: "Storage" });
    await trigger.scrollIntoViewIfNeeded();
    await press(trigger, isMobile);

    const popover = page.getByRole("dialog", { name: "Storage used" });
    await expect(popover).toBeVisible();
    const arrow = await popover.locator(".nuv-popover__arrow").boundingBox();
    const button = await trigger.boundingBox();
    if (!arrow || !button) throw new Error("nothing to measure");

    expect(
      Math.abs(arrow.x + arrow.width / 2 - (button.x + button.width / 2)),
    ).toBeLessThanOrEqual(1);
    await expectOnScreen(page, popover);
  });

  test("the playground adds the arrow", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground
      .getByRole("button", { name: "Open with these props" })
      .click();
    const popover = page.getByRole("dialog", { name: "Share this page" });
    await expect(popover).toBeVisible();
    await expect(popover.locator(".nuv-popover__arrow")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await playground.getByLabel("showArrow").check();
    await playground
      .getByRole("button", { name: "Open with these props" })
      .click();

    await expect(popover.locator(".nuv-popover__arrow")).toBeVisible();
    await expect(playground.locator("pre")).toContainText("showArrow");
  });

  test("opening the form example puts focus in its field", async ({
    page,
    isMobile,
  }) => {
    await press(page.getByRole("button", { name: "Rename" }), isMobile);

    await expect(
      page.getByRole("textbox", { name: "Project name" }),
    ).toBeFocused();
  });

  test("the playground moves the popover above its trigger", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    const trigger = playground.getByRole("button", {
      name: "Open with these props",
    });

    await playground.getByLabel("side").selectOption("top");
    await trigger.click();

    const popover = page.getByRole("dialog", { name: "Share this page" });
    await expect(popover).toBeVisible();
    const panel = await popover.boundingBox();
    const button = await trigger.boundingBox();
    if (!panel || !button) throw new Error("nothing to measure");

    expect(panel.y + panel.height).toBeLessThanOrEqual(button.y);
    await expect(playground.locator("pre")).toContainText('side="top"');
  });
});

test.describe("tooltip page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/tooltip");
  });

  test("keyboard focus shows the tooltip, and Escape hides it", async ({
    page,
  }) => {
    const trigger = page
      .locator('[data-preview="tooltip/basic"]')
      .getByRole("button", { name: "Archive" });

    // A tooltip closes when the page scrolls. So the button is brought into
    // view first, the scrolling is left to finish, and focus is then given
    // without the scroll that focus brings by itself when any of the
    // button is out of view.
    await trigger.scrollIntoViewIfNeeded();
    await scrollSettled(page);
    await trigger.evaluate((button: HTMLElement) =>
      button.focus({ preventScroll: true }),
    );
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toContainText("Takes the project out of your list");
    await expect(trigger).toHaveAccessibleDescription(
      /Takes the project out of your list/,
    );

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("resting the pointer on the trigger shows it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "There's no hover on a touch screen.");

    await page
      .locator('[data-preview="tooltip/toolbar"]')
      .getByRole("button", { name: "Bold" })
      .hover();

    await expect(page.getByRole("tooltip")).toHaveText("Ctrl+B");
  });

  test("a tap on the trigger doesn't show it", async ({ page, isMobile }) => {
    test.skip(!isMobile, "This is about touch screens.");
    const trigger = page
      .locator('[data-preview="tooltip/basic"]')
      .getByRole("button", { name: "Archive" });

    await trigger.tap();
    // Longer than the delay a hover would have waited.
    await page.waitForTimeout(1200);

    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });
});

test.describe("dropdown menu page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/dropdown-menu");
  });

  test("the example opens and closes with the keyboard", async ({ page }) => {
    const trigger = page
      .locator('[data-preview="dropdown-menu/basic"]')
      .getByRole("button", { name: "Options" });

    await trigger.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Options" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Rename" })).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(
      menu.getByRole("menuitem", { name: "Duplicate" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("choosing an item runs its handler and closes the menu", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="dropdown-menu/actions"]');

    await press(preview.getByRole("button", { name: "File" }), isMobile);
    await press(page.getByRole("menuitem", { name: "Save" }), isMobile);

    await expect(preview.getByText("Last chosen: Save")).toBeVisible();
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("a checkbox item keeps its state between openings", async ({
    page,
    isMobile,
  }) => {
    const trigger = page
      .locator('[data-preview="dropdown-menu/checkable"]')
      .getByRole("button", { name: "View" });
    const item = page.getByRole("menuitemcheckbox", {
      name: "Show hidden files",
    });

    await press(trigger, isMobile);
    await expect(item).toHaveAttribute("aria-checked", "false");
    await press(item, isMobile);

    await press(trigger, isMobile);
    await expect(item).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("menuitemradio", { name: "Name" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("rows are finger-sized on a phone, and the menu stays on the screen", async ({
    page,
    isMobile,
  }) => {
    await press(
      page
        .locator('[data-preview="dropdown-menu/basic"]')
        .getByRole("button", { name: "Options" }),
      isMobile,
    );
    const menu = page.getByRole("menu", { name: "Options" });
    await expect(menu).toBeVisible();

    const row = await menu
      .getByRole("menuitem", { name: "Rename" })
      .boundingBox();
    expect(row?.height).toBe(isMobile ? 44 : 32);
    await expectOnScreen(page, menu);
  });

  test("a submenu opens from its item and stays on the screen", async ({
    page,
    isMobile,
  }) => {
    await press(
      page
        .locator('[data-preview="dropdown-menu/submenu"]')
        .getByRole("button", { name: "Share" }),
      isMobile,
    );
    await press(page.getByRole("menuitem", { name: "Send to" }), isMobile);

    const submenu = page.getByRole("menu", { name: "Send to" });
    await expect(submenu).toBeVisible();
    await expectOnScreen(page, submenu);
  });
});

test.describe("select page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/select");
  });

  test("choosing an option shows it in the trigger", async ({
    page,
    isMobile,
  }) => {
    const trigger = page
      .locator('[data-preview="select/basic"]')
      .getByRole("combobox", { name: "Fruit" });

    await expect(trigger).toHaveText("Pick a fruit");
    await press(trigger, isMobile);
    await expect(page.getByRole("listbox")).toBeVisible();
    await press(page.getByRole("option", { name: "Banana" }), isMobile);

    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(trigger).toHaveText("Banana");
  });

  test("typing a letter on the trigger chooses a matching option", async ({
    page,
  }) => {
    const trigger = page
      .locator('[data-preview="select/basic"]')
      .getByRole("combobox", { name: "Fruit" });

    await trigger.focus();
    await page.keyboard.press("c");

    await expect(trigger).toHaveText("Cherry");
  });

  test("the controlled example reports the new value", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="select/controlled"]');

    await press(preview.getByRole("combobox", { name: "Size" }), isMobile);
    await press(page.getByRole("option", { name: "Large" }), isMobile);

    await expect(preview.getByText('The value is "l".')).toBeVisible();
  });

  test("the trigger and the options are finger-sized on a phone", async ({
    page,
    isMobile,
  }) => {
    const trigger = page
      .locator('[data-preview="select/basic"]')
      .getByRole("combobox", { name: "Fruit" });
    expect((await trigger.boundingBox())?.height).toBe(isMobile ? 44 : 40);

    await press(trigger, isMobile);
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();

    const option = await page
      .getByRole("option", { name: "Apple" })
      .boundingBox();
    expect(option?.height).toBeCloseTo(isMobile ? 44 : 32, 1);
    await expectOnScreen(page, list);
  });

  test("the playground disables the select", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("disabled").check();

    await expect(
      playground.getByRole("combobox", { name: "Fruit" }),
    ).toBeDisabled();
    await expect(playground.locator("pre")).toContainText("<Select disabled>");
  });
});

test.describe("toast page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/toast");
  });

  const toasts = (page: Page) => page.locator(".nuv-toast");

  test("the example shows a toast, and its close button removes it", async ({
    page,
    isMobile,
  }) => {
    await press(
      page
        .locator('[data-preview="toast/basic"]')
        .getByRole("button", { name: "Save changes" }),
      isMobile,
    );

    await expect(toasts(page)).toHaveText("Changes saved");
    await press(toasts(page).getByRole("button", { name: "Close" }), isMobile);

    await expect(toasts(page)).toHaveCount(0);
  });

  test("toasts span a phone's screen and sit in the corner on a desktop", async ({
    page,
    isMobile,
  }) => {
    await press(
      page
        .locator('[data-preview="toast/basic"]')
        .getByRole("button", { name: "Save changes" }),
      isMobile,
    );
    await expect(toasts(page)).toBeVisible();

    const box = await toasts(page).boundingBox();
    const list = await page.locator(".nuv-toaster").boundingBox();
    const viewport = page.viewportSize();
    if (!box || !list || !viewport) throw new Error("nothing to measure");
    const listEnd = list.x + list.width;

    expect(box.width).toBe(isMobile ? viewport.width - 32 : 352);
    // The list ends where the page does. On a desktop that's just short of
    // the window's edge, because this site keeps room for the scrollbar.
    expect(viewport.width - listEnd).toBeLessThanOrEqual(20);
    expect(Math.round(listEnd - box.x - box.width)).toBe(16);
    expect(Math.round(viewport.height - box.y - box.height)).toBe(16);
  });

  test("the action undoes the delete and closes the toast", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="toast/action"]');

    await press(preview.getByRole("button", { name: "Delete file" }), isMobile);
    // By element, because the code under the preview holds the same text.
    await expect(preview.locator("p")).toHaveText("The file is in the trash.");
    await expect(toasts(page)).toContainText("report.pdf deleted");

    await press(toasts(page).getByRole("button", { name: "Undo" }), isMobile);

    await expect(preview.locator("p")).toHaveText("report.pdf");
    await expect(toasts(page)).toHaveCount(0);
  });

  test("a toast is replaced in place when its id is used again", async ({
    page,
    isMobile,
  }) => {
    await press(
      page
        .locator('[data-preview="toast/update"]')
        .getByRole("button", { name: "Upload a photo" }),
      isMobile,
    );

    await expect(toasts(page)).toContainText("Uploading photo.jpg");
    await expect(toasts(page)).toContainText("photo.jpg uploaded");
    await expect(toasts(page)).toHaveCount(1);
    await expect(toasts(page)).toHaveClass(/nuv-toast--success/);
  });

  test("three show at once, and the next comes in when one closes", async ({
    page,
    isMobile,
  }) => {
    await press(
      page
        .locator('[data-preview="toast/queue"]')
        .getByRole("button", { name: "Send five toasts" }),
      isMobile,
    );

    await expect(toasts(page)).toHaveText([
      "Draft saved",
      "Link copied",
      "Invitation sent",
    ]);
    await press(
      toasts(page).first().getByRole("button", { name: "Close" }),
      isMobile,
    );

    await expect(toasts(page)).toHaveText([
      "Link copied",
      "Invitation sent",
      "Export ready",
    ]);
  });

  test("the playground sends the toast it describes", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("title").fill("Couldn't save");
    await playground.getByLabel("intent").selectOption("danger");
    await expect(playground.locator("pre")).toHaveText(
      'toast("Couldn\'t save", {\n  intent: "danger",\n});',
    );
    await playground.getByRole("button", { name: "Show this toast" }).click();

    await expect(toasts(page)).toHaveText("Couldn't save");
    await expect(toasts(page)).toHaveClass(/nuv-toast--danger/);
  });

  test("F8 moves focus to the list of toasts", async ({ page }) => {
    await page
      .locator('[data-preview="toast/basic"]')
      .getByRole("button", { name: "Save changes" })
      .click();
    await expect(toasts(page)).toBeVisible();

    await page.keyboard.press("F8");

    await expect(page.locator(".nuv-toaster")).toBeFocused();
  });
});
