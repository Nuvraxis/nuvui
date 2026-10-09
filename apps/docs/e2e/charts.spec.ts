import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const pages = [
  "",
  "/chart",
  "/area",
  "/bar",
  "/line",
  "/pie",
  "/radar",
  "/radial",
  "/tooltip",
  "/composed",
  "/scatter",
];

const fill = (shape: Locator) =>
  shape.evaluate((element) => getComputedStyle(element).fill);
const bars = (within: Locator) => within.locator(".recharts-rectangle");
const tooltip = (within: Locator) => within.locator(".nuv-chart__tooltip");
const legend = (within: Locator) =>
  within.locator(".nuv-chart__legend").getByRole("listitem");

// Motion is reduced in all of these, so a chart is in place as soon as it's
// drawn and a bar can be measured or hovered straight away.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const path of pages) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`/docs/charts${path} has no accessibility violations in ${colorScheme} and doesn't scroll sideways`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await open(page, `/docs/charts${path}`);
      // Every chart on the page drawn, so axe sees them.
      const charts = page.locator(".nuv-chart__plot");
      for (let index = 0; index < (await charts.count()); index += 1) {
        await expect(charts.nth(index).locator("svg").first()).toBeVisible();
      }
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
}

test.describe("the container page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/charts/chart");
  });

  test("the chart has the container's name and fills its box", async ({
    page,
  }) => {
    const example = preview(page, "charts/basic");
    const chart = example.getByRole("application", {
      name: "Visitors by month, on desktop and mobile",
    });
    await expect(chart).toBeVisible();
    const [svg, plot] = await Promise.all([
      chart.boundingBox(),
      example.locator(".nuv-chart__plot").boundingBox(),
    ]);
    expect(svg?.width).toBe(plot?.width);
    expect(Math.round(svg?.height ?? 0)).toBe(Math.round(plot?.height ?? 0));
    expect(Math.round(((plot?.width ?? 0) / (plot?.height ?? 1)) * 9)).toBe(16);
  });

  test("the arrow keys move from point to point, and the tooltip says which", async ({
    page,
  }) => {
    const example = preview(page, "charts/basic");
    await example.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tooltip(example)).toBeVisible();
    const first = await tooltip(example).textContent();
    expect(first).toMatch(/Desktop\d+Mobile\d+$/);
    await page.keyboard.press("ArrowRight");
    await expect(tooltip(example)).not.toHaveText(first ?? "");
    await expect(tooltip(example)).toHaveAttribute("role", "status");
  });

  test("the legend has the config's labels, in its order", async ({ page }) => {
    await expect(legend(preview(page, "charts/basic"))).toHaveText([
      "Desktop",
      "Mobile",
    ]);
  });

  test("a series can take a token for its color", async ({ page }) => {
    const example = preview(page, "charts/colors");
    await expect(bars(example).first()).toBeVisible();
    const primary = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--color-primary)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(await fill(bars(example).first())).toBe(primary);
  });

  test("patterns fill the second series, in the chart and in the legend", async ({
    page,
  }) => {
    const plain = preview(page, "charts/basic");
    const patterned = preview(page, "charts/patterns");
    await expect(bars(plain).last()).toBeVisible();
    await expect(bars(patterned).last()).toBeVisible();
    expect(await fill(bars(plain).last())).not.toContain("url(");
    expect(await fill(bars(patterned).first())).not.toContain("url(");
    expect(await fill(bars(patterned).last())).toContain("url(");
    expect(
      await fill(legend(patterned).last().locator(".nuv-chart__swatch rect")),
    ).toContain("url(");
  });

  test("every chart has its numbers in a table, seen or not", async ({
    page,
  }) => {
    const hidden = preview(page, "charts/basic").getByRole("table", {
      name: "Visitors by month, on desktop and mobile",
    });
    await expect(hidden.getByRole("row")).toHaveCount(7);
    await expect(hidden.getByRole("row").nth(2)).toHaveText("February305200");
    const box = await hidden.locator("xpath=..").boundingBox();
    expect(box?.width).toBe(1);

    const shown = preview(page, "charts/table").getByRole("table", {
      name: "Visitors by month, January to June",
    });
    await expect(shown).toBeVisible();
    await expect(
      shown.getByRole("columnheader", { name: "Desktop" }),
    ).toBeVisible();
    await expect(
      shown.getByRole("rowheader", { name: "February" }),
    ).toBeVisible();
  });

  test("the reference tables are read from the add-on package", async ({
    page,
  }) => {
    await expect(
      page.getByRole("rowheader", { name: "--nuv-chart-aspect-ratio" }),
    ).toBeVisible();
    await expect(
      page.getByRole("rowheader", { name: ".nuv-chart__tooltip-value" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^patterns/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^categoryLabel/ }),
    ).toBeVisible();
  });
});

