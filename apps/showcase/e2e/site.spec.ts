import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  navigation as docsNavigation,
  site as docsSite,
} from "../../docs/lib/site";
import { absoluteUrl, navigation, pages, site } from "../src/lib/site";
import { open, overflow, press, settleStyles, wcag } from "./helpers";

// The site is this app's pages and the docs', in one folder. These tests
// are for this app's pages and for where the two meet. The docs' own pages
// are tested in apps/docs.

for (const { path } of pages) {
  test.describe(path, () => {
    test("has one h1, a title, a description and a canonical URL", async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page).toHaveTitle(new RegExp(site.name));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /.{30,}/,
      );

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      const url = new URL(canonical ?? "");
      expect(url.origin).toBe(new URL(site.url).origin);
      expect(url.pathname).toBe(path);
    });

    test("has an Open Graph image that loads", async ({ page, request }) => {
      await page.goto(path);

      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content");
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

    test("uses each id once, and asks for nothing that isn't there", async ({
      page,
    }) => {
      const missing: string[] = [];
      page.on("response", (response) => {
        if (response.status() === 404) {
          missing.push(decodeURIComponent(new URL(response.url()).pathname));
        }
      });
      await open(page, path);

      const repeated = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map(({ id }) => id);
        return [...new Set(ids.filter((id, at) => ids.indexOf(id) !== at))];
      });
      expect(repeated).toEqual([]);
      expect(missing).toEqual([]);
    });

    test("doesn't scroll sideways", async ({ page }) => {
      await open(page, path);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`has no axe violations in ${theme}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.addInitScript(
          (value) => localStorage.setItem("theme", value),
          theme,
        );
        await open(page, path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        // Every chart drawn, so axe sees it.
        const charts = page.locator(".nuv-chart__plot");
        for (let index = 0; index < (await charts.count()); index += 1) {
          await expect(charts.nth(index).locator("svg").first()).toBeVisible();
        }

        await settleStyles(page);
        const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test("every page has a title and a description of its own", async ({
  page,
}) => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const { path } of pages) {
    await page.goto(path);
    const title = await page.title();
    const description =
      (await page
        .locator('meta[name="description"]')
        .getAttribute("content")) ?? "";
    expect(titles.get(title), `${path} has the title of another page`).toBe(
      undefined,
    );
    expect(
      descriptions.get(description),
      `${path} has the description of another page`,
    ).toBe(undefined);
    titles.set(title, path);
    descriptions.set(description, path);
  }
});

test.describe("how the site is built", () => {
  test("its pages load no Tailwind, and the docs' do", async ({
    page,
    request,
  }) => {
    const sheets = async (path: string) => {
      await page.goto(path);
      const hrefs = await page
        .locator('link[rel="stylesheet"]')
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href") ?? ""),
        );
      const texts = await Promise.all(
        hrefs.map(async (href) => (await request.get(href)).text()),
      );
      return texts.join("\n");
    };

    const own = await sheets("/");
    expect(own).toContain(".site-header");
    expect(own).toContain(".nuv-button");
    expect(own).not.toContain("--tw-");
    expect(own).not.toContain("tailwindcss");

    // The docs are built with Fumadocs, which is Tailwind. This is the
    // check that the check above can tell.
    expect(await sheets("/docs")).toContain("--tw-");
  });

  test("both apps agree on the site's address", () => {
    expect(docsSite.url).toBe(site.url);
    expect(docsSite.name).toBe(site.name);
  });

  test("both apps have the same header: the same links in the same order", () => {
    expect(docsNavigation.map(({ label, href }) => ({ label, href }))).toEqual(
      navigation.map(({ label, href }) => ({ label, href })),
    );
    // What the website calls a page of the docs, the docs call their own.
    expect(docsNavigation.map((item) => Boolean(item.docs))).toEqual(
      navigation.map((item) => Boolean(item.docs)),
    );
  });
});

test.describe("the header", () => {
  test("Tab goes through it in order, from the skip link", async ({
    page,
    isMobile,
    browserName,
  }) => {
    // Safari only tabs to links with a setting changed, and a phone has no
    // Tab key.
    test.skip(isMobile || browserName === "webkit");
    await open(page, "/");

    const focused = () =>
      page.evaluate(() => {
        const element = document.activeElement;
        return (
          element?.getAttribute("aria-label") ??
          element?.textContent?.trim() ??
          ""
        );
      });
    const stops: string[] = [];
    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press("Tab");
      stops.push(await focused());
    }
    expect(stops[0]).toBe("Skip to the content");
    expect(stops[1]).toBe(site.name);
    expect(stops[2]).toBe("Docs");
    expect(stops[3]).toBe("Components");
    expect(stops[4]).toBe("Blocks");
    expect(stops[5]).toBe("Charts");
    expect(stops[6]).toBe("Themes");
    expect(stops[7]).toMatch(/^Search/);
    expect(stops[8]).toBe("GitHub repository");
    expect(stops[9]).toMatch(/^Theme: /);
  });

  test("the skip link goes to the content", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile || browserName === "webkit");
    await open(page, "/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to the content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#content")).toBeFocused();
  });

  test("the links are in the header on a wide screen and in a menu on a narrow one", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/");
    const inHeader = page
      .getByRole("banner")
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Docs" });
    const menu = page.getByRole("button", { name: "Menu" });

    if (!isMobile) {
      await expect(inHeader).toBeVisible();
      await expect(menu).toBeHidden();
      return;
    }
    await expect(inHeader).toBeHidden();
    await menu.tap();
    const sheet = page.getByRole("dialog", { name: site.name });
    await expect(sheet.getByRole("link", { name: "Home" })).toBeVisible();
    await sheet.getByRole("link", { name: "Docs" }).tap();
    await expect(page).toHaveURL(/\/docs$/);
  });

  test("everything in it is big enough to tap", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    await open(page, "/");
    const controls = page
      .getByRole("banner")
      .locator("a:visible, button:visible");
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      if ((await control.textContent())?.trim() === "Skip to the content") {
        continue;
      }
      const box = await control.boundingBox();
      // 24 by 24 is what WCAG 2.2 asks for. The library's own controls are
      // 44 on a touch screen.
      expect(box?.height).toBeGreaterThanOrEqual(24);
      expect(box?.width).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe("the theme", () => {
  const theme = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: /^Theme: / });

  test("starts as the system's, with nothing stored", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    await expect(theme(page)).toHaveAccessibleName("Theme: System");
    const [background, white] = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return [
        getComputedStyle(document.body).backgroundColor,
        style.getPropertyValue("--color-white"),
      ];
    });
    expect(white).not.toBe("");
    expect(background).not.toBe("rgb(255, 255, 255)");
  });

  test("a choice changes the page, is remembered, and is there before the page is drawn", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/");
    await press(theme(page), isMobile);
    await press(page.getByRole("menuitemradio", { name: "Dark" }), isMobile);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(theme(page)).toHaveAccessibleName("Theme: Dark");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "dark",
    );

    // What the attribute is when the document has been read and nothing
    // has run but the script in its head.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { early: string | null }).early =
          document.documentElement.getAttribute("data-theme");
      });
    });
    await page.reload();
    expect(
      await page.evaluate(
        () => (window as unknown as { early: string | null }).early,
      ),
    ).toBe("dark");
  });

  test("the dashboard follows it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const fills: string[] = [];
    for (const value of ["light", "dark"]) {
      await page.addInitScript(
        (stored) => localStorage.setItem("theme", stored),
        value,
      );
      await open(page, "/");
      const bar = page
        .locator(".recharts-bar-rectangle path, .recharts-rectangle")
        .first();
      await expect(bar).toBeVisible();
      fills.push(await bar.evaluate((node) => getComputedStyle(node).fill));
    }
    expect(fills[0]).not.toBe(fills[1]);
  });

  test("a choice made here is the docs' theme too, and one made there is this site's", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/");
    await press(theme(page), isMobile);
    await press(page.getByRole("menuitemradio", { name: "Dark" }), isMobile);

    await open(page, "/docs");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveClass(/dark/);

    // The docs' own switch writes the same key. Set as it would.
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await open(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(theme(page)).toHaveAccessibleName("Theme: Light");
  });
});

test.describe("search", () => {
  test("finds a docs page from this site and goes to it", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/");
    await press(page.getByRole("button", { name: /^Search/ }), isMobile);
    const dialog = page.getByRole("dialog", { name: "Search the site" });
    await expect(dialog).toBeVisible();
    // With nothing typed, this app's own pages are listed.
    await expect(dialog.getByRole("option", { name: "Home" })).toBeVisible();

    await dialog.getByRole("combobox").fill("data table");
    const result = dialog
      .getByRole("option", { name: "DataTable", exact: true })
      .first();
    await expect(result).toBeVisible();
    await press(result, isMobile);
    await expect(page).toHaveURL(/\/docs\/table\/data-table/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DataTable",
    );
  });

  test("opens with the keyboard, and Escape gives focus back", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile);
    await open(page, "/");
    const button = page.getByRole("button", { name: /^Search/ });
    await button.focus();
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog", { name: "Search the site" });
    await expect(dialog.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("says so when nothing matches", async ({ page, isMobile }) => {
    await open(page, "/");
    await press(page.getByRole("button", { name: /^Search/ }), isMobile);
    const dialog = page.getByRole("dialog", { name: "Search the site" });
    await dialog.getByRole("combobox").fill("zzzqqqxxx");
    await expect(dialog.getByText("Nothing found.").first()).toBeVisible();
  });
});

test.describe("the dashboard", () => {
  test("is the real components: the table sorts and the chart has its numbers", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/");
    const table = page.getByRole("table", { name: "Recent orders" });
    await expect(table.getByRole("rowheader").first()).toHaveText("ORD-7231");
    const sort = table.getByRole("button", { name: /Total/ });
    await sort.scrollIntoViewIfNeeded();
    await press(sort, isMobile);
    await expect(
      table.getByRole("columnheader", { name: /Total/ }),
    ).toHaveAttribute("aria-sort", "descending");
    // A column of numbers sorts largest first.
    await expect(table.getByRole("rowheader").first()).toHaveText("ORD-7224");

    await expect(
      page.getByRole("application", {
        name: "Revenue by month against target, November to October",
      }),
    ).toBeVisible();
    const numbers = page.getByRole("table", {
      name: "Revenue by month against target, November to October",
    });
    await expect(numbers.getByRole("row")).toHaveCount(13);
    await expect(numbers.getByRole("row").last()).toHaveText(
      "Oct$73,400$60,000",
    );
  });
});

test.describe("where the two apps meet", () => {
  test("the header leads to the docs, and the docs lead back", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a phone the links are in the menu, tested above.");
    const missing: string[] = [];
    page.on("response", (response) => {
      if (response.status() === 404) {
        missing.push(decodeURIComponent(new URL(response.url()).pathname));
      }
    });
    await open(page, "/");
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Docs", exact: true })
      .click();
    await page.locator("html[data-hydrated]").waitFor();
    await expect(page).toHaveURL(/\/docs$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Getting started",
    );

    // Inside the docs the router takes over, under their own base path.
    await page.locator('a[href="/docs/theming"]:visible').first().click();
    await expect(page).toHaveURL(/\/docs\/theming$/);

    // The docs have the website's header, and its name is the way back.
    const header = page.locator("#site-header");
    await expect(
      header.getByRole("link", { name: "Docs", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await header.getByRole("link", { name: site.name, exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "React components on Radix UI, styled with plain SCSS",
    );
    expect(missing).toEqual([]);
  });

  test("the docs have the website's header, and every link in it goes somewhere", async ({
    page,
    request,
  }) => {
    await open(page, "/docs/components/button");
    const header = page.locator("#site-header");
    const links = header.getByRole("navigation", { name: "Site" });
    await expect(links.getByRole("link")).toHaveText(
      navigation.map((item) => item.label),
    );
    for (const item of navigation) {
      const link = links.getByRole("link", { name: item.label, exact: true });
      await expect(link).toHaveAttribute("href", item.href);
      expect((await request.get(item.href)).status(), item.href).toBe(200);
    }
    // A component's page is in the section of that name, not in "Docs".
    await expect(
      links.getByRole("link", { name: "Components", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      links.getByRole("link", { name: "Docs", exact: true }),
    ).not.toHaveAttribute("aria-current");

    // From there to a page of the website, which is a full load.
    await links.getByRole("link", { name: "Charts", exact: true }).click();
    await expect(page).toHaveURL(/\/charts$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Charts");
  });

  test("the docs' header stays at the top on a wide screen, with the sidebar under it", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/components/button");
    const header = page.locator("#site-header");
    await page.evaluate(() => window.scrollTo(0, 1200));
    if (isMobile) {
      // On a phone it scrolls away, and the docs' own bar takes the top.
      await expect(header).not.toBeInViewport();
      return;
    }
    await expect(header).toBeInViewport();
    const bottom = await header.evaluate(
      (element) => element.getBoundingClientRect().bottom,
    );
    const sidebarTop = await page
      .locator("#nd-sidebar")
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(sidebarTop).toBeGreaterThanOrEqual(bottom - 1);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("the buttons on the home page go to pages that exist", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const hrefs = await page
      .locator("main a[href], footer a[href], header a[href]")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const local = [...new Set(hrefs)].filter(
      (href): href is string => href?.startsWith("/") ?? false,
    );
    expect(local).toContain("/docs");
    for (const href of local) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  });

  test("the sitemap index points to both apps' pages", async ({ request }) => {
    const index = await (await request.get("/sitemap.xml")).text();
    expect(index).toContain("<sitemapindex");
    const listed = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, loc]) => new URL(loc ?? "").pathname,
    );
    expect(listed).toEqual(["/site-sitemap.xml", "/docs/sitemap.xml"]);

    const own = await (await request.get("/site-sitemap.xml")).text();
    for (const { path } of pages) {
      expect(own).toContain(`<loc>${absoluteUrl(path)}</loc>`);
    }
    const docs = await (await request.get("/docs/sitemap.xml")).text();
    expect(docs).toContain(`<loc>${absoluteUrl("/docs")}</loc>`);
    expect(docs).toContain(
      `<loc>${absoluteUrl("/docs/components/button")}</loc>`,
    );
  });

  test("robots.txt allows crawling and points at the sitemap index", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const text = await response.text();
    expect(text).toContain("Allow: /");
    expect(text).toContain(`Sitemap: ${absoluteUrl("/sitemap.xml")}`);
    // One robots file for the site. A crawler never looks for a second.
    expect((await request.get("/docs/robots.txt")).status()).toBe(404);
  });

  test("an address with no page gets this site's 404 page, in the docs too", async ({
    page,
  }) => {
    for (const path of ["/nothing-here", "/docs/nothing-here"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "There's no page here",
      );
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(
        page.getByRole("link", { name: "Go to the docs" }),
      ).toHaveAttribute("href", "/docs");
    }
  });
});
