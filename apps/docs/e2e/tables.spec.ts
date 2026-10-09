import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const pages = [
  "",
  "/table",
  "/data-table",
  "/sorting",
  "/filtering",
  "/pagination",
  "/row-selection",
  "/column-visibility",
  "/column-pinning",
  "/column-resizing",
  "/expanding",
  "/server",
  "/virtualization",
  "/migrating",
];

// The rows of the body, without the header's.
const rows = (within: Locator) => within.locator("tbody tr");
const firstNames = async (within: Locator, count = 3) =>
  (await rows(within).locator("th").allTextContents()).slice(0, count);

for (const path of pages) {
  test(`/docs/table${path} has no accessibility violations and doesn't scroll sideways`, async ({
    page,
  }) => {
    await open(page, `/docs/table${path}`);
    const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
    expect(results.violations).toEqual([]);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test.describe("the table page", () => {
  test("the example is a named table with headings for its columns and rows", async ({
    page,
  }) => {
    await open(page, "/docs/table/table");
    const example = preview(page, "table/basic");
    const table = example.getByRole("table", {
      name: "Invoices sent in October",
    });
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Customer" }),
    ).toHaveAttribute("scope", "col");
    await expect(
      table.getByRole("rowheader", { name: "INV-002" }),
    ).toHaveAttribute("scope", "row");
  });

  test("the box of a wide table can be scrolled from the keyboard, and its first column stays", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/table");
    const example = preview(page, "table/sticky");
    const box = example.locator(".nuv-table-container");
    await box.scrollIntoViewIfNeeded();
    // Wide enough on a desktop that only the rows scroll.
    test.skip(!isMobile, "the table fits a wide screen");
    await expect(box).toHaveAttribute("tabindex", "0");
    await expect(box).toHaveRole("region");

    const heading = example.getByRole("rowheader", { name: "Austria" });
    const before = await heading.boundingBox();
    await box.evaluate((element) => {
      element.scrollLeft = 80;
    });
    await expect.poll(() => box.evaluate((el) => el.scrollLeft)).toBe(80);
    const after = await heading.boundingBox();
    expect(Math.round(after?.x ?? 0)).toBe(Math.round(before?.x ?? -1));
  });
});

test.describe("the data table", () => {
  test("is in the page's HTML before any script runs", async ({ request }) => {
    const response = await request.get("/docs/table/data-table");
    const html = await response.text();
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain('class="nuv-table"');
  });

  test("React takes the page over without complaint", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    await open(page, "/docs/table/data-table");
    await expect(
      preview(page, "data-table/basic").getByRole("table", { name: "People" }),
    ).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("sorts by a heading, and says so", async ({ page, isMobile }) => {
    await open(page, "/docs/table/sorting");
    const example = preview(page, "data-table/sorting");
    const heading = example.getByRole("columnheader", { name: "Name" });
    await expect(heading).toHaveAttribute("aria-sort", "ascending");
    expect(await firstNames(example, 2)).toEqual(["Ada Lovelace", "Bo Jensen"]);

    await press(heading.getByRole("button"), isMobile);
    await expect(heading).toHaveAttribute("aria-sort", "descending");
    expect(await firstNames(example, 1)).toEqual(["Hana Sato"]);
    await expect(example.locator(".nuv-data-table__status")).toHaveText(
      "Sorted by Name, descending",
    );
    // The email column can't be sorted, so it has no button.
    await expect(
      example.getByRole("columnheader", { name: "Email" }).getByRole("button"),
    ).toHaveCount(0);
  });

  test("the keyboard sorts", async ({ page }) => {
    await open(page, "/docs/table/sorting");
    const example = preview(page, "data-table/sorting");
    const heading = example.getByRole("columnheader", { name: "Team" });
    await heading.getByRole("button").focus();
    await page.keyboard.press("Enter");
    await expect(heading).toHaveAttribute("aria-sort", "ascending");
    await page.keyboard.press("Space");
    await expect(heading).toHaveAttribute("aria-sort", "descending");
  });

  test("the search field and a column's filter narrow the rows", async ({
    page,
  }) => {
    await open(page, "/docs/table/filtering");
    const example = preview(page, "data-table/filtering");
    await example.getByRole("searchbox", { name: "Search" }).fill("finance");
    await expect(rows(example)).toHaveCount(5);
    await expect(example.locator(".nuv-data-table__status")).toHaveText(
      "6 rows",
    );
    await example.getByRole("combobox", { name: "Role" }).selectOption("Admin");
    await expect(rows(example)).toHaveCount(2);

    await example.getByRole("searchbox", { name: "Search" }).fill("zzz");
    await expect(example.getByText("No rows match.")).toBeVisible();
    await example.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows(example)).toHaveCount(5);
    await expect(example.getByRole("combobox", { name: "Role" })).toHaveValue(
      "",
    );
  });

  test("moves between pages, and a button with nowhere to go keeps focus", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/pagination");
    const example = preview(page, "data-table/pagination");
    const bar = example.getByRole("group", { name: "Pagination" });
    await expect(bar.getByText("Page 1 of 5")).toBeVisible();
    await press(bar.getByRole("button", { name: "Last page" }), isMobile);
    await expect(bar.getByText("Page 5 of 5")).toBeVisible();
    await expect(rows(example)).toHaveCount(4);

    const next = bar.getByRole("button", { name: "Next page" });
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(next).toBeFocused();
    await expect(bar.getByText("Page 5 of 5")).toBeVisible();

    await bar
      .getByRole("combobox", { name: "Rows per page" })
      .selectOption("25");
    await expect(rows(example)).toHaveCount(24);
  });

  test("selects rows, acts on them, and hands focus back when the bar goes", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/row-selection");
    const example = preview(page, "data-table/selection");
    await press(
      example.getByRole("checkbox", { name: "Select Bo Jensen" }),
      isMobile,
    );
    await press(
      example.getByRole("checkbox", { name: "Select Cleo Park" }),
      isMobile,
    );
    const bar = example.getByRole("group", { name: "Selected rows" });
    await expect(bar.getByText("2 selected")).toBeVisible();
    await expect(
      example.getByRole("checkbox", { name: "Select all rows" }),
    ).toHaveAttribute("data-state", "indeterminate");

    await bar.getByRole("button", { name: "Remove" }).focus();
    await page.keyboard.press("Enter");
    await expect(rows(example)).toHaveCount(6);
    await expect(bar).toBeHidden();
    await expect(
      example.getByRole("checkbox", { name: "Select all rows" }),
    ).toBeFocused();
  });

  test("the column chooser shows a hidden column and hides a shown one", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/column-visibility");
    const example = preview(page, "data-table/visibility");
    await expect(
      example.getByRole("columnheader", { name: "Joined" }),
    ).toHaveCount(0);
    await press(example.getByRole("button", { name: "Columns" }), isMobile);
    // The name column can't be hidden, so it isn't offered.
    await expect(page.getByRole("menuitemcheckbox")).toHaveText([
      "Email",
      "Team",
      "Role",
      "Joined",
    ]);
    await press(
      page.getByRole("menuitemcheckbox", { name: "Joined" }),
      isMobile,
    );
    await press(
      page.getByRole("menuitemcheckbox", { name: "Email" }),
      isMobile,
    );
    await page.keyboard.press("Escape");
    await expect(
      example.getByRole("columnheader", { name: "Joined" }),
    ).toBeVisible();
    await expect(
      example.getByRole("columnheader", { name: "Email" }),
    ).toHaveCount(0);
  });

  test("pinned columns stay put while the rest scrolls", async ({ page }) => {
    await open(page, "/docs/table/column-pinning");
    const example = preview(page, "data-table/pinning");
    const box = example.locator(".nuv-table-container");
    await box.scrollIntoViewIfNeeded();
    const name = example.getByRole("columnheader", { name: "Name" });
    const seats = example.getByRole("columnheader", { name: "Seats" });
    const team = example.getByRole("columnheader", { name: "Team" });
    const before = {
      name: await name.boundingBox(),
      seats: await seats.boundingBox(),
      team: await team.boundingBox(),
    };
    await box.evaluate((element) => {
      element.scrollLeft = 60;
    });
    await expect.poll(() => box.evaluate((el) => el.scrollLeft)).toBe(60);
    const round = (value: number | undefined) => Math.round(value ?? -1);
    expect(round((await name.boundingBox())?.x)).toBe(round(before.name?.x));
    expect(round((await seats.boundingBox())?.x)).toBe(round(before.seats?.x));
    expect(round((await team.boundingBox())?.x)).toBe(
      round((before.team?.x ?? 0) - 60),
    );
  });

  test("a column is resized from the keyboard", async ({ page }) => {
    await open(page, "/docs/table/column-resizing");
    const example = preview(page, "data-table/resizing");
    const grip = example.getByRole("separator", { name: "Resize Name" });
    await expect(grip).toHaveAttribute("aria-valuenow", "200");
    await grip.focus();
    await page.keyboard.press("ArrowRight");
    await expect(grip).toHaveAttribute("aria-valuenow", "216");
    await page.keyboard.press("Home");
    await expect(grip).toHaveAttribute("aria-valuenow", "120");
    await page.keyboard.press("Enter");
    await expect(grip).toHaveAttribute("aria-valuenow", "200");
    // The role column keeps its width, so it has no grip.
    await expect(
      example.getByRole("separator", { name: "Resize Role" }),
    ).toHaveCount(0);
  });

  test("a row opens a panel, and a tree opens the rows under a row", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/expanding");
    const panels = preview(page, "data-table/expanding");
    const toggle = panels.getByRole("button", {
      name: "Show details for Bo Jensen",
    });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await press(toggle, isMobile);
    await expect(panels.getByText("bo@example.com")).toBeVisible();
    await expect(
      panels.getByRole("button", { name: "Hide details for Bo Jensen" }),
    ).toHaveAttribute("aria-expanded", "true");

    const tree = preview(page, "data-table/tree");
    await expect(rows(tree)).toHaveCount(5);
    await press(
      tree.getByRole("button", { name: "Show details for Screens" }),
      isMobile,
    );
    await expect(rows(tree)).toHaveCount(7);
    await expect(tree.getByRole("rowheader", { name: "Phone" })).toBeVisible();
  });

  test("shows placeholders, an empty state and an error", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/data-table");
    const example = preview(page, "data-table/states");
    const table = example.getByRole("table", { name: "People" });
    await expect(table).toHaveAttribute("aria-busy", "true");
    await expect(example.locator(".nuv-skeleton")).toHaveCount(12);

    await press(example.getByRole("radio", { name: "Empty" }), isMobile);
    await expect(
      example.getByText("Nobody has been invited yet."),
    ).toBeVisible();
    await expect(table).not.toHaveAttribute("aria-busy");

    await press(example.getByRole("radio", { name: "Error" }), isMobile);
    await expect(example.getByRole("alert")).toContainText(
      "The rows couldn't be loaded.",
    );
    await press(example.getByRole("button", { name: "Try again" }), isMobile);
    await expect(table).toHaveAttribute("aria-busy", "true");
  });
});