test.describe("the theme", () => {
  test("a chart takes its colors from the theme it's in", async ({ page }) => {
    const colors: Record<string, string[]> = {};
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await open(page, "/docs/charts/bar");
      const example = preview(page, "charts/basic");
      await expect(bars(example).first()).toBeVisible();
      colors[colorScheme] = [
        await fill(bars(example).first()),
        await fill(
          example.locator(".recharts-cartesian-axis-tick-value").first(),
        ),
        await example
          .locator(".recharts-cartesian-grid line")
          .first()
          .evaluate((line) => getComputedStyle(line).stroke),
      ];
    }
    for (const index of [0, 1, 2]) {
      expect(colors.light?.[index]).not.toBe(colors.dark?.[index]);
    }
  });
});

test.describe("the kinds of chart", () => {
  test("a stacked bar chart has its totals written on it", async ({ page }) => {
    await open(page, "/docs/charts/bar");
    const example = preview(page, "charts/bar-stacked");
    // January is 186 and 80.
    await expect(example.locator(".recharts-label-list")).toContainText("266");
    await expect(
      example.getByRole("table").getByRole("columnheader"),
    ).toHaveText(["Month", "Desktop", "Mobile"]);
  });

  test("a horizontal bar names each bar in its tooltip", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/charts/bar");
    const example = preview(page, "charts/bar-horizontal");
    const first = bars(example).first();
    await first.scrollIntoViewIfNeeded();
    if (isMobile) await first.tap();
    else await first.hover();
    await expect(tooltip(example)).toHaveText("Chrome275");
  });

  test("a line marked as a forecast is dashed, and its sample is too", async ({
    page,
  }) => {
    await open(page, "/docs/charts/line");
    const example = preview(page, "charts/line-dashed");
    const dash = (shape: Locator) =>
      shape.evaluate((element) => getComputedStyle(element).strokeDasharray);
    const lines = example.locator(".recharts-line-curve");
    await expect(lines).toHaveCount(2);
    expect(await dash(lines.first())).toBe("none");
    expect(await dash(lines.last())).toBe("6px, 4px");
    expect(
      await dash(legend(example).last().locator(".nuv-chart__swatch line")),
    ).toBe("6px, 4px");
  });

  test("a pie names its slices in the legend, the tooltip and the table", async ({
    page,
  }) => {
    await open(page, "/docs/charts/pie");
    const example = preview(page, "charts/pie");
    await expect(legend(example)).toHaveText([
      "Chrome",
      "Safari",
      "Firefox",
      "Edge",
      "Other",
    ]);
    await example.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tooltip(example)).toHaveText(/^[A-Z][a-z]+\d+$/);
    await expect(example.getByRole("table").getByRole("rowheader")).toHaveText([
      "Chrome",
      "Safari",
      "Firefox",
      "Edge",
      "Other",
    ]);
    const box = await example.locator(".nuv-chart__plot").boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(Math.round(box?.height ?? 1));
  });

  test("a donut says its total in its name", async ({ page }) => {
    await open(page, "/docs/charts/pie");
    await expect(
      preview(page, "charts/donut").getByRole("application", {
        name: "Visitors by browser, 925 in all",
      }),
    ).toBeVisible();
  });

  test("a radial chart names its rings from the data", async ({ page }) => {
    await open(page, "/docs/charts/radial");
    const example = preview(page, "charts/radial");
    await expect(legend(example)).toHaveText([
      "Chrome",
      "Safari",
      "Firefox",
      "Edge",
      "Other",
    ]);
  });

  test("a radar chart draws a shape for each series", async ({ page }) => {
    await open(page, "/docs/charts/radar");
    const example = preview(page, "charts/radar");
    await expect(example.locator(".recharts-radar-polygon")).toHaveCount(2);
    await expect(legend(example)).toHaveText(["Desktop", "Mobile"]);
  });

  test("the tooltip writes values the container's way", async ({ page }) => {
    await open(page, "/docs/charts/tooltip");
    const example = preview(page, "charts/tooltip-format");
    await example.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tooltip(example)).toContainText(/ 2026Desktop\d{3},\d{3}/);
    await expect(
      example.getByRole("table").getByRole("cell").first(),
    ).toHaveText("232,500");
  });

  test("a composed chart has bars, a line and a labelled target", async ({
    page,
  }) => {
    await open(page, "/docs/charts/composed");
    const example = preview(page, "charts/composed");
    await expect(bars(example)).toHaveCount(4);
    await expect(example.locator(".recharts-line-curve")).toHaveCount(1);
    await expect(example.locator(".recharts-reference-line-line")).toHaveCount(
      1,
    );
    // Recharts draws labels in a layer of their own, above the shapes.
    await expect(example.locator("svg").getByText("Target $60k")).toBeVisible();
    await expect(legend(example)).toHaveText(["Revenue", "Margin"]);
  });

  test("a scatter chart draws each group in its own shape", async ({
    page,
  }) => {
    await open(page, "/docs/charts/scatter");
    const example = preview(page, "charts/scatter");
    await expect(example.locator(".recharts-scatter-symbol")).toHaveCount(9);
    await expect(legend(example)).toHaveText(["Startup", "Enterprise"]);
  });
});
