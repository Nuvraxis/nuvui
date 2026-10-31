import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
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
    // A page of blocks has a preview of each in a frame, and each preview
    // is a page of its own, with its own scripts and styles to load. The
    // page waits for those, and axe goes into every one. Fifteen of them,
    // in a Firefox on a busy machine, can take longer than thirty seconds.
    test.slow(
      path.startsWith("/blocks/"),
      "a page of blocks loads a page for each",
    );
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

      expect(await meta('meta[property="og:type"]')).toBe("website");
      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
        "href",
        "/manifest.webmanifest",
      );

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

// What an attribute or a title holds, with the characters HTML writes as
// entities put back.
const decoded = (text: string) =>
  text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

test("every page has a title and a description of its own", async ({
  request,
}) => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const { path } of pages) {
    // The title and the description are in the HTML as it's sent, so
    // they're read from it. A browser drawing every page of the site, one
    // after another, took longer than a test is given in Firefox on CI.
    const response = await request.get(path);
    expect(response.ok(), `${path} is served`).toBe(true);
    const html = await response.text();
    const title = decoded(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "");
    const meta =
      /<meta\s(?=[^>]*\bname="description")[^>]*>/.exec(html)?.[0] ?? "";
    const description = decoded(/\scontent="([^"]*)"/.exec(meta)?.[1] ?? "");
    expect(title, `${path} has a title`).not.toBe("");
    expect(description, `${path} has a description`).not.toBe("");
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

  test("both apps say the same things in a page's head", () => {
    // One site to a search engine, in two apps. The two files are the same
    // but for the comment at the top, which names the other one.
    const body = (file: string) => {
      const source = readFileSync(file, "utf8");
      return source.slice(source.indexOf("// The icons aren't here."));
    };
    const website = path.join(process.cwd(), "src", "lib", "seo.ts");
    const docs = path.join(process.cwd(), "..", "docs", "lib", "seo.ts");

    expect(body(website).length).toBeGreaterThan(1000);
    expect(body(docs)).toBe(body(website));
  });

  test("both apps have the same icons, drawn from one file", () => {
    const website = path.join(process.cwd(), "src", "app");
    const docs = path.join(process.cwd(), "..", "docs", "app");

    for (const name of ["icon.svg", "favicon.ico", "apple-icon.png"]) {
      expect(
        readFileSync(path.join(docs, name)).equals(
          readFileSync(path.join(website, name)),
        ),
        name,
      ).toBe(true);
    }
    // The square and its edge are marked for scripts/make-icons.mjs, which
    // takes them off for a home screen.
    const icon = readFileSync(path.join(website, "icon.svg"), "utf8");
    expect(icon).toContain('<rect class="tile"');
    expect(icon).toContain('<rect class="edge"');
  });

  test("the manifest names the site and icons that load", async ({
    request,
  }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain(
      "application/manifest+json",
    );
    const manifest = await response.json();

    expect(manifest.name).toBe(site.name);
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    expect(
      manifest.icons.some(
        (icon: { purpose?: string }) => icon.purpose === "maskable",
      ),
    ).toBe(true);
    for (const icon of manifest.icons) {
      const picture = await request.get(icon.src);
      expect(picture.ok(), icon.src).toBe(true);
      expect(picture.headers()["content-type"], icon.src).toContain(
        "image/png",
      );
    }
  });

  test("a browser that asks for /favicon.ico gets one", async ({ request }) => {
    const response = await request.get("/favicon.ico");

    expect(response.ok()).toBe(true);
    // An .ico file starts with these four bytes.
    expect([...(await response.body()).subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });

  test("a page that isn't to be found says so to a search engine", async ({
    page,
  }) => {
    await page.goto("/nothing-here");

    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      "noindex",
    );
    await page.goto("/blocks/view/sign-in");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      "noindex",
    );
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
    for (let index = 0; index < 11; index += 1) {
      await page.keyboard.press("Tab");
      stops.push(await focused());
    }
    expect(stops[0]).toBe("Skip to the content");
    expect(stops[1]).toBe(site.name);
    expect(stops[2]).toBe("Docs");
    expect(stops[3]).toBe("Components");
    expect(stops[4]).toBe("Blocks");
    expect(stops[5]).toBe("Charts");
    expect(stops[6]).toBe("Icons");
    expect(stops[7]).toBe("Themes");
    expect(stops[8]).toMatch(/^Search/);
    expect(stops[9]).toBe("GitHub repository");
    expect(stops[10]).toMatch(/^Theme: /);
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
    const sheet = page.getByRole("dialog", { name: "Menu" });
    await expect(sheet.getByRole("link")).toHaveText([
      "Home",
      ...navigation.map((item) => item.label),
    ]);
    await sheet.getByRole("link", { name: "Docs" }).tap();
    await expect(page).toHaveURL(/\/docs$/);
  });

  test("on a phone, a link to one of the site's own pages closes the menu and marks the page", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "On a wide screen there's no menu.");
    await open(page, "/");
    await page.getByRole("button", { name: "Menu" }).tap();
    const sheet = page.getByRole("dialog", { name: "Menu" });
    await sheet.getByRole("link", { name: "Charts" }).tap();
    await expect(page).toHaveURL(/\/charts$/);
    await expect(sheet).toBeHidden();

    await page.getByRole("button", { name: "Menu" }).tap();
    await expect(sheet.getByRole("link", { name: "Charts" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("the header is the library's bar, and stops at the width the page does", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone is narrower than the page's width.");
    await page.setViewportSize({ width: 1900, height: 800 });
    await open(page, "/");
    const header = page.getByRole("banner");
    await expect(header).toHaveClass(/nuv-navbar--sticky/);
    // What's in it is 100rem across, in the middle, with 2rem of room
    // inside each end. The header itself is as wide as the window, less a
    // scrollbar where the browser draws one.
    const width = (await header.boundingBox())?.width ?? 0;
    expect(width).toBeGreaterThan(1800);
    const name = await header
      .getByRole("link", { name: site.name, exact: true })
      .boundingBox();
    const off = Math.abs((name?.x ?? 0) - ((width - 1600) / 2 + 32));
    expect(off).toBeLessThanOrEqual(1);
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
  test("each figure says which way it went, in words", async ({ page }) => {
    await open(page, "/");
    const figure = (name: string) =>
      page.locator(".site-dashboard .nuv-stat").filter({ hasText: name });

    await expect(page.locator(".site-dashboard .nuv-stat")).toHaveCount(4);
    await expect(figure("Revenue")).toContainText(
      "$73,400Up 4.7% against September",
    );
    await expect(figure("Refund rate")).toContainText(
      "Down 0.4 pts against September",
    );
    // A refund rate that fell is good news, and is drawn as such.
    await expect(figure("Refund rate").locator(".nuv-trend")).toHaveClass(
      /nuv-trend--good/,
    );
    await expect(figure("New customers").locator(".nuv-trend")).toHaveClass(
      /nuv-trend--bad/,
    );
  });

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
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "React components for enterprise applications",
    );
    expect(missing).toEqual([]);
  });

  // What the docs' router asks for when it hasn't fetched their first
  // page ahead. A 404 here is a whole page load where a change of page was
  // meant.
  test("the docs' first page's data is at the address their router asks for", async ({
    request,
  }) => {
    const asked = await request.get("/docs.txt");
    expect(asked.status()).toBe(200);
    expect(await asked.text()).toBe(
      await (await request.get("/docs/index.txt")).text(),
    );
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

test("the home page says which version there is, or that there's none yet", async ({
  page,
}) => {
  // The version in the repository, which Changesets sets in the pull
  // request a release is published from. "0.0.0" is before the first.
  const { version } = JSON.parse(
    readFileSync(
      path.join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "packages",
        "ui",
        "package.json",
      ),
      "utf8",
    ),
  );
  await open(page, "/");
  await expect(page.locator(".site-lead__status")).toHaveText(
    version === "0.0.0"
      ? "Open source, and early: nothing is on npm yet"
      : `Open source, and early: version ${version}`,
  );
});

test("the bench is over a grid that lights under the pointer", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "a phone has no pointer to hover with");
  await open(page, "/");
  const grid = page.locator(".site-bench__grid");
  await expect(grid).toHaveClass(/nuv-grid-background/);
  await expect(grid.locator(".site-bench__specimen")).toBeVisible();
  // Drawn for the eye only.
  await expect(grid.locator(".nuv-background__layer")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await grid.hover();

  await expect(grid).toHaveAttribute("data-lit", "");
});

test("the home page's main heading and share image say what it is", async ({
  page,
  request,
}) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "React components for enterprise applications",
  );
  await expect(page).toHaveTitle(/React components/);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    /React components/,
  );
  const image = await request.get("/og/home.png");
  expect(image.headers()["content-type"]).toBe("image/png");
});

