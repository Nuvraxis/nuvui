import { expect, type Page, test } from "@playwright/test";
import { expectOnScreen, open, press } from "./helpers";

// The part of the window a fixed panel can be placed in, which is what the
// layer behind a sheet covers. On a desktop this site keeps a strip free for
// the scrollbar, so it's narrower than the window.
async function screenOf(page: Page) {
  const box = await page.locator(".nuv-sheet__overlay").boundingBox();
  if (!box) throw new Error("no overlay to measure");
  return box;
}

// A press on the page itself, away from any control: a click with a mouse,
// a tap on a touch screen.
function pressAt(page: Page, x: number, y: number, isMobile: boolean) {
  return isMobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
}

test.describe("alert dialog page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/alert-dialog");
  });

  const example = (page: Page, name: string) =>
    page.locator(`[data-preview="alert-dialog/${name}"]`);

  test("the example opens with focus on Cancel, and Cancel closes it", async ({
    page,
    isMobile,
  }) => {
    const trigger = example(page, "basic").getByRole("button", {
      name: "Delete project",
    });

    await press(trigger, isMobile);
    const dialog = page.getByRole("alertdialog", {
      name: "Delete this project?",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/12 files/);
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();

    await press(dialog.getByRole("button", { name: "Cancel" }), isMobile);

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("a press on the page behind doesn't close it, and Escape does", async ({
    page,
    isMobile,
  }) => {
    await press(
      example(page, "basic").getByRole("button", { name: "Delete project" }),
      isMobile,
    );
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();

    await pressAt(page, 5, 5, isMobile);
    // Long enough for a close to have happened.
    await page.waitForTimeout(300);
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("it's a sheet at the bottom of a phone, and centered on a desktop", async ({
    page,
    isMobile,
  }) => {
    await press(
      example(page, "basic").getByRole("button", { name: "Delete project" }),
      isMobile,
    );
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error("nothing to measure");

    if (isMobile) {
      expect(box.x).toBe(0);
      expect(box.width).toBe(viewport.width);
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
    } else {
      expect(box.width).toBe(512);
      expect(box.y).toBeGreaterThan(0);
    }
    await expectOnScreen(page, dialog);
  });

  test("the action can hold the dialog open until its work is done", async ({
    page,
    isMobile,
  }) => {
    const preview = example(page, "pending");
    await press(
      preview.getByRole("button", { name: "Revoke access" }),
      isMobile,
    );
    const dialog = page.getByRole("alertdialog", {
      name: "Revoke Sam's access?",
    });
    await expect(dialog).toBeVisible();

    await press(
      dialog.getByRole("button", { name: "Revoke access" }),
      isMobile,
    );

    // Still open, with both buttons out of use, while the request runs.
    await expect(
      dialog.getByRole("button", { name: "Revoking" }),
    ).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "Keep access" }),
    ).toBeDisabled();
    await expect(dialog).toBeHidden();
    await expect(preview.locator("p")).toHaveText("Sam no longer has access.");
  });

  test("a menu item opens one, and focus goes back to the menu's button", async ({
    page,
    isMobile,
  }) => {
    const preview = example(page, "from-menu");
    const menuButton = preview.getByRole("button", { name: "File" });

    await press(menuButton, isMobile);
    await press(page.getByRole("menuitem", { name: "Delete" }), isMobile);
    const dialog = page.getByRole("alertdialog", {
      name: "Delete report.pdf?",
    });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("menu")).toBeHidden();
    // The menu closing doesn't take focus back out of the dialog.
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();

    await press(dialog.getByRole("button", { name: "Cancel" }), isMobile);
    await expect(dialog).toBeHidden();
    await expect(menuButton).toBeFocused();
    await expect(preview.locator("p")).toHaveText("report.pdf");

    await press(menuButton, isMobile);
    await press(page.getByRole("menuitem", { name: "Delete" }), isMobile);
    await press(
      dialog.getByRole("button", { name: "Delete", exact: true }),
      isMobile,
    );
    await expect(preview.locator("p")).toHaveText(
      "report.pdf is in the trash.",
    );
  });

  test("the playground changes the width and the action's look", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("size").selectOption("sm");
    await playground.getByLabel("intent").selectOption("secondary");
    await playground.getByLabel("children").fill("Archive");
    await playground
      .getByRole("button", { name: "Open with these props" })
      .click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toHaveClass(/nuv-alert-dialog--sm/);
    await expect(dialog.getByRole("button", { name: "Archive" })).toHaveClass(
      /nuv-button--secondary/,
    );
    await expect(playground.locator("pre")).toContainText(
      '<AlertDialogContent size="sm">',
    );
    await expect(playground.locator("pre")).toContainText(
      '<AlertDialogAction intent="secondary">Archive</AlertDialogAction>',
    );
  });
});

