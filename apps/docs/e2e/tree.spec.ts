import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
// The part of a row that's pressed, which isn't the rows inside it.
const face = (within: ReturnType<typeof preview>, name: string) =>
  within
    .getByRole("treeitem", { name, exact: true })
    .locator("> .nuv-tree__row");

test.describe("tree page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/tree");
  });

  test("a press opens a row and shows the rows inside it, and another closes it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "tree/basic");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await expect(row("setup.ts")).toHaveCount(0);

    await press(face(area, "test"), isMobile);
    await expect(row("test")).toHaveAttribute("aria-expanded", "true");
    await expect(row("setup.ts")).toBeVisible();

    await press(face(area, "test"), isMobile);
    await expect(row("setup.ts")).toHaveCount(0);
  });

  test("the arrow keys move through the rows, into a row and out of it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "tree/basic");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await row("src").focus();

    await page.keyboard.press("ArrowDown");
    await expect(row("components")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(row("components")).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowLeft");
    await expect(row("src")).toBeFocused();
    await page.keyboard.press("End");
    await expect(row("README.md")).toBeFocused();
    await page.keyboard.press("p");
    await expect(row("package.json")).toBeFocused();
  });

  test("the tree is one stop for Tab", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, "A phone has no Tab key.");
    // Safari leaves anything that isn't a field out of the Tab order
    // unless a setting is changed.
    test.skip(browserName === "webkit", "Safari's Tab skips it.");
    const area = preview(page, "tree/controlled");
    await area.getByRole("button", { name: "Close all" }).focus();

    await page.keyboard.press("Tab");
    await expect(
      area.getByRole("treeitem", { name: "Guides", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(area.getByRole("treeitem")).not.toBeFocused();
  });

  test("one row is selected at a time, and what's shown follows it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "tree/selection");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await expect(row("Platform")).toHaveAttribute("aria-selected", "true");
    await expect(area.getByText("Showing: Platform")).toBeVisible();

    await press(face(area, "Design"), isMobile);

    await expect(row("Design")).toHaveAttribute("aria-selected", "true");
    await expect(row("Platform")).toHaveAttribute("aria-selected", "false");
    await expect(area.getByText("Showing: Design")).toBeVisible();
  });

  test("several rows are selected one press at a time, and a disabled one isn't", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "tree/multiple");
    await expect(area.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    await expect(area.getByText("1 selected")).toBeVisible();

    await press(face(area, "q1.pdf"), isMobile);
    await press(face(area, "notes.md"), isMobile);
    await expect(area.getByText("3 selected")).toBeVisible();

    await press(face(area, "q4.pdf"), isMobile);
    await expect(area.getByText("3 selected")).toBeVisible();

    await press(face(area, "q1.pdf"), isMobile);
    await expect(area.getByText("2 selected")).toBeVisible();
  });

  test("the buttons open every row and close them all", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "tree/controlled");
    await expect(area.getByRole("treeitem")).toHaveCount(4);

    await press(area.getByRole("button", { name: "Open all" }), isMobile);
    await expect(area.getByRole("treeitem")).toHaveCount(7);

    await press(area.getByRole("button", { name: "Close all" }), isMobile);
    await expect(area.getByRole("treeitem")).toHaveCount(2);
  });

  test("the playground changes the tree and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const tree = area.getByRole("tree", { name: "Project files" });
    await expect(
      tree.getByRole("treeitem", { name: "index.ts" }),
    ).toHaveAttribute("aria-selected", "false");

    await area.getByLabel("selectionMode").selectOption("none");
    await area.getByLabel("disabled", { exact: true }).check();

    await expect(
      tree.getByRole("treeitem", { name: "index.ts" }),
    ).not.toHaveAttribute("aria-selected");
    await expect(
      tree.getByRole("treeitem", { name: "tree.tsx" }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(area.locator("pre")).toContainText(
      '<Tree aria-label="Project files" defaultExpanded={["src"]}>',
    );
    await expect(area.locator("pre")).toContainText(
      '<TreeItem value="src/tree.tsx" label="tree.tsx" disabled />',
    );
  });
});