test("a page's title carries the same words", async ({ page }) => {
  await open(page, "/blocks");
  await expect(page).toHaveTitle(/\| Nuvui React components$/);
});

test.describe("the bench", () => {
  const reading = (page: Page, name: string) =>
    page.locator(`[data-reading="${name}"]`);
  const choose = (page: Page, group: string, name: string, isMobile: boolean) =>
    press(
      page
        .getByRole("radiogroup", { name: group })
        .getByRole("radio", { name, exact: true }),
      isMobile,
    );

  test("what it reads is the height of the button, at each density", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a finger gets the touch size at every density");
    await open(page, "/");
    const button = page.getByRole("button", { name: "Approve" });
    for (const [density, height] of [
      ["Compact", "36"],
      ["Comfortable", "44"],
      ["Default", "40"],
    ] as const) {
      await choose(page, "Density", density, isMobile);
      await expect(reading(page, "button")).toHaveAttribute(
        "data-value",
        height,
      );
      expect((await button.boundingBox())?.height).toBe(Number(height));
    }
    await expect(page.locator(".site-home")).toHaveAttribute(
      "data-density",
      "default",
    );
  });

  test("on a touch screen a control stays at the touch size", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "a mouse gets the density's height");
    await open(page, "/");
    await choose(page, "Density", "Compact", isMobile);
    await expect(reading(page, "touch")).toHaveAttribute("data-value", "44");
    await expect(reading(page, "button")).toHaveAttribute("data-value", "44");
  });

  test("a preset goes on the whole page, and the contrast is read again", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/");
    const contrast = reading(page, "contrast");
    await expect(contrast).not.toHaveAttribute("data-value", "");
    const before = await contrast.getAttribute("data-value");

    await choose(page, "Preset", "High contrast", isMobile);

    await expect(page.locator(".site-home")).toHaveAttribute(
      "data-preset",
      "high-contrast",
    );
    await expect(contrast).not.toHaveAttribute("data-value", before ?? "");
    expect(
      Number(await contrast.getAttribute("data-value")),
    ).toBeGreaterThanOrEqual(4.5);

    await choose(page, "Preset", "Nuvui", isMobile);
    await expect(page.locator(".site-home")).not.toHaveAttribute(
      "data-preset",
      /.+/,
    );
  });

  test("the form on it works", async ({ page, isMobile }) => {
    await open(page, "/");
    await press(page.getByRole("button", { name: "Approve" }), isMobile);
    // The toast is said a second time, for screen readers, with a word before.
    await expect(
      page.getByText("Invoice approved", { exact: true }),
    ).toBeVisible();
  });
});