test.describe("the server mode", () => {
  test("asks for a page, a sort and a search, and shows what comes back", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/table/server");
    const example = preview(page, "data-table/server");
    const table = example.getByRole("table", { name: "People" });
    await expect(rows(example).first().locator("th")).toHaveText(
      "Ada Lovelace",
    );
    await expect(example.getByText("1–5 of 24")).toBeVisible();

    await press(example.getByRole("button", { name: "Next page" }), isMobile);
    // The rows it had stay until the next ones arrive.
    await expect(table).toHaveAttribute("aria-busy", "true");
    await expect(rows(example)).toHaveCount(5);
    await expect(rows(example).first().locator("th")).toHaveText(
      "Fatima Zahra",
    );
    await expect(example.locator(".nuv-data-table__status")).toHaveText(
      "Page 2 of 5",
    );

    // A sort goes back to the first page.
    await press(
      example.getByRole("columnheader", { name: "Name" }).getByRole("button"),
      isMobile,
    );
    await expect(example.getByText("Page 1 of 5")).toBeVisible();
    await expect(rows(example).first().locator("th")).toHaveText(
      "Ada Lovelace",
    );

    await example.getByRole("searchbox", { name: "Search" }).fill("design");
    await expect(example.getByText("1–5 of 6")).toBeVisible();
    await expect(example.locator(".nuv-data-table__status")).toHaveText(
      "6 rows",
    );
  });
});

test.describe("the virtual table", () => {
  test("draws a window of ten thousand rows, and keeps the row that has focus", async ({
    page,
  }) => {
    await open(page, "/docs/table/virtualization");
    const example = preview(page, "data-table/virtual");
    const table = example.getByRole("table", { name: "Ten thousand people" });
    await expect(table).toHaveAttribute("aria-rowcount", "10001");
    const drawn = example.locator("tbody tr[data-index]");
    await expect.poll(() => drawn.count()).toBeGreaterThan(5);
    expect(await drawn.count()).toBeLessThan(60);

    const box = example.locator(".nuv-table-container");
    const second = example.getByRole("checkbox", {
      name: "Select Bo Jensen 1",
      exact: true,
    });
    await second.focus();
    await box.evaluate((element) => {
      element.scrollTop = 200_000;
    });
    await expect
      .poll(() => drawn.nth(1).getAttribute("data-index").then(Number))
      .toBeGreaterThan(4000);
    await expect(second).toBeFocused();
    await expect(example.locator("thead th").first()).toBeInViewport();
  });
});
