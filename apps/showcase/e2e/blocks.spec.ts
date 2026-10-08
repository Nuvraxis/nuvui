import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import {
  blocks,
  blocksHome,
  blocksIn,
  categories,
  categoryPath,
  viewPath,
} from "../src/lib/blocks";
import {
  open,
  overflow,
  pageProblems,
  press,
  settleStyles,
  wcag,
} from "./helpers";

// The blocks, and the pages that show them. What every page of the site has
// to have, such as one h1 and no axe violations, is tested for the blocks'
// pages in site.spec.ts, which goes through the same list of pages. A
// block's own page, the one a preview's frame shows, is tested here.

const blocksDir = path.join(import.meta.dirname, "..", "src", "blocks");

const source = async (block: string, file: string) =>
  (await readFile(path.join(blocksDir, block, file), "utf8"))
    // A checkout on Windows may have the other line ending.
    .replaceAll("\r\n", "\n")
    .trim();

const setTheme = (page: Page, theme: "light" | "dark") =>
  page.addInitScript((value) => localStorage.setItem("theme", value), theme);

// A phone's width, whatever the project's own screen is.
const phone = { width: 390, height: 800 };

test.describe("the list of blocks", () => {
  test("is the folders, and each folder is a block", async () => {
    const folders = (await readdir(blocksDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(blocks.map((block) => block.name).sort()).toEqual(folders);
  });

  for (const block of blocks) {
    test(`${block.name}: the manifest says what's there`, async () => {
      expect(
        categories.map((category) => category.slug),
        "its category is one of the categories",
      ).toContain(block.category);
      expect(block.files).toContain(`${block.name}.tsx`);
      expect(block.files).toContain(`${block.name}.scss`);
      expect(block.title.length).toBeGreaterThan(3);
      expect(block.description.length).toBeGreaterThan(30);

      // Every file it lists is in the folder, and nothing else is but the
      // manifest.
      const inFolder = (await readdir(path.join(blocksDir, block.name))).sort();
      expect(inFolder).toEqual([...block.files, "block.json"].sort());

      // What it says to install is what its files import from.
      const imported = new Set<string>();
      for (const file of block.files.filter(
        (name) => !name.endsWith(".scss"),
      )) {
        const text = await source(block.name, file);
        for (const [, from] of text.matchAll(/from "([^".][^"]*)"/g)) {
          if (!from) continue;
          const parts = from.split("/");
          const name = from.startsWith("@")
            ? parts.slice(0, 2).join("/")
            : (parts[0] ?? "");
          if (name !== "react") imported.add(name);
        }
      }
      // The table's column helpers come from TanStack Table, which the
      // table package asks for as a peer.
      if (imported.has("@nuvui/table")) imported.add("@tanstack/react-table");
      expect([...block.install].sort()).toEqual([...imported].sort());

      // Its classes are its own: none has the library's prefix or the
      // site's.
      const tsx = await source(block.name, `${block.name}.tsx`);
      for (const [, names] of tsx.matchAll(/className="([^"]+)"/g)) {
        for (const name of (names ?? "").split(" ")) {
          expect(name.startsWith(block.name), `${name} in ${block.name}`).toBe(
            true,
          );
        }
      }
    });
  }
});

for (const block of blocks) {
  test.describe(viewPath(block), () => {
    for (const theme of ["light", "dark"] as const) {
      test(`has no axe violations in ${theme}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await setTheme(page, theme);
        const problems = pageProblems(page);
        await open(page, viewPath(block));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        // Every chart drawn, so axe sees it.
        const charts = page.locator(".nuv-chart__plot");
        for (let index = 0; index < (await charts.count()); index += 1) {
          await expect(charts.nth(index).locator("svg").first()).toBeVisible();
        }

        await settleStyles(page);
        const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
        expect(results.violations).toEqual([]);
        expect(problems).toEqual([]);
      });
    }

    test("fits a phone's width, and a tablet's", async ({ page }) => {
      for (const size of [phone, { width: 768, height: 1024 }]) {
        await page.setViewportSize(size);
        await open(page, viewPath(block));
        expect(await overflow(page), `at ${size.width}`).toBeLessThanOrEqual(0);
      }
    });

    test("has a heading, is kept out of search, and has nothing of the site around it", async ({
      page,
    }) => {
      await open(page, viewPath(block));
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.locator(".site-header")).toHaveCount(0);
      await expect(page.locator(".site-footer")).toHaveCount(0);
    });

    test("Tab reaches everything, and everything it reaches has a name", async ({
      page,
      isMobile,
      browserName,
    }) => {
      // Safari only tabs to links with a setting changed, and a phone has
      // no Tab key.
      test.skip(isMobile || browserName === "webkit");
      await open(page, viewPath(block));

      const expected = await page.evaluate(() => {
        const all = document.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex="0"]',
        );
        return [...all].filter((element) => {
          if (element.matches(":disabled, [tabindex='-1']")) return false;
          if (element.closest("[inert], [hidden]")) return false;
          const box = element.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            getComputedStyle(element).visibility !== "hidden"
          );
        }).length;
      });
      expect(expected).toBeGreaterThan(0);

      const seen = new Set<string>();
      // A few presses more than there are stops, so a stop that's skipped
      // shows as a count that's short.
      for (let index = 0; index < expected + 3; index += 1) {
        await page.keyboard.press("Tab");
        const stop = await page.evaluate(() => {
          const element = document.activeElement;
          if (!element || element === document.body) return null;
          if (!element.hasAttribute("data-stop")) {
            element.setAttribute(
              "data-stop",
              String(document.querySelectorAll("[data-stop]").length),
            );
          }
          return element.getAttribute("data-stop");
        });
        if (stop === null) continue;
        if (!seen.has(stop)) {
          const element = page.locator(`[data-stop="${stop}"]`);
          // A chart is one stop, named by its aria-label. Everything else
          // is a link, a button or a field.
          await expect(element).toHaveAccessibleName(/\S/);
        }
        seen.add(stop);
      }
      expect(seen.size).toBeGreaterThanOrEqual(expected);
    });
  });
}

test.describe("what the blocks do", () => {
  test("sign in: the form is sent with Enter, and the page stays", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no Enter key to send a form with.");
    await open(page, "/blocks/view/sign-in");
    await page.getByRole("textbox", { name: "Email" }).fill("ada@example.com");
    await page.locator('input[name="password"]').fill("a long password");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/blocks\/view\/sign-in$/);
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(
      "ada@example.com",
    );
  });

  test("sign in: the side with the name is there on a wide screen only", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/blocks/view/sign-in");
    await expect(page.locator(".sign-in__aside")).toBeVisible();
    await expect(page.locator(".sign-in__brand--top")).toBeHidden();

    await page.setViewportSize(phone);
    await expect(page.locator(".sign-in__aside")).toBeHidden();
    await expect(page.locator(".sign-in__brand--top")).toBeVisible();
  });

  test("forgotten password: says what was sent, and can start again", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/forgot-password");
    await page.getByRole("textbox", { name: "Email" }).fill("ada@example.com");
    await press(page.getByRole("button", { name: "Send the link" }), isMobile);
    const said = page.getByRole("status");
    await expect(said).toContainText("Check your email");
    await expect(said).toContainText("ada@example.com");

    await press(
      page.getByRole("button", { name: "Use another address" }),
      isMobile,
    );
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("");
  });

  test("enter a code: the last digit sends the form", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "The digits are typed on a keyboard here.");
    await open(page, "/blocks/view/verify-code");
    const boxes = page.getByRole("group", { name: "Verification code" });
    await expect(boxes.getByRole("textbox")).toHaveCount(6);
    await boxes.getByRole("textbox").first().click();
    await page.keyboard.type("123456");
    await expect(page.getByRole("status")).toHaveText("Checking the code.");
  });

  test("sidebar that folds: folds to icons with the keyboard, and the person's menu opens and closes", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a phone the sidebar is a panel, tested below.");
    await open(page, "/blocks/view/sidebar-icons");
    const sidebar = page.getByRole("navigation", { name: "Main" });
    const wide = (await sidebar.boundingBox())?.width ?? 0;
    await expect(
      sidebar.getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");

    await page
      .getByRole("button", { name: /sidebar/i })
      .first()
      .focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(async () => (await sidebar.boundingBox())?.width ?? wide)
      .toBeLessThan(wide / 2);
    // Folded, an item is still a link with its name.
    await expect(sidebar.getByRole("link", { name: /Inbox/ })).toBeVisible();

    const person = sidebar.getByRole("button", { name: /Ada Lovelace/ });
    await person.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Sign out" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(person).toBeFocused();
  });

  test("sidebar that folds: on a phone it's a panel that opens and closes", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile);
    await open(page, "/blocks/view/sidebar-icons");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await page
      .getByRole("button", { name: /sidebar/i })
      .first()
      .tap();
    const panel = page.getByRole("dialog", { name: "Main" });
    await expect(panel.getByRole("link", { name: "Reports" })).toBeVisible();
  });

  test("sidebar with sections: a section opens and closes, and the open page is marked", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a phone the sidebar is a panel.");
    await open(page, "/blocks/view/sidebar-nested");
    const sidebar = page.getByRole("navigation", { name: "Main" });
    await expect(
      sidebar.getByRole("link", { name: "Revenue" }),
    ).toHaveAttribute("aria-current", "page");

    const orders = sidebar.getByRole("button", { name: "Orders" });
    await expect(orders).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar.getByRole("link", { name: "Returns" })).toBeHidden();
    await orders.focus();
    await page.keyboard.press("Enter");
    await expect(orders).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar.getByRole("link", { name: "Returns" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(sidebar.getByRole("link", { name: "Returns" })).toBeHidden();
  });

  test("top bar: the palette opens from the button and the keyboard, and runs a command", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/top-bar");
    const button = page.getByRole("button", { name: "Search" });
    const palette = page.getByRole("dialog", { name: "Search" });
    await press(button, isMobile);
    await expect(palette).toBeVisible();
    await press(
      palette.getByRole("option", { name: "Invite a teammate" }),
      isMobile,
    );
    await expect(palette).toBeHidden();
    await expect(page.getByText("Last run: Invite a teammate")).toBeVisible();

    if (isMobile) return;
    await button.focus();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(palette.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("top bar: the pages are in the bar on a wide screen and in a menu on a narrow one", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/top-bar");
    const inBar = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Orders" });
    const menu = page.getByRole("button", { name: "Pages" });

    if (!isMobile) {
      await expect(inBar).toBeVisible();
      await expect(menu).toBeHidden();
      return;
    }
    await expect(inBar).toBeHidden();
    await menu.tap();
    await expect(page.getByRole("menuitem", { name: "Orders" })).toBeVisible();
  });

  test("dashboard: the table sorts and the chart has its numbers", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/blocks/view/dashboard");
    const table = page.getByRole("table", { name: "Recent orders" });
    await expect(table.getByRole("rowheader").first()).toHaveText("ORD-7231");
    const sort = table.getByRole("button", { name: /Total/ });
    await sort.scrollIntoViewIfNeeded();
    await press(sort, isMobile);
    await expect(table.getByRole("rowheader").first()).toHaveText("ORD-7224");

    const numbers = page.getByRole("table", {
      name: "Revenue by month against target, November to October",
    });
    await expect(numbers.getByRole("row")).toHaveCount(13);
  });

  test("activity: cleared, it says there's nothing, and the list comes back", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/activity");
    await expect(page.getByRole("listitem")).toHaveCount(5);
    await press(page.getByRole("button", { name: "Clear" }), isMobile);
    await expect(page.getByText("Nothing yet")).toBeVisible();
    await expect(page.getByRole("listitem")).toHaveCount(0);
    await press(
      page.getByRole("button", { name: "Show the examples again" }),
      isMobile,
    );
    await expect(page.getByRole("listitem")).toHaveCount(5);
  });
});

test.describe("the blocks page", () => {
  test("lists every category, and each leads to its page", async ({
    page,
    request,
  }) => {
    await open(page, blocksHome);
    const list = page.getByRole("list").filter({
      has: page.getByRole("heading", { name: categories[0]?.title }),
    });
    for (const category of categories) {
      const link = list.getByRole("link", {
        name: category.title,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", categoryPath(category));
      expect((await request.get(categoryPath(category))).status()).toBe(200);
    }
    // One block is shown on this page, whole.
    await expect(page.locator('[data-block="dashboard"] iframe')).toHaveCount(
      1,
    );
  });

  test("the header says which section this is", async ({ page, isMobile }) => {
    test.skip(isMobile, "On a phone the links are in the menu.");
    const link = page
      .getByRole("banner")
      .getByRole("link", { name: "Blocks", exact: true });

    await open(page, "/");
    await expect(link).not.toHaveAttribute("aria-current");
    await open(page, blocksHome);
    await expect(link).toHaveAttribute("aria-current", "page");
    await open(page, "/blocks/accounts");
    await expect(link).toHaveAttribute("aria-current", "page");
  });

  test("an address that isn't a category or a block is the 404 page", async ({
    page,
  }) => {
    for (const address of ["/blocks/nothing", "/blocks/view/nothing"]) {
      const response = await page.goto(address);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "There's no page here",
      );
    }
  });
});

for (const category of categories) {
  const inCategory = blocksIn(category);

  test.describe(categoryPath(category), () => {
    test("shows every block it lists, each in a frame of its own", async ({
      page,
    }) => {
      await open(page, categoryPath(category));
      const cards = page.locator("[data-block]");
      await expect(cards).toHaveCount(inCategory.length);

      for (const [index, block] of inCategory.entries()) {
        const card = cards.nth(index);
        await expect(card).toHaveAttribute("data-block", block.name);
        await expect(
          card.getByRole("heading", { level: 2, name: block.title }),
        ).toBeVisible();
        const frame = card.locator("iframe");
        await expect(frame).toHaveAttribute("src", viewPath(block));
        await expect(frame).toHaveAttribute(
          "title",
          `Preview of ${block.title}`,
        );
        await expect(
          card.getByRole("link", { name: "Open in a new tab" }),
        ).toHaveAttribute("href", viewPath(block));

        // The frame loads when it's scrolled to, and then has the block.
        await frame.scrollIntoViewIfNeeded();
        await expect(
          card.frameLocator("iframe").getByRole("heading").first(),
        ).toBeVisible();
      }
    });

    test("names its own page in the list of categories", async ({ page }) => {
      await open(page, categoryPath(category));
      const nav = page.getByRole("navigation", { name: "Block categories" });
      await expect(nav.getByRole("link")).toHaveCount(categories.length + 1);
      await expect(nav.locator('[aria-current="page"]')).toHaveText(
        category.label,
      );
    });

    test("shows each block's files as they're written", async ({
      page,
      isMobile,
    }) => {
      await open(page, categoryPath(category));

      for (const block of inCategory) {
        const card = page.locator(`[data-block="${block.name}"]`);
        await card.scrollIntoViewIfNeeded();
        await press(card.getByRole("tab", { name: "Code" }), isMobile);
        await expect(card.locator(".site-block__command")).toHaveText(
          `pnpm add ${block.install.join(" ")}`,
        );

        for (const file of block.files) {
          await press(card.getByRole("tab", { name: file }), isMobile);
          const panel = card.getByRole("tabpanel", { name: file });
          const shown = await panel.locator("pre").evaluate(
            // innerText, as a person would select it. textContent has no
            // line breaks where Shiki puts each line in an element.
            (pre) => (pre as HTMLElement).innerText,
          );
          expect(shown.trim()).toBe(await source(block.name, file));
        }
        await press(card.getByRole("tab", { name: "Preview" }), isMobile);
        await expect(card.locator("iframe")).toBeVisible();
      }
    });
  });
}

test.describe("a block's preview", () => {
  const card = (page: Page) => page.locator('[data-block="sign-in"]');

  test("can be tried at a phone's width and a tablet's", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a phone the preview is the phone's own width.");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, "/blocks/accounts");
    const frame = card(page).locator("iframe");
    const widths = card(page).getByRole("radiogroup", {
      name: "Width of the Sign in preview",
    });
    const width = async () => (await frame.boundingBox())?.width ?? 0;
    const inside = card(page).frameLocator("iframe");

    // At the full width the block has its side with the name on it.
    expect(await width()).toBeGreaterThan(1024);
    await expect(inside.locator(".sign-in__aside")).toBeVisible();

    await widths.getByRole("radio", { name: "Phone width" }).click();
    await expect.poll(width).toBe(390);
    // The block lays itself out for the frame, not for the screen.
    await expect(inside.locator(".sign-in__aside")).toBeHidden();

    await widths.getByRole("radio", { name: "Tablet width" }).click();
    await expect.poll(width).toBe(768);

    await widths.getByRole("radio", { name: "Full width" }).click();
    await expect.poll(width).toBeGreaterThan(1024);
  });

  test("the widths aren't offered on a phone", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    await open(page, "/blocks/accounts");
    await expect(
      card(page).getByRole("radiogroup", {
        name: "Width of the Sign in preview",
      }),
    ).toBeHidden();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("follows the site's theme when it changes", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/blocks/accounts");
    const inside = card(page).frameLocator("iframe");
    await card(page).locator("iframe").scrollIntoViewIfNeeded();
    await expect(inside.locator("html")).toHaveAttribute(
      "data-theme",
      "system",
    );
    const background = () =>
      inside
        .locator(".sign-in")
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    const light = await background();

    await page.evaluate(() => window.scrollTo(0, 0));
    await press(page.getByRole("button", { name: /^Theme: / }), isMobile);
    await press(page.getByRole("menuitemradio", { name: "Dark" }), isMobile);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    // Nothing reloads. The frame hears of the change and follows.
    await expect(inside.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect.poll(background).not.toBe(light);
  });

  test("takes a theme put on the whole site", async ({ page }) => {
    // What the Themes page stores, written as it would write it.
    await page.addInitScript(() => {
      localStorage.setItem(
        "nuvui-site-theme",
        JSON.stringify({
          code: "test",
          css: '[data-preset="site"]{--color-primary:#b91c1c}',
        }),
      );
    });
    await open(page, "/blocks/view/sign-in");
    await expect(page.locator("html")).toHaveAttribute("data-preset", "site");
    await settleStyles(page);
    await expect
      .poll(() =>
        page
          .getByRole("button", { name: "Sign in" })
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe("rgb(185, 28, 28)");
  });

  test("copies a file", async ({ page, browserName, isMobile }) => {
    test.skip(browserName !== "chromium", "Only Chromium lets a test read it.");
    await open(page, "/blocks/accounts");
    await press(card(page).getByRole("tab", { name: "Code" }), isMobile);
    await press(
      card(page).getByRole("button", { name: "Copy sign-in.tsx of Sign in" }),
      isMobile,
    );
    await expect(card(page).getByRole("status").last()).toHaveText("Copied");
    expect(
      await page.evaluate(async () =>
        // Windows puts its own line endings on what it's given.
        (await navigator.clipboard.readText()).replaceAll("\r\n", "\n"),
      ),
    ).toBe(await source("sign-in", "sign-in.tsx"));
  });
});
