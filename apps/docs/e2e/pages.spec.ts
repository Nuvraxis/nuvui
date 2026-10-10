import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { site } from "../lib/site";
import { docsPages, open } from "./helpers";

// Every page of this app. The home page is the website's, apps/showcase,
// which has the same checks of its own.
const pages = docsPages;

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

    test("says what a search engine and a shared link need", async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const meta = (selector: string) =>
        page.locator(selector).first().getAttribute("content");

      // A shared link: the site's name, and a picture with its size and
      // what it shows in words.
      expect(await meta('meta[property="og:site_name"]')).toBe(site.name);
      expect(await meta('meta[property="og:locale"]')).toBe("en_US");
      expect(await meta('meta[property="og:image:width"]')).toBe("1200");
      expect(await meta('meta[property="og:image:height"]')).toBe("630");
      expect(await meta('meta[property="og:image:alt"]')).toMatch(/.{3,}/);
      expect(await meta('meta[name="twitter:card"]')).toBe(
        "summary_large_image",
      );
      expect(await meta('meta[property="og:url"]')).toBe(
        await page.locator('link[rel="canonical"]').getAttribute("href"),
      );

      // A search engine: the page can be indexed, with a large picture.
      expect(await meta('meta[name="robots"]')).toBe("index, follow");
      expect(await meta('meta[name="googlebot"]')).toContain(
        "max-image-preview:large",
      );

      // A browser: the color around the page, light and dark.
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);

      // A page of the docs is an article. The icons are the docs' own
      // copies, under /docs, so the docs are whole when run alone.
      expect(await meta('meta[property="og:type"]')).toBe("article");
      expect(
        await page
          .locator('link[rel="icon"][type="image/svg+xml"]')
          .getAttribute("href"),
      ).toMatch(/^\/docs\/icon\.svg/);

      // The icons, each of which loads: an SVG, an .ico for what can't
      // draw one, and one for an iPhone's home screen.
      for (const [selector, type] of [
        ['link[rel="icon"][type="image/svg+xml"]', "image/svg+xml"],
        ['link[rel="icon"][type="image/x-icon"]', "image/"],
        ['link[rel="apple-touch-icon"]', "image/png"],
      ] as const) {
        const href = await page.locator(selector).getAttribute("href");
        expect(href, selector).not.toBeNull();
        const response = await request.get(href ?? "");
        expect(response.ok(), selector).toBe(true);
        expect(response.headers()["content-type"], selector).toContain(type);
      }
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
    // router doesn't look, which scripts/fix-next-export.mjs puts right.
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
        // Three times as long as other tests get. axe looks at every
        // element of a long page, and in WebKit, on a machine running
        // other slices too, that has taken longer than thirty seconds.
        test.slow();
        await page.emulateMedia({ colorScheme });
        await open(page, path);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          colorScheme,
        );

        // WCAG 2.2 A and AA. axe's extra "best practice" rules are left out
        // here because three of them fail inside Fumadocs' own markup, which
        // we can't change. The library's component tests run every rule.
        //
        // A disabled choice card fades as a whole, its description with it.
        // WCAG asks no contrast of a control that can't be used, and axe
        // lets off such a control's name but not the text that describes
        // it. That text alone is left out.
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .exclude(
            ".nuv-choice-card:has(> .nuv-choice-card__control:disabled) .nuv-choice-card__description",
          )
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  });
}

test("no two pages share a title or a description", async ({ page }) => {
  // One test opens every page in turn, so its time grows with the site.
  test.setTimeout(30_000 + pages.length * 2_000);
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