test("the parts list has every package that's published", async ({ page }) => {
  const folder = path.join(import.meta.dirname, "..", "..", "..", "packages");
  const published = readdirSync(folder)
    .map(
      (name) =>
        JSON.parse(
          readFileSync(path.join(folder, name, "package.json"), "utf8"),
        ) as { name: string; private?: boolean },
    )
    .filter((manifest) => !manifest.private)
    .map((manifest) => manifest.name)
    .sort();

  await open(page, "/");
  const names = await page.locator(".site-parts__name").allTextContents();
  expect(names.sort()).toEqual(published);
  await expect(
    page.getByRole("heading", {
      name: `${published.length} packages. Install the ones you use.`,
    }),
  ).toBeVisible();
});

test("the road to 1.0 is the README's list, with what's left", async ({
  page,
}) => {
  const readme = readFileSync(
    path.join(import.meta.dirname, "..", "..", "..", "README.md"),
    "utf8",
  );
  await open(page, "/");
  await expect(page.locator(".site-road__item")).toHaveCount(
    [...readme.matchAll(/^- \[( |x)\] /gm)].length,
  );
  await expect(
    page.locator(".site-road__mark", { hasText: "Done" }),
  ).toHaveCount([...readme.matchAll(/^- \[x\] /gm)].length);
});

test.describe("telemetry", () => {
  // The site is built with a collector to send to only when it's asked
  // for, with NEXT_PUBLIC_OTLP_ENDPOINT. These tests are for the build
  // nobody asked: the one on your machine, and the one CI tests.
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_OTLP_ENDPOINT),
    "the site was built to send its numbers somewhere",
  );

  test("sends nothing from a build that wasn't given a collector", async ({
    page,
  }) => {
    const sent: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "GET" && request.method() !== "HEAD") {
        sent.push(`${request.method()} ${request.url()}`);
      }
    });

    await open(page, "/");
    // A move inside the app, which is the other thing that's measured.
    await page.goto("/blocks", { waitUntil: "networkidle" });
    await page.goBack({ waitUntil: "networkidle" });
    // What's left is sent when the page is hidden.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(sent).toEqual([]);
  });
});
