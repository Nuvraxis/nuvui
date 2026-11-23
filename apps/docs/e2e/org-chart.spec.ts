import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same names turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

test.describe("org chart start page", () => {
  test("says what to install, leads to the component, and draws a company", async ({
    page,
  }) => {
    await open(page, "/docs/org-chart");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/org-chart @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "OrgChart", exact: true }),
    ).toHaveAttribute("href", "/docs/org-chart/org-chart");
    await expect(
      preview(page, "org-chart/basic")
        .getByRole("tree", { name: "Torphy LLC" })
        .getByRole("treeitem"),
    ).toHaveCount(20);
  });
});

test.describe("org chart page", () => {
  test("the head is at the top, with a team of four, and an open position says so", async ({
    page,
  }) => {
    await open(page, "/docs/org-chart/org-chart");
    const chart = preview(page, "org-chart/basic");
    await expect(
      chart.getByRole("treeitem", {
        name: "Emmanuelle Muller, Chief Executive Officer, Operations, 4 direct reports",
      }),
    ).toHaveAttribute("aria-level", "1");
    await expect(
      chart.getByRole("treeitem", { name: /^Open position, / }),
    ).toHaveCount(1);
    await expect(chart.locator(".nuv-org-chart__badge").first()).toHaveText(
      "On leave",
    );
  });

  test("finding someone opens the team they're in and marks their card", async ({
    page,
  }) => {
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/find");
    await area.scrollIntoViewIfNeeded();
    await expect(area.getByRole("treeitem")).toHaveCount(5);

    await area.getByRole("searchbox", { name: "Find a person" }).fill("jast");
    await expect(area.locator("[data-current-match]")).toHaveAttribute(
      "aria-label",
      /^Audrey Jast/,
    );
    await expect(area.locator(".nuv-org-chart__matches")).toHaveText("1 of 2");
    await area.getByRole("searchbox", { name: "Find a person" }).press("Enter");
    await expect(area.locator("[data-current-match]")).toHaveAttribute(
      "aria-label",
      /^Chadrick Jast/,
    );
    await expect(area.locator("[data-current-match]")).toBeInViewport();
  });

  test("a team's button opens and closes it", async ({ page, isMobile }) => {
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/find");
    await area.scrollIntoViewIfNeeded();
    const button = area.getByRole("button", {
      name: "Show Audrey Jast's 4 direct reports",
    });
    await press(button, isMobile);
    await expect(area.getByRole("treeitem")).toHaveCount(9);
    await press(
      area.getByRole("button", { name: "Hide Audrey Jast's 4 direct reports" }),
      isMobile,
    );
    await expect(area.getByRole("treeitem")).toHaveCount(5);
  });

  test("the arrow keys follow the lines, and Space opens a team", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/find");
    await area.getByRole("treeitem", { name: /^Emmanuelle Muller/ }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      area.getByRole("treeitem", { name: /^Rodger Huel/ }),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(
      area.getByRole("treeitem", { name: /^Audrey Jast/ }),
    ).toBeFocused();
    await page.keyboard.press("Space");
    await expect(
      area.getByRole("treeitem", { name: /^Audrey Jast/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("choosing a card writes who it is under the chart", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/selected");
    await area.scrollIntoViewIfNeeded();
    await expect(area.locator("p")).toContainText("Audrey Jast");
    await press(
      area.getByRole("treeitem", { name: /^Leatha Effertz/ }),
      isMobile,
    );
    await expect(area.locator("p")).toContainText(
      "Leatha Effertz, Head of Design. Reports to Emmanuelle Muller. 4 direct reports.",
    );
  });

  test("sideways, a head's reports are to the right of them", async ({
    page,
  }) => {
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/horizontal");
    await area.scrollIntoViewIfNeeded();
    const head = await area
      .getByRole("treeitem", { name: /^Emmanuelle Muller/ })
      .boundingBox();
    const report = await area
      .getByRole("treeitem", { name: /^Rodger Huel/ })
      .boundingBox();
    expect(report?.x ?? 0).toBeGreaterThan((head?.x ?? 0) + (head?.width ?? 0));
  });

  test("a card of its own is named by what it draws", async ({ page }) => {
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/custom-card");
    await expect(
      area.getByRole("treeitem", { name: /^Rodger Huel\s?Marketing/ }),
    ).toHaveCount(1);
  });

  test("the buttons zoom in and out, and fit puts every card in the frame", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/org-chart/org-chart");
    const area = preview(page, "org-chart/basic");
    const zoom = () =>
      area
        .locator(".nuv-org-chart__layer")
        .evaluate((element) =>
          Number(
            /scale\(([\d.]+)\)/.exec(
              (element as HTMLElement).style.transform,
            )?.[1],
          ),
        );
    const before = await zoom();
    await press(area.getByRole("button", { name: "Zoom in" }), isMobile);
    await expect.poll(zoom).toBeCloseTo(before * 1.25, 3);
    await press(area.getByRole("button", { name: "Zoom out" }), isMobile);
    await expect.poll(zoom).toBeCloseTo(before, 3);

    await press(area.getByRole("button", { name: "Fit the chart" }), isMobile);
    const frame = await area.locator(".nuv-org-chart__frame").boundingBox();
    await expect
      .poll(async () => {
        const cards = await area.locator(".nuv-org-chart__card").all();
        for (const card of cards) {
          const box = await card.boundingBox();
          if (!box || !frame) return false;
          if (box.x < frame.x || box.x + box.width > frame.x + frame.width) {
            return false;
          }
        }
        return true;
      })
      .toBe(true);
  });

  test("passes axe", async ({ page }) => {
    await open(page, "/docs/org-chart/org-chart");
    // The rendered examples, not the code blocks beside them, which are
    // the docs' and not the chart's.
    const results = await new AxeBuilder({ page })
      .include('[data-preview="org-chart/basic"] > div:first-child')
      .include('[data-preview="org-chart/find"] > div:first-child')
      .include('[data-preview="org-chart/custom-card"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
