import { expect, type Page, test } from "@playwright/test";
import { open, press, scrollSettled } from "./helpers";

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

// Every row an example shows, top to bottom, by its value.
const order = (within: ReturnType<typeof preview>) =>
  within
    .getByRole("tree")
    .evaluate((tree) =>
      Array.from(
        tree.querySelectorAll<HTMLElement>('[role="treeitem"]'),
        (item) => item.dataset.value,
      ),
    );

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
    // Focus has left the tree: none of its rows has it.
    await expect(area.locator('[role="treeitem"]:focus')).toHaveCount(0);
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

  test("Alt and an arrow moves a row, focus goes with it and a screen reader is told", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "tree/move");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await row("Install").focus();

    await page.keyboard.press("Alt+ArrowDown");
    await expect
      .poll(() => order(area))
      .toEqual([
        "guides",
        "theme",
        "install",
        "forms",
        "reference",
        "drafts",
        "changelog",
      ]);
    await expect(row("Install")).toBeFocused();
    await expect(area.getByRole("status")).toHaveText(
      "Moved Install before Forms",
    );

    // Past the last page of the section, and out of it.
    await page.keyboard.press("Alt+ArrowDown");
    await page.keyboard.press("Alt+ArrowDown");
    await expect(area.getByRole("status")).toHaveText(
      "Moved Install before Reference",
    );
    // Into the next section, which is closed and opens to show it.
    await page.keyboard.press("Alt+ArrowDown");
    await expect(row("Reference")).toHaveAttribute("aria-expanded", "true");
    await expect
      .poll(() => order(area))
      .toEqual([
        "guides",
        "theme",
        "forms",
        "reference",
        "tokens",
        "install",
        "drafts",
        "changelog",
      ]);
    await expect(row("Install")).toBeFocused();
  });

  test("a page can't be given pages, so the keys pass it by", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "tree/move");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await row("Changelog").focus();

    // Above the last page is inside Drafts, a section with nothing in it.
    await page.keyboard.press("Alt+ArrowUp");
    await expect(row("Drafts")).toHaveAttribute("aria-expanded", "true");
    await expect(
      row("Drafts").getByRole("treeitem", { name: "Changelog" }),
    ).toBeFocused();

    // Back down and it's after Drafts, and there's nowhere after that.
    await page.keyboard.press("Alt+ArrowDown");
    await page.keyboard.press("Alt+ArrowDown");
    await expect
      .poll(() => order(area))
      .toEqual([
        "guides",
        "install",
        "theme",
        "forms",
        "reference",
        "drafts",
        "changelog",
      ]);
    await expect(row("Drafts")).not.toHaveAttribute("aria-expanded");
  });

  test("a row is dragged to a new place, with a mark where it would go", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "A finger picks a row up by holding, which the tree's own tests cover.",
    );
    const area = preview(page, "tree/move");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await area.scrollIntoViewIfNeeded();
    await scrollSettled(page);
    // A point on a row: halfway along, and `part` of the way down.
    const on = async (name: string, part: number) => {
      const box = await face(area, name).boundingBox();
      if (!box) throw new Error(`no row called ${name}`);
      return { x: box.x + box.width / 2, y: box.y + box.height * part };
    };
    const carry = async (name: string, to: string, part: number) => {
      const from = await on(name, 0.5);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x, from.y + 6, { steps: 2 });
      const end = await on(to, part);
      await page.mouse.move(end.x, end.y, { steps: 5 });
    };

    // To the top of a row: before it.
    await carry("Forms", "Install", 0.1);
    await expect(row("Install")).toHaveAttribute("data-drop", "before");
    await expect(row("Forms")).toHaveAttribute("data-dragging", "");
    await page.mouse.up();
    await expect
      .poll(() => order(area))
      .toEqual([
        "guides",
        "forms",
        "install",
        "theme",
        "reference",
        "drafts",
        "changelog",
      ]);
    await expect(row("Install")).not.toHaveAttribute("data-drop");
    await expect(row("Forms")).not.toHaveAttribute("data-dragging");
    await expect(row("Forms")).toBeFocused();

    // To the middle of a section: inside it, and it opens.
    await carry("Choose a theme", "Reference", 0.5);
    await expect(row("Reference")).toHaveAttribute("data-drop", "inside");
    await page.mouse.up();
    await expect(row("Reference")).toHaveAttribute("aria-expanded", "true");
    await expect(
      row("Reference").getByRole("treeitem", { name: "Choose a theme" }),
    ).toBeVisible();
  });

  test("Escape in the middle of a drag puts the row back", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "A finger picks a row up by holding, which the tree's own tests cover.",
    );
    const area = preview(page, "tree/move");
    const row = (name: string) =>
      area.getByRole("treeitem", { name, exact: true });
    await area.scrollIntoViewIfNeeded();
    await scrollSettled(page);
    const from = await face(area, "Install").boundingBox();
    const to = await face(area, "Drafts").boundingBox();
    if (!from || !to) throw new Error("the rows aren't there");

    await page.mouse.move(from.x + 40, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 40, from.y + from.height / 2 + 6, {
      steps: 2,
    });
    await page.mouse.move(to.x + 40, to.y + to.height / 2, { steps: 5 });
    await expect(row("Drafts")).toHaveAttribute("data-drop", "inside");

    await page.keyboard.press("Escape");
    await expect(row("Drafts")).not.toHaveAttribute("data-drop");
    await page.mouse.up();

    await expect(row("Drafts")).not.toHaveAttribute("aria-expanded");
    await expect
      .poll(() => order(area))
      .toEqual([
        "guides",
        "install",
        "theme",
        "forms",
        "reference",
        "drafts",
        "changelog",
      ]);
  });

  test("the button puts every row back where it started", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "tree/move");
    await area.getByRole("treeitem", { name: "Guides", exact: true }).focus();
    await page.keyboard.press("Alt+ArrowDown");
    await expect.poll(async () => (await order(area))[0]).toBe("reference");

    await area.getByRole("button", { name: "Put back" }).click();

    await expect.poll(async () => (await order(area))[0]).toBe("guides");
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