test.describe("sheet page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/sheet");
  });

  const example = (page: Page, name: string) =>
    page.locator(`[data-preview="sheet/${name}"]`);

  test("the example opens on the end edge, as tall as the screen, and its close button closes it", async ({
    page,
    isMobile,
  }) => {
    const trigger = example(page, "basic").getByRole("button", {
      name: "Filters",
    });

    await press(trigger, isMobile);
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    const screen = await screenOf(page);
    if (!box) throw new Error("nothing to measure");

    expect(Math.round(box.x + box.width)).toBe(Math.round(screen.width));
    expect(box.y).toBe(0);
    expect(box.height).toBe(screen.height);
    expect(box.width).toBe(isMobile ? screen.width - 48 : 384);

    await press(
      sheet.getByRole("button", { name: "Close", exact: true }),
      isMobile,
    );
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("a press on the strip of page beside it closes it", async ({
    page,
    isMobile,
  }) => {
    await press(
      example(page, "basic").getByRole("button", { name: "Filters" }),
      isMobile,
    );
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();

    await pressAt(page, 10, 200, isMobile);

    await expect(sheet).toBeHidden();
  });

  test("opening puts focus in the first field, and Tab stays inside", async ({
    page,
  }) => {
    await example(page, "basic")
      .getByRole("button", { name: "Filters" })
      .click();
    const sheet = page.getByRole("dialog", { name: "Filters" });

    await expect(
      sheet.getByRole("textbox", { name: "Customer" }),
    ).toBeFocused();
    for (let presses = 0; presses < 8; presses += 1) {
      await page.keyboard.press("Tab");
      expect(
        await sheet.evaluate((panel) => panel.contains(document.activeElement)),
      ).toBe(true);
    }
  });

  test("each side attaches to its own edge", async ({ page, isMobile }) => {
    for (const side of ["start", "end", "top", "bottom"]) {
      const trigger = example(page, "sides").getByRole("button", {
        name: side,
      });
      await trigger.scrollIntoViewIfNeeded();
      await press(trigger, isMobile);
      const sheet = page.getByRole("dialog", { name: `On the ${side} edge` });
      await expect(sheet).toBeVisible();
      const box = await sheet.boundingBox();
      const screen = await screenOf(page);
      if (!box) throw new Error("nothing to measure");
      const right = Math.round(screen.width);

      if (side === "start") expect(box.x).toBe(0);
      if (side === "end") expect(Math.round(box.x + box.width)).toBe(right);
      if (side === "top") expect(box.y).toBe(0);
      if (side === "bottom") {
        expect(Math.round(box.y + box.height)).toBe(screen.height);
      }
      if (side === "top" || side === "bottom") {
        expect(Math.round(box.width)).toBe(right);
        expect(box.height).toBeLessThan(screen.height / 2);
      } else {
        expect(box.height).toBe(screen.height);
      }

      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
    }
  });

  test("a long sheet scrolls its body, and keeps its title and button in view", async ({
    page,
    isMobile,
  }) => {
    // Short enough that twelve lines don't fit.
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    await page.setViewportSize({ width: viewport.width, height: 420 });
    await press(
      example(page, "long").getByRole("button", { name: "Order history" }),
      isMobile,
    );
    const sheet = page.getByRole("dialog", { name: "Order 10248" });
    await expect(sheet).toBeVisible();
    const body = sheet.locator(".nuv-sheet__body");

    expect(
      await body.evaluate((box) => box.scrollHeight > box.clientHeight),
    ).toBe(true);
    await body.evaluate((box) => {
      box.scrollTop = box.scrollHeight;
    });

    await expect(
      sheet.getByRole("heading", { name: "Order 10248" }),
    ).toBeInViewport();
    await expect(sheet.getByRole("button", { name: "Done" })).toBeInViewport();
    await expect(
      sheet.getByText("The second parcel was delivered."),
    ).toBeInViewport();
  });

  test("the menu example opens on the start edge, and its links go where they say", async ({
    page,
    isMobile,
  }) => {
    await press(
      example(page, "menu").getByRole("button", { name: "Menu" }),
      isMobile,
    );
    const sheet = page.getByRole("dialog", { name: "Menu" });
    await expect(sheet).toBeVisible();
    expect((await sheet.boundingBox())?.x).toBe(0);

    await press(sheet.getByRole("link", { name: "Theming" }), isMobile);

    await expect(page).toHaveURL(/\/docs\/theming$/);
  });

  test("the playground moves the sheet and takes its close button away", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    const trigger = playground.getByRole("button", {
      name: "Open with these props",
    });

    await playground.getByLabel("side").selectOption("top");
    await playground.getByLabel("showCloseButton").uncheck();
    await trigger.click();

    const sheet = page.getByRole("dialog", { name: "Order 10248" });
    await expect(sheet).toHaveClass(/nuv-sheet--top/);
    expect((await sheet.boundingBox())?.y).toBe(0);
    await expect(
      sheet.getByRole("button", { name: "Close", exact: true }),
    ).toHaveCount(0);
    await expect(playground.locator("pre")).toContainText(
      '<SheetContent side="top" showCloseButton={false}>',
    );
  });
});

