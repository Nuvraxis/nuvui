import { readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { chartsHome, families, familyPath } from "../src/lib/charts";
import { open, press, settleStyles, wcag } from "./helpers";

// The charts pages. What every page of the site has to have, such as one
// h1 and no axe violations, is tested for these in site.spec.ts, which goes
// through the same list of pages.

const source = async (family: string, name: string) =>
  (
    await readFile(
      path.join(
        import.meta.dirname,
        "..",
        "src",
        "charts",
        family,
        `${name}.tsx`,
      ),
      "utf8",
    )
  )
    // A checkout on Windows may have the other line ending.
    .replaceAll("\r\n", "\n")
    .trim();

const setTheme = (page: Page, theme: "light" | "dark") =>
  page.addInitScript((value) => localStorage.setItem("theme", value), theme);

test.describe("the charts page", () => {
  test("lists every family, and each leads to its page", async ({
    page,
    request,
  }) => {
    await open(page, chartsHome);
    const list = page.getByRole("list").filter({
      has: page.getByRole("link", { name: families[0]?.title, exact: true }),
    });
    for (const family of families) {
      const link = list.getByRole("link", { name: family.title, exact: true });
      await expect(link).toHaveAttribute("href", familyPath(family));
      expect((await request.get(familyPath(family))).status()).toBe(200);
    }

    await list.getByRole("link", { name: "Bar charts", exact: true }).click();
    await expect(page).toHaveURL(/\/charts\/bar$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Bar charts",
    );
  });

  test("the header says which section this is", async ({ page, isMobile }) => {
    test.skip(isMobile, "On a phone the links are in the menu.");
    const link = page
      .getByRole("banner")
      .getByRole("link", { name: "Charts", exact: true });

    await open(page, "/");
    await expect(link).not.toHaveAttribute("aria-current");
    await open(page, chartsHome);
    await expect(link).toHaveAttribute("aria-current", "page");
    await open(page, "/charts/line");
    await expect(link).toHaveAttribute("aria-current", "page");
  });

  test("an address that isn't a family is the 404 page", async ({ page }) => {
    const response = await page.goto("/charts/nothing");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "There's no page here",
    );
  });
});

for (const family of families) {
  test.describe(familyPath(family), () => {
    test("draws every chart it lists, each with a name", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, familyPath(family));

      const cards = page.locator("[data-chart]");
      await expect(cards).toHaveCount(family.charts.length);
      for (const [index, chart] of family.charts.entries()) {
        const card = cards.nth(index);
        await expect(card).toHaveAttribute(
          "data-chart",
          `${family.slug}/${chart.name}.tsx`,
        );
        await expect(
          card.getByRole("heading", { level: 2, name: chart.title }),
        ).toBeVisible();

        // Recharts draws once it has measured its box. A chart with no box
        // would have no svg.
        const drawing = card.getByRole("application");
        await expect(drawing).toBeVisible();
        expect(
          (await drawing.getAttribute("aria-label"))?.length,
        ).toBeGreaterThan(10);
        const box = await drawing.boundingBox();
        expect(box?.width).toBeGreaterThan(100);
        expect(box?.height).toBeGreaterThan(40);
      }
    });

    test("names its own page in the list of families", async ({ page }) => {
      await open(page, familyPath(family));
      const nav = page.getByRole("navigation", { name: "Chart families" });
      await expect(nav.getByRole("link")).toHaveCount(families.length);
      await expect(nav.locator('[aria-current="page"]')).toHaveText(
        family.label,
      );
    });

    test("shows each chart's code as the file is written", async ({
      page,
      isMobile,
    }) => {
      await open(page, familyPath(family));

      for (const chart of family.charts) {
        const card = page.locator(
          `[data-chart="${family.slug}/${chart.name}.tsx"]`,
        );
        const button = card.getByRole("button", {
          name: `Code for ${chart.title}`,
          exact: true,
        });
        await button.scrollIntoViewIfNeeded();
        await press(button, isMobile);

        const dialog = page.getByRole("dialog", { name: chart.title });
        await expect(dialog).toBeVisible();
        const shown = await dialog.locator("pre").evaluate((pre) =>
          // Shiki puts each line in an element of its own, with a line
          // break between them.
          (pre.textContent ?? "").trim(),
        );
        expect(shown).toBe(await source(family.slug, chart.name));

        await press(dialog.getByRole("button", { name: "Close" }), isMobile);
        await expect(dialog).toBeHidden();
      }
    });
  });
}

