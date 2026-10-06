import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { site } from "../lib/site";
import { docsPages, open } from "./helpers";

const pages = ["/", ...docsPages];

for (const path of pages) {
  test.describe(path, () => {
    test("has one h1, a title, a description and a canonical URL", async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page).toHaveTitle(new RegExp(site.name));

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute("content", /.{30,}/);

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonical).not.toBeNull();
      const url = new URL(canonical ?? "");
      expect(url.origin).toBe(new URL(site.url).origin);
      expect(url.pathname).toBe(path);
    });

    test("has an Open Graph image that loads", async ({ page, request }) => {
      await page.goto(path);

      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      expect(image).not.toBeNull();

      // The tag points at the production origin. Ask this server for the
      // same path instead.
      const response = await request.get(new URL(image ?? "").pathname);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/png");
    });

    test("has structured data that parses", async ({ page }) => {
      await page.goto(path);

      const blocks = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(JSON.parse(block)["@context"]).toBe("https://schema.org");
      }
    });

    // A heading gets its id from its text, and the examples set ids of their
    // own. Two the same break the label of one and the link to the other,
    // and axe no longer reports it.
    test("uses each id once", async ({ page }) => {
      await page.goto(path);

      const repeated = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map(({ id }) => id);
        return [...new Set(ids.filter((id, at) => ids.indexOf(id) !== at))];
      });
      expect(repeated).toEqual([]);
    });

    // Chiefly the files Next's router fetches ahead of a navigation, one for
    // each link in view. An export made on Windows puts them where the
    // router doesn't look, which scripts/fix-export.mjs puts right.
    test("asks for nothing that isn't there", async ({ page }) => {
      const missing: string[] = [];
      page.on("response", (response) => {
        if (response.status() === 404) {
          missing.push(decodeURIComponent(new URL(response.url()).pathname));
        }
      });

      await open(page, path);

      expect(missing).toEqual([]);
    });

    test("doesn't scroll sideways", async ({ page }) => {
      await page.goto(path);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    for (const colorScheme of ["light", "dark"] as const) {
      test(`has no axe violations in ${colorScheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await open(page, path);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          colorScheme,
        );

        // WCAG 2.2 A and AA. axe's extra "best practice" rules are left out
        // here because three of them fail inside Fumadocs' own markup, which
        // we can't change. The library's component tests run every rule.
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  });
}

test("no two pages share a title or a description", async ({ page }) => {
  const titles: string[] = [];
  const descriptions: string[] = [];

  for (const path of pages) {
    await page.goto(path);
    titles.push(await page.title());
    descriptions.push(
      (await page
        .locator('meta[name="description"]')
        .getAttribute("content")) ?? "",
    );
  }

  expect(new Set(titles).size).toBe(pages.length);
  expect(new Set(descriptions).size).toBe(pages.length);
});
