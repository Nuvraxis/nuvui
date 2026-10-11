import { expect, type Page, test } from "@playwright/test";
import { open, press, scrollSettled } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

test.describe("resizable page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/resizable");
  });

  test("the handle says the size of the panel before it, and what it resizes", async ({
    page,
  }) => {
    const handle = preview(page, "resizable/basic").getByRole("separator", {
      name: "Resize folders",
    });

    await expect(handle).toHaveAttribute("aria-valuenow", "35");
    await expect(handle).toHaveAttribute("aria-valuemin", "20");
    await expect(handle).toHaveAttribute("aria-valuemax", "70");
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
  });

  test("the arrow keys move the handle, and Home and End take it as far as it goes", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const handle = preview(page, "resizable/basic").getByRole("separator");
    await handle.focus();

    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "40");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(handle).toHaveAttribute("aria-valuenow", "30");
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", "20");
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "70");
  });

  test("a drag moves the handle with the pointer", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A drag with a mouse.");
    const area = preview(page, "resizable/vertical");
    const handle = area.getByRole("separator");
    await area.scrollIntoViewIfNeeded();
    await scrollSettled(page);
    const before = await handle.boundingBox();
    if (!before) throw new Error("the handle isn't there");
    const x = before.x + before.width / 2;

    await page.mouse.move(x, before.y);
    await expect(handle).toHaveAttribute("data-separator", "hover");
    await page.mouse.down();
    await page.mouse.move(x, before.y + 40, { steps: 4 });
    await expect(handle).toHaveAttribute("data-separator", "active");
    await page.mouse.up();

    await expect
      .poll(async () => (await handle.boundingBox())?.y)
      .toBeCloseTo(before.y + 40, 0);
    await expect(handle).not.toHaveAttribute("aria-valuenow", "60");
  });

  test("the button folds the panel away and opens it, and says which", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "resizable/collapsible");
    const handle = area.getByRole("separator");
    const button = area.getByRole("button");
    await expect(button).toHaveText("Hide navigation");
    await expect(button).toHaveAttribute("aria-expanded", "true");

    await press(button, isMobile);
    await expect(handle).toHaveAttribute("aria-valuenow", "0");
    await expect(button).toHaveText("Show navigation");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    // Folded, the panel's content is out of reach.
    await expect(area.locator("#resizable-example-nav > [inert]")).toHaveCount(
      1,
    );

    await press(button, isMobile);
    await expect(handle).toHaveAttribute("aria-valuenow", "30");
    await expect(button).toHaveText("Hide navigation");
    await expect(area.locator("#resizable-example-nav > [inert]")).toHaveCount(
      0,
    );
  });

  test("Enter on the handle folds the panel and opens it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no Enter key to hold focus with.");
    const area = preview(page, "resizable/collapsible");
    const handle = area.getByRole("separator");
    await handle.focus();

    await page.keyboard.press("Enter");
    await expect(handle).toHaveAttribute("aria-valuenow", "0");
    await expect(area.getByRole("button")).toHaveText("Show navigation");

    await page.keyboard.press("Enter");
    await expect(handle).toHaveAttribute("aria-valuenow", "30");
  });

  test("the sizes are still there when the page is loaded again", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const handle = () =>
      preview(page, "resizable/saved").getByRole("separator");
    await expect(handle()).toHaveAttribute("aria-valuenow", "50");
    await handle().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(handle()).toHaveAttribute("aria-valuenow", "60");
    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem("nuv-resizable:docs-resizable-saved"),
        ),
      )
      .toBe('{"list":60,"detail":40}');

    await open(page, "/docs/components/resizable");

    await expect(handle()).toHaveAttribute("aria-valuenow", "60");
  });

  test("panels inside a panel have a handle of their own, lying the other way", async ({
    page,
  }) => {
    const area = preview(page, "resizable/nested");

    await expect(
      area.getByRole("separator", { name: "Resize files" }),
    ).toHaveAttribute("aria-orientation", "vertical");
    await expect(
      area.getByRole("separator", { name: "Resize editor" }),
    ).toHaveAttribute("aria-orientation", "horizontal");
  });

  test("the playground changes the panels and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const handle = area.getByRole("separator");
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    await expect(handle.locator(".nuv-resizable__grip")).toHaveCount(1);

    await area.getByLabel("orientation").selectOption("vertical");
    await area.getByLabel("withGrip").uncheck();
    await area.getByLabel("disabled", { exact: true }).check();

    await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    await expect(handle.locator(".nuv-resizable__grip")).toHaveCount(0);
    await expect(handle).toHaveAttribute("aria-disabled", "true");
    await expect(area.locator("pre")).toContainText(
      '<Resizable orientation="vertical" disabled>',
    );
    await expect(area.locator("pre")).toContainText("<ResizableHandle />");
  });
});