test.describe("hover card page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/hover-card");
  });

  const card = (page: Page) => page.locator(".nuv-hover-card");

  test("resting the pointer on the link shows the card, and leaving hides it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "There's no hover on a touch screen.");
    const link = page
      .locator('[data-preview="hover-card/basic"]')
      .getByRole("link", { name: "Ada Lovelace" });

    await link.hover();
    await expect(card(page)).toContainText("Staff engineer, Payments.");
    await expectOnScreen(page, card(page));

    await page.mouse.move(5, 5);
    await expect(card(page)).toHaveCount(0);
  });

  test("the card stays while the pointer is on it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "There's no hover on a touch screen.");
    const link = page
      .locator('[data-preview="hover-card/timing"]')
      .getByRole("link", { name: "Theming guide" });

    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(card(page)).toBeVisible();
    await card(page).hover();
    // Longer than the 100ms this example waits before closing.
    await page.waitForTimeout(500);

    await expect(card(page)).toBeVisible();
  });

  test("keyboard focus shows the card, and Escape hides it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no keyboard focus to bring.");
    const link = page
      .locator('[data-preview="hover-card/timing"]')
      .getByRole("link", { name: "Theming guide" });

    await link.scrollIntoViewIfNeeded();
    await link.focus();
    await expect(card(page)).toContainText("Presets, density");

    await page.keyboard.press("Escape");
    await expect(card(page)).toHaveCount(0);
    await expect(link).toBeFocused();
  });

  test("a tap follows the link and shows no card", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "This is about touch screens.");
    const problems: string[] = [];
    // The link is a plain one, so following it leaves the page, and that
    // cancels whatever the router was fetching ahead for the sidebar.
    // Safari reports each cancelled fetch as an error. It isn't the page's.
    const note = (text: string) => {
      if (!/_rsc=.*access control checks/.test(text)) problems.push(text);
    };
    page.on("pageerror", (error) => note(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") note(message.text());
    });

    await page
      .locator('[data-preview="hover-card/timing"]')
      .getByRole("link", { name: "Theming guide" })
      .tap();

    await expect(page).toHaveURL(/\/docs\/theming$/);
    await expect(card(page)).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test("a card asked to open sideways still stays on the screen", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A card doesn't open on a touch screen.");
    const preview = page.locator('[data-preview="hover-card/sides"]');

    for (const side of ["left", "right"]) {
      const link = preview.getByRole("link", { name: side });
      await link.scrollIntoViewIfNeeded();
      await link.hover();
      await expect(card(page)).toContainText(`Asked to open on the ${side}`);
      await expectOnScreen(page, card(page));

      await page.keyboard.press("Escape");
      await expect(card(page)).toHaveCount(0);
    }
  });

  test("the playground moves the card above its link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A card doesn't open on a touch screen.");
    const playground = page.locator("[data-playground]");
    const link = playground.getByRole("link", { name: "Hover or focus me" });

    await playground.getByLabel("side").selectOption("top");
    await playground.getByLabel("openDelay").selectOption("0");
    await link.hover();

    await expect(card(page)).toBeVisible();
    const panel = await card(page).boundingBox();
    const anchor = await link.boundingBox();
    if (!panel || !anchor) throw new Error("nothing to measure");
    expect(panel.y + panel.height).toBeLessThanOrEqual(anchor.y);
    await expect(playground.locator("pre")).toContainText(
      "<HoverCard openDelay={0}>",
    );
    await expect(playground.locator("pre")).toContainText(
      '<HoverCardContent side="top">',
    );
  });
});
