import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

test.describe("navbar page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/navbar");
  });

  test("on a wide screen the links are in the bar, with the open page marked", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone isn't this wide.");
    const area = preview(page, "navbar/basic");
    const nav = area.getByRole("navigation", { name: "Main" });

    await expect(nav.getByRole("link")).toHaveText([
      "Orders",
      "Customers",
      "Reports",
    ]);
    await expect(nav.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(area.getByRole("button", { name: "Menu" })).toHaveCount(0);
  });

  test("on a narrow screen a button opens the links in a panel, and a link closes it", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const area = preview(page, "navbar/basic");
    await expect(area.getByRole("navigation", { name: "Main" })).toHaveCount(0);

    const toggle = area.getByRole("button", { name: "Menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await press(toggle, isMobile);

    const panel = page.getByRole("dialog", { name: "Menu" });
    await expect(panel.getByRole("link")).toHaveCount(3);
    await press(panel.getByRole("link", { name: "Reports" }), isMobile);
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#reports$/);
  });

  test("the playground changes the bar and the code together", async ({
    page,
  }) => {
    const area = playground(page);

    await area.getByLabel("collapse").selectOption("lg");
    await area.getByLabel("current").selectOption("Reports");

    await expect(area.locator(".nuv-navbar")).toHaveClass(
      /nuv-navbar--collapse-lg/,
    );
    await expect(area.locator("pre")).toContainText('<Navbar collapse="lg">');
    await expect(area.locator("pre")).toContainText(
      '<NavbarLink href="/reports" current>Reports</NavbarLink>',
    );
  });
});

test.describe("select page, in a sentence", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/select");
  });

  test("a select in a sentence has no box, and choosing changes the sentence", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "select/inline");
    const period = area.getByRole("combobox", { name: "Period" });
    await expect(period).toHaveClass(/nuv-select--inline/);
    await expect(period).toHaveCSS("border-top-width", "0px");
    await expect(area.getByText("164 orders")).toBeVisible();

    await press(period, isMobile);
    await press(page.getByRole("option", { name: "the last year" }), isMobile);

    await expect(period).toHaveText("the last year");
    await expect(area.getByText("1912 orders")).toBeVisible();
  });
});

test.describe("sheet page, dragging", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/sheet");
  });

  // What a finger sends to an element, dragged down by this much and held
  // there, so that letting go isn't a flick.
  const drag = (page: Page, name: string, by: number) =>
    page
      .getByRole("dialog", { name })
      .getByRole("heading", { name })
      .evaluate(async (heading, distance) => {
        const send = (type: string, y: number) =>
          heading.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              button: 0,
              pointerId: 9,
              pointerType: "touch",
              clientX: 100,
              clientY: y,
            }),
          );
        send("pointerdown", 100);
        send("pointermove", 100 + distance / 2);
        send("pointermove", 100 + distance);
        await new Promise((resolve) => setTimeout(resolve, 40));
        send("pointermove", 100 + distance);
        send("pointerup", 100 + distance);
      }, by);

  test("a sheet that can be swiped comes back from a short drag, and closes after a long one", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "sheet/swipe");
    await press(area.getByRole("button", { name: "Share" }), isMobile);
    const sheet = page.getByRole("dialog", { name: "Share this report" });
    await expect(sheet).toBeVisible();

    await drag(page, "Share this report", 30);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveCSS("transform", "none");

    await drag(page, "Share this report", 400);
    await expect(sheet).toBeHidden();
  });

  test("the handle of a sheet with no stops closes it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "sheet/swipe");
    await press(area.getByRole("button", { name: "Share" }), isMobile);
    const sheet = page.getByRole("dialog", { name: "Share this report" });

    await sheet.getByRole("button", { name: "Dismiss" }).focus();
    await page.keyboard.press("Enter");

    await expect(sheet).toBeHidden();
  });

  test("a sheet with stops opens at the first, and its handle and a drag move it between them", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "sheet/stops");
    await press(area.getByRole("button", { name: "Recent orders" }), isMobile);
    const sheet = page.getByRole("dialog", { name: "Recent orders" });
    await expect(sheet).toBeVisible();
    const screen = page.viewportSize()?.height ?? 0;
    const off = async (stop: number) =>
      Math.abs(((await sheet.boundingBox())?.height ?? 0) - screen * stop);
    expect(await off(0.35)).toBeLessThanOrEqual(2);

    await sheet.getByRole("button", { name: "Change size" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => off(0.9)).toBeLessThanOrEqual(2);

    // Dragged most of the way back down, it settles on the smaller stop.
    await drag(page, "Recent orders", Math.round(screen * 0.5));
    await expect.poll(() => off(0.35)).toBeLessThanOrEqual(2);
    await expect(sheet).toBeVisible();

    // And from there, well under it, it closes.
    await drag(page, "Recent orders", Math.round(screen * 0.3));
    await expect(sheet).toBeHidden();
  });
});
