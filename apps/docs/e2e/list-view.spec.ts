import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const row = (within: ReturnType<typeof preview>, value: string) =>
  within.locator(`[role="row"][data-value="${value}"]`);
// A row's own text, away from any button in it.
const face = (within: ReturnType<typeof preview>, value: string) =>
  row(within, value).locator("span").first();

test.describe("list view page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/list-view");
  });

  test("it's a grid of rows, and a button in a row does its own thing", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "list-view/basic");
    await expect(area.getByRole("grid", { name: "People" })).toBeVisible();
    await expect(area.getByRole("row")).toHaveCount(4);

    await press(
      area.getByRole("button", { name: "Message Bo Jensen" }),
      isMobile,
    );

    await expect(area.getByRole("status")).toHaveText(
      "Message to Bo Jensen started.",
    );
  });

  test("the arrow keys move between rows, and a letter finds one", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "list-view/basic");
    await row(area, "ada").focus();

    await page.keyboard.press("ArrowDown");
    await expect(row(area, "bo")).toBeFocused();
    await page.keyboard.press("End");
    await expect(row(area, "dan")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(row(area, "ada")).toBeFocused();
    await page.keyboard.press("c");
    await expect(row(area, "cleo")).toBeFocused();
  });

  test("Tab goes from a row to its button and then out of the list", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, "A phone has no Tab key.");
    // Safari leaves anything that isn't a field out of the Tab order
    // unless a setting is changed.
    test.skip(browserName === "webkit", "Safari's Tab skips it.");
    const area = preview(page, "list-view/basic");
    await row(area, "bo").focus();

    await page.keyboard.press("Tab");
    await expect(
      area.getByRole("button", { name: "Message Bo Jensen" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    // Not on to Cleo's button: focus has left the list.
    await expect(area.locator('[role="grid"] :focus')).toHaveCount(0);

    await page.keyboard.press("Shift+Tab");
    await expect(
      area.getByRole("button", { name: "Message Bo Jensen" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(row(area, "bo")).toBeFocused();
  });

  test("only the row Tab is at has its button in the Tab order", async ({
    page,
  }) => {
    const area = preview(page, "list-view/basic");
    const button = (name: string) =>
      area.getByRole("button", { name: `Message ${name}` });

    await expect(button("Ada Lovelace")).not.toHaveAttribute("tabindex", "-1");
    await expect(button("Bo Jensen")).toHaveAttribute("tabindex", "-1");

    await row(area, "bo").focus();

    await expect(button("Bo Jensen")).not.toHaveAttribute("tabindex", "-1");
    await expect(button("Ada Lovelace")).toHaveAttribute("tabindex", "-1");
  });

  test("one row is selected at a time, and what's shown follows it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "list-view/selection");
    await expect(row(area, "team")).toHaveAttribute("aria-selected", "true");
    await expect(area.getByText("Showing: Team")).toBeVisible();

    await press(face(area, "business"), isMobile);

    await expect(row(area, "business")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(row(area, "team")).toHaveAttribute("aria-selected", "false");
    await expect(area.getByText("Showing: Business")).toBeVisible();
  });

  test("several rows are selected one press at a time, and a disabled one isn't", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "list-view/multiple");
    await expect(area.getByRole("grid")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    await expect(area.getByText("1 selected")).toBeVisible();

    await press(face(area, "INV-2042"), isMobile);
    await press(face(area, "INV-2044"), isMobile);
    await expect(area.getByText("3 selected")).toBeVisible();

    await press(face(area, "INV-2043"), isMobile);
    await expect(area.getByText("3 selected")).toBeVisible();

    await press(face(area, "INV-2041"), isMobile);
    await expect(area.getByText("2 selected")).toBeVisible();

    await press(area.getByRole("button", { name: "Clear" }), isMobile);
    await expect(area.getByText("0 selected")).toBeVisible();
  });

  test("a press on a row acts on it, and a press on its button doesn't", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "list-view/action");
    await expect(area.getByRole("status")).toHaveText("Nothing opened yet.");

    await press(face(area, "churn"), isMobile);
    await expect(area.getByRole("status")).toHaveText("Opened Churn by plan.");

    await press(
      area.getByRole("button", { name: "Export Seats in use" }),
      isMobile,
    );
    await expect(area.getByRole("status")).toHaveText("Exported Seats in use.");
  });

  test("Enter acts on the row focus is on", async ({ page, isMobile }) => {
    test.skip(isMobile, "A phone has no Enter key to press on a row.");
    const area = preview(page, "list-view/action");
    await row(area, "q3").focus();

    await page.keyboard.press("Enter");

    await expect(area.getByRole("status")).toHaveText("Opened Q3 revenue.");
  });

  test("the playground changes the list and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const list = area.getByRole("grid", { name: "Invoices" });
    const second = list.locator('[data-value="INV-2042"]');
    await expect(second).toHaveAttribute("aria-selected", "false");

    await area.getByLabel("selectionMode").selectOption("none");
    await area.getByLabel("disabled", { exact: true }).check();

    await expect(second).not.toHaveAttribute("aria-selected");
    await expect(second).toHaveAttribute("aria-disabled", "true");
    await expect(area.locator("pre")).toContainText(
      '<ListView aria-label="Invoices">',
    );
    await expect(area.locator("pre")).toContainText(
      '<ListViewItem value="INV-2042" disabled>',
    );
  });
});