test.describe("a chart's code", () => {
  const card = (page: Page) => page.locator('[data-chart="bar/grouped.tsx"]');

  test("is copied by the button on the card, and by the one in the dialog", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium lets a test read the clipboard.",
    );
    const expected = await source("bar", "grouped");
    const clipboard = () =>
      page.evaluate(async () =>
        (await navigator.clipboard.readText()).replaceAll("\r\n", "\n"),
      );
    await open(page, "/charts/bar");

    const copy = card(page).getByRole("button", {
      name: "Copy the code for Grouped",
    });
    await copy.scrollIntoViewIfNeeded();
    await press(copy, isMobile);
    await expect(card(page).getByRole("status")).toHaveText("Copied");
    expect(await clipboard()).toBe(expected);

    await page.evaluate(() => navigator.clipboard.writeText(""));
    await press(
      card(page).getByRole("button", {
        name: "Code for Grouped",
        exact: true,
      }),
      isMobile,
    );
    const dialog = page.getByRole("dialog", { name: "Grouped" });
    await press(
      dialog.getByRole("button", { name: "Copy the code for Grouped" }),
      isMobile,
    );
    await expect(
      dialog.getByRole("button", { name: "Copy the code for Grouped" }),
    ).toHaveText("Copied");
    expect(await clipboard()).toBe(expected);
  });

  test("says so when the browser won't allow the copy", async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("refused")) },
        configurable: true,
      });
    });
    await open(page, "/charts/bar");
    const copy = card(page).getByRole("button", {
      name: "Copy the code for Grouped",
    });
    await copy.scrollIntoViewIfNeeded();
    await press(copy, isMobile);
    await expect(card(page).getByRole("status")).toHaveText("Couldn't copy");
    await expect(copy).toHaveAttribute("data-state", "failed");
  });

  test("opens with the keyboard, and Escape gives focus back", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile);
    await open(page, "/charts/bar");
    const button = card(page).getByRole("button", {
      name: "Code for Grouped",
      exact: true,
    });
    await button.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Grouped" });
    await expect(dialog).toBeVisible();

    // The block of code scrolls sideways, so the keyboard can get to it.
    await expect(dialog.locator("pre")).toHaveAttribute("tabindex", "0");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`is highlighted, and passes axe in ${theme}`, async ({
      page,
      isMobile,
    }) => {
      // The dialog fades in. Caught part of the way, its text is measured
      // against what's showing through it.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await setTheme(page, theme);
      await open(page, "/charts/bar");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const button = card(page).getByRole("button", {
        name: "Code for Grouped",
        exact: true,
      });
      await button.scrollIntoViewIfNeeded();
      await press(button, isMobile);
      const dialog = page.getByRole("dialog", { name: "Grouped" });
      await expect(dialog).toBeVisible();

      // More than one color in the block, and the one this theme asks for.
      const colors = await dialog.locator("pre span").evaluateAll((spans) => {
        const wanted = document.documentElement.dataset.theme;
        const seen = new Set<string>();
        let wrong = 0;
        for (const span of spans) {
          const own = (span as HTMLElement).style.getPropertyValue(
            `--shiki-${wanted}`,
          );
          if (!own) continue;
          const probe = document.createElement("span");
          probe.style.color = own;
          span.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          const drawn = getComputedStyle(span).color;
          seen.add(drawn);
          if (drawn !== expected) wrong += 1;
        }
        return { seen: seen.size, wrong };
      });
      expect(colors.seen).toBeGreaterThan(2);
      expect(colors.wrong).toBe(0);

      await settleStyles(page);
      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(wcag)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("is highlighted when the site is built, not in the browser", async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script") {
        scripts.push(response.url());
      }
    });
    await open(page, "/charts/bar");
    await card(page)
      .getByRole("button", {
        name: "Code for Grouped",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog", { name: "Grouped" })).toBeVisible();

    // Shiki's grammars are megabytes. None of it is sent.
    let total = 0;
    for (const url of scripts) {
      const body = await (await page.request.get(url)).text();
      expect(body, url).not.toContain("tm-grammars");
      expect(body, url).not.toContain("oniguruma");
      total += body.length;
    }
    expect(scripts.length).toBeGreaterThan(0);
    expect(total).toBeLessThan(3_000_000);
  });
});

test.describe("a chart on these pages", () => {
  test("follows the theme", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const fills: string[] = [];
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme);
      await open(page, "/charts/bar");
      const bar = page
        .locator('[data-chart="bar/basic.tsx"]')
        .locator(".recharts-bar-rectangle path, .recharts-rectangle")
        .first();
      await expect(bar).toBeVisible();
      fills.push(await bar.evaluate((node) => getComputedStyle(node).fill));
    }
    expect(fills[0]).not.toBe(fills[1]);
  });

  test("has its numbers as a table, under the chart's name", async ({
    page,
  }) => {
    await open(page, "/charts/bar");
    const table = page.getByRole("table", {
      name: "Support tickets opened and closed, by quarter",
    });
    await expect(table.getByRole("row")).toHaveCount(5);
    await expect(table.getByRole("row").nth(0)).toHaveText(
      "QuarterOpenedClosed",
    );
    await expect(table.getByRole("row").nth(1)).toHaveText("Q1412388");
  });

  test("can be read with the arrow keys", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile || browserName === "webkit");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/charts/bar");
    const chart = page.locator('[data-chart="bar/grouped.tsx"]');
    await chart.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = chart.locator(".nuv-chart__tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Opened");
    await expect(tooltip).toContainText("Closed");
  });

  test("fits a phone, with its buttons big enough to tap", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile);
    await open(page, "/charts/dashboard");
    const buttons = page.locator("[data-chart] button");
    const count = await buttons.count();
    expect(count).toBe(6);
    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });
});
