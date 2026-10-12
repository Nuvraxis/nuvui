import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  blocks,
  blocksHome,
  blocksIn,
  categories,
  categoryPath,
  registryPath,
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

  test("the registry for shadcn's tool has every block, with its files as they're written", async ({
    request,
  }) => {
    const list = await (await request.get("/r/registry.json")).json();
    expect(
      list.items.map((item: { name: string }) => item.name).sort(),
    ).toEqual(blocks.map((block) => block.name).sort());

    for (const block of blocks) {
      const response = await request.get(registryPath(block));
      expect(response.status(), block.name).toBe(200);
      const item = await response.json();
      expect(item.name).toBe(block.name);
      expect(item.type).toBe("registry:block");
      expect(item.title).toBe(block.title);
      expect(item.dependencies).toEqual(block.install);
      // The two files import each other by a relative path, so they have
      // to land in one folder.
      expect(item.files.map((file: { target: string }) => file.target)).toEqual(
        block.files.map((file) => `components/${block.name}/${file}`),
      );
      for (const [index, file] of block.files.entries()) {
        expect(item.files[index].content.trim()).toBe(
          await source(block.name, file),
        );
      }
    }
  });
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
          // A link in text that's being written is text to the Tab
          // key, which goes past it. The box it's in is the stop.
          if (element.parentElement?.closest('[contenteditable="true"]')) {
            return false;
          }
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

  test("top bar: the pages are in the bar on a wide screen and in a panel on a narrow one", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/top-bar");
    const inBar = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Orders" });
    const menu = page.getByRole("button", { name: "Menu" });

    if (!isMobile) {
      await expect(inBar).toBeVisible();
      await expect(inBar).not.toHaveAttribute("aria-current");
      await expect(
        page
          .getByRole("navigation", { name: "Main" })
          .getByRole("link", { name: "Overview" }),
      ).toHaveAttribute("aria-current", "page");
      await expect(menu).toBeHidden();
      return;
    }
    await expect(inBar).toBeHidden();
    await menu.tap();
    const panel = page.getByRole("dialog", { name: "Menu" });
    await expect(panel.getByRole("link")).toHaveText([
      "Overview",
      "Orders",
      "Customers",
      "Reports",
    ]);
    // Following a link takes the panel with it.
    await panel.getByRole("link", { name: "Orders" }).tap();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#orders$/);
  });

  test("top bar: the bar stays at the top while the page scrolls", async ({
    page,
  }) => {
    await open(page, "/blocks/view/top-bar");
    const bar = page.locator(".nuv-navbar");
    await expect(bar).toHaveClass(/nuv-navbar--sticky/);
    await expect(bar).toHaveCSS("position", "sticky");
    await expect(bar).toHaveCSS("top", "0px");
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

  test("dashboard: each figure says which way it went, in words", async ({
    page,
  }) => {
    await open(page, "/blocks/view/dashboard");
    const figure = (name: string) =>
      page.locator(".nuv-stat").filter({ hasText: name });

    await expect(page.locator(".nuv-stat")).toHaveCount(4);
    await expect(figure("Revenue")).toContainText(
      "$73,400Up 4.7% against September",
    );
    // A rise is drawn as good news, and so is a refund rate that fell.
    await expect(figure("Revenue").locator(".nuv-trend")).toHaveClass(
      /nuv-trend--good/,
    );
    await expect(figure("New customers").locator(".nuv-trend")).toHaveClass(
      /nuv-trend--bad/,
    );
    await expect(figure("Refund rate")).toContainText(
      "Down 0.4 pts against September",
    );
    await expect(figure("Refund rate").locator(".nuv-trend")).toHaveClass(
      /nuv-trend--good/,
    );
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

  test("table with a toolbar: the status filter narrows the rows, and ticked rows are acted on together", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/table-toolbar");
    const table = page.getByRole("table", { name: "Invoices" });
    await expect(table.getByRole("rowheader")).toHaveCount(5);

    const status = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await expect(status).toHaveText("Any status");
    await press(status, isMobile);
    await press(page.getByRole("option", { name: "Overdue" }), isMobile);
    await page.keyboard.press("Escape");
    await expect(status).toHaveText("Overdue");
    await expect(table.getByRole("rowheader")).toHaveText([
      "INV-2039",
      "INV-2034",
    ]);

    await table.getByRole("checkbox", { name: "Select INV-2039" }).check();
    await table.getByRole("checkbox", { name: "Select INV-2034" }).check();
    const bar = page.getByRole("group", { name: "Selected rows" });
    await expect(bar).toContainText("2 selected");
    await press(bar.getByRole("button", { name: "Mark as paid" }), isMobile);

    // Neither is overdue now, so the filter leaves nothing, and says why.
    await expect(table).toContainText("No rows match.");
    await press(table.getByRole("button", { name: "Clear filters" }), isMobile);
    await expect(status).toHaveText("Any status");
    await expect(
      table.getByRole("row", { name: /INV-2039/ }).getByText("Paid"),
    ).toBeVisible();
  });

  test("table with a toolbar: a row's menu acts on that row, and a column can be hidden", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/table-toolbar");
    const table = page.getByRole("table", { name: "Invoices" });
    const more = table.getByRole("button", { name: "Actions for INV-2040" });
    await more.scrollIntoViewIfNeeded();
    await press(more, isMobile);
    await press(page.getByRole("menuitem", { name: "Delete" }), isMobile);
    await expect(
      table.getByRole("rowheader", { name: "INV-2040" }),
    ).toHaveCount(0);

    await expect(
      table.getByRole("columnheader", { name: /Customer/ }),
    ).toBeVisible();
    await press(page.getByRole("button", { name: "Columns" }), isMobile);
    // The invoice number is always there, and so isn't offered.
    await expect(
      page.getByRole("menuitemcheckbox", { name: "Invoice" }),
    ).toHaveCount(0);
    await press(
      page.getByRole("menuitemcheckbox", { name: "Customer" }),
      isMobile,
    );
    // The menu stays open for more, and the page behind it is out of reach
    // until it's closed.
    await page.keyboard.press("Escape");
    await expect(
      table.getByRole("columnheader", { name: /Invoice/ }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: /Customer/ }),
    ).toHaveCount(0);
  });

  test("detail panel: a row opens its panel, the tabs change what it shows, and focus goes back to the row", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/detail-panel");
    const row = page.getByRole("button", { name: /Contoso/ });
    await press(row, isMobile);
    const panel = page.getByRole("dialog", { name: "Contoso" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("alan@example.com")).toBeVisible();

    await press(panel.getByRole("tab", { name: "Orders" }), isMobile);
    await expect(panel.getByText("ORD-7230")).toBeVisible();
    await expect(panel.getByText("alan@example.com")).toBeHidden();

    await press(
      panel.getByRole("button", { name: "Close", exact: true }).first(),
      isMobile,
    );
    await expect(panel).toBeHidden();
    if (!isMobile) await expect(row).toBeFocused();

    // A customer with no orders says so.
    await press(
      page.getByRole("button", { name: /Adventure Works/ }),
      isMobile,
    );
    const other = page.getByRole("dialog", { name: "Adventure Works" });
    await press(other.getByRole("tab", { name: "Orders" }), isMobile);
    await expect(other.getByText("No orders this year.")).toBeVisible();
  });

  test("empty, loading and error: each state shows, and says what it is", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/page-states");
    const body = page.getByRole("region", { name: "Projects" });
    const show = page.getByRole("radiogroup", { name: "State to show" });
    const said = page.getByRole("status");
    await expect(body).toHaveAttribute("aria-busy", "true");
    await expect(said).toHaveText("Loading the projects");

    await press(show.getByRole("radio", { name: "Loaded" }), isMobile);
    await expect(body).toHaveAttribute("aria-busy", "false");
    await expect(body.getByRole("link")).toHaveCount(3);
    await expect(said).toHaveText("3 projects");

    await press(show.getByRole("radio", { name: "Empty" }), isMobile);
    await expect(body.getByText("No projects yet")).toBeVisible();
    await expect(
      body.getByRole("button", { name: "New project" }),
    ).toBeVisible();

    await press(show.getByRole("radio", { name: "Error" }), isMobile);
    await expect(body.getByRole("alert")).toContainText(
      "The projects couldn't be loaded",
    );
    await press(body.getByRole("button", { name: "Try again" }), isMobile);
    await expect(body).toHaveAttribute("aria-busy", "true");
    await expect(body.getByRole("alert")).toHaveCount(0);
  });

  test("profile form: a chosen picture shows, a file of the wrong kind is refused, and saving says so", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/profile-form");
    const file = page.locator('input[type="file"]');
    await expect(page.locator(".profile-form__avatar img")).toHaveCount(0);

    await file.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a picture"),
    });
    await expect(
      page.getByText("notes.txt isn't a PNG or JPEG image."),
    ).toBeVisible();

    await file.setInputFiles({
      name: "me.png",
      mimeType: "image/png",
      // The smallest PNG there is: one transparent pixel.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await expect(page.locator(".profile-form__avatar img")).toHaveCount(1);
    await expect(
      page.getByText("notes.txt isn't a PNG or JPEG image."),
    ).toBeHidden();

    const said = page.locator(".profile-form__status");
    await press(page.getByRole("button", { name: "Save changes" }), isMobile);
    await expect(said).toHaveText("Saved.");
    // A change after that is one that hasn't been saved.
    await page.getByRole("textbox", { name: "Job title" }).fill("Controller");
    await expect(said).toHaveText("");
  });

  test("notification preferences: each switch is named and described, and the form says when it's saved", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/notifications");
    const summary = page.getByRole("switch", { name: "Weekly summary" });
    await expect(summary).toHaveAccessibleDescription(
      "What your team did, on Monday morning.",
    );
    await expect(summary).not.toBeChecked();
    await press(summary, isMobile);
    await expect(summary).toBeChecked();

    const said = page.locator(".notifications__status");
    await press(
      page.getByRole("button", { name: "Save preferences" }),
      isMobile,
    );
    await expect(said).toHaveText("Saved.");
    await press(summary, isMobile);
    await expect(said).toHaveText("");
  });

  test("team members: someone is invited, their role is changed, and the invitation is cancelled", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/team-members");
    const table = page.getByRole("table", { name: "Team" });
    const said = page.locator(".team-members__status");
    await expect(table.getByRole("rowheader")).toHaveCount(5);
    // The owner's role is words, not a control.
    await expect(
      page.getByRole("combobox", { name: "Role of Ada Lovelace" }),
    ).toHaveCount(0);

    await press(page.getByRole("button", { name: "Invite" }), isMobile);
    const dialog = page.getByRole("dialog", { name: "Invite someone" });
    await dialog
      .getByRole("textbox", { name: "Email" })
      .fill("mary@example.com");
    await press(
      dialog.getByRole("button", { name: "Send the invitation" }),
      isMobile,
    );
    await expect(dialog).toBeHidden();
    await expect(said).toHaveText(
      "An invitation was sent to mary@example.com.",
    );
    const row = table.getByRole("row", { name: /mary@example\.com/ });
    await expect(row).toContainText("Invited");

    const role = page.getByRole("combobox", {
      name: "Role of mary@example.com",
    });
    await role.scrollIntoViewIfNeeded();
    await expect(role).toHaveText("Member");
    await press(role, isMobile);
    await press(page.getByRole("option", { name: "Viewer" }), isMobile);
    await expect(role).toHaveText("Viewer");

    await press(
      page.getByRole("button", {
        name: "Cancel the invitation to mary@example.com",
      }),
      isMobile,
    );
    await expect(row).toHaveCount(0);
    await expect(said).toHaveText(
      "The invitation to mary@example.com was cancelled.",
    );
  });

  test("billing: the seats in use are a progress bar with its numbers, and every invoice can be downloaded", async ({
    page,
  }) => {
    await open(page, "/blocks/view/billing");
    const seats = page.getByRole("progressbar", {
      name: "18 of 25 seats used",
    });
    await expect(seats).toHaveAttribute("aria-valuetext", "18 of 25");

    const table = page.getByRole("table", { name: "Invoices" });
    await expect(table.getByRole("rowheader")).toHaveCount(4);
    for (const id of ["INV-2041", "INV-1987", "INV-1930", "INV-1876"]) {
      await expect(
        table.getByRole("link", { name: `Download ${id}` }),
      ).toHaveAttribute("href", `#${id}`);
    }
  });

  test("danger zone: deleting waits for the workspace's name to be typed", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/danger-zone");
    const open_ = page.getByRole("button", { name: "Delete", exact: true });
    await press(open_, isMobile);
    const dialog = page.getByRole("alertdialog", {
      name: "Delete acme-production?",
    });
    const field = dialog.getByRole("textbox", {
      name: "Type acme-production to confirm",
    });
    const confirm = dialog.getByRole("button", {
      name: "Delete the workspace",
    });
    await expect(confirm).toBeDisabled();
    await field.fill("acme-prod");
    await expect(confirm).toBeDisabled();

    // Closed and opened again, what was typed is gone.
    await press(
      dialog.getByRole("button", { name: "Keep the workspace" }),
      isMobile,
    );
    await expect(dialog).toBeHidden();
    await expect(page.locator(".danger-zone__status")).toHaveText("");
    await press(open_, isMobile);
    await expect(field).toHaveValue("");

    await field.fill("acme-production");
    await expect(confirm).toBeEnabled();
    await press(confirm, isMobile);
    await expect(dialog).toBeHidden();
    await expect(page.locator(".danger-zone__status")).toHaveText(
      "acme-production has been deleted.",
    );
    await expect(open_).toBeDisabled();
  });

  test("danger zone: archiving can be taken back", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/danger-zone");
    await press(page.getByRole("button", { name: "Archive" }), isMobile);
    await expect(
      page.getByRole("heading", { name: "Restore this workspace" }),
    ).toBeVisible();
    await press(page.getByRole("button", { name: "Restore" }), isMobile);
    await expect(
      page.getByRole("heading", { name: "Archive this workspace" }),
    ).toBeVisible();
  });

  test("audit log: two dates narrow it to those days, newest first, and a hidden column can be shown", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/audit-log");
    const table = page.getByRole("table", { name: "Audit log" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toContainText("Approved an invoice");

    const dates = page.getByRole("group", { name: "Dates" });
    const end = dates.getByRole("textbox", { name: "End date" });
    await dates.getByRole("textbox", { name: "Start date" }).fill("10/06/2026");
    await end.fill("10/07/2026");
    await end.blur();
    // The whole of the last day is in the range.
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toContainText("Changed the plan");
    await expect(rows.last()).toContainText("Exported a report");

    await expect(
      table.getByRole("columnheader", { name: /Address/ }),
    ).toHaveCount(0);
    await press(page.getByRole("button", { name: "Columns" }), isMobile);
    await press(
      page.getByRole("menuitemcheckbox", { name: "Address" }),
      isMobile,
    );
    await page.keyboard.press("Escape");
    await expect(
      table.getByRole("columnheader", { name: /Address/ }),
    ).toBeVisible();
  });

  test("navigation bar: the menu is in the bar on a wide screen and in a panel on a narrow one", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/nav-bar");
    const menu = page.getByRole("button", { name: "Menu" });
    const inBar = page.getByRole("navigation", { name: "Main" });

    if (!isMobile) {
      await expect(menu).toBeHidden();
      await expect(inBar.getByRole("link", { name: "Pricing" })).toBeVisible();
      const product = inBar.getByRole("button", { name: "Product" });
      await product.focus();
      await page.keyboard.press("Enter");
      await expect(product).toHaveAttribute("aria-expanded", "true");
      await expect(
        inBar.getByRole("link", { name: /Reminders/ }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(product).toHaveAttribute("aria-expanded", "false");
      await expect(product).toBeFocused();
      return;
    }

    await expect(inBar).toBeHidden();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeHidden();
    await menu.tap();
    const panel = page.getByRole("dialog", { name: "Menu" });
    await expect(panel.getByRole("link")).toHaveCount(7);
    // A link closes the panel on its way out.
    await panel.getByRole("link", { name: "Pricing" }).tap();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#pricing$/);
  });

  test("pricing: the prices follow the period that's chosen", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/pricing");
    const period = page.getByRole("radiogroup", { name: "Pay by" });
    const team = page.getByRole("listitem").filter({
      has: page.getByRole("heading", { name: "Team" }),
    });
    await expect(period.getByRole("radio", { name: "Yearly" })).toBeChecked();
    await expect(team).toContainText("$10 a person a month, paid by the year");
    await expect(team).toContainText("Most chosen");

    await press(period.getByRole("radio", { name: "Monthly" }), isMobile);
    await expect(team).toContainText("$12 a person a month");
    await expect(team).not.toContainText("paid by the year");
    // The free plan is free either way.
    await expect(
      page.getByRole("listitem").filter({
        has: page.getByRole("heading", { name: "Starter" }),
      }),
    ).toContainText("$0 for good");
    // Three links that would read the same are told apart by their plan.
    await expect(
      page.getByRole("link", { name: "Start a free trial, Team" }),
    ).toBeVisible();
  });

  test("questions and answers: one answer is open at a time, and it can be closed", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/faq");
    const first = page.getByRole("button", {
      name: "What happens when the trial ends?",
    });
    const second = page.getByRole("button", { name: "How can I pay?" });
    await expect(first).toHaveAttribute("aria-expanded", "false");

    await press(first, isMobile);
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByText("The workspace becomes read-only."),
    ).toBeVisible();

    await press(second, isMobile);
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(second).toHaveAttribute("aria-expanded", "true");

    await press(second, isMobile);
    await expect(second).toHaveAttribute("aria-expanded", "false");
  });

  test("footer: each list of links is a landmark with a name", async ({
    page,
  }) => {
    await open(page, "/blocks/view/footer");
    const footer = page.getByRole("contentinfo");
    for (const name of ["Product", "Company", "Help", "Legal"]) {
      await expect(
        footer.getByRole("navigation", { name, exact: true }),
      ).toBeVisible();
    }
    await expect(footer.getByRole("link")).toHaveCount(15);
  });

  test("hero and feature grid: the headings are in order, and the drawing is kept from screen readers", async ({
    page,
  }) => {
    await open(page, "/blocks/view/hero");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator(".hero__window")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(
      page.getByRole("link", { name: "Start free" }),
    ).toHaveAttribute("href", "#start");

    await open(page, "/blocks/view/feature-grid");
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(6);
  });

  test("set up in steps: each step says where you are, focus follows it, and the summary adds up", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/onboarding");
    const steps = page
      .getByRole("list", { name: "Setting up" })
      .getByRole("listitem");
    await expect(steps.nth(0)).toHaveAttribute("aria-current", "step");
    await expect(
      page.getByRole("radio", { name: "Team", exact: true }),
    ).toBeChecked();
    await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();

    await press(page.getByRole("button", { name: "Continue" }), isMobile);
    await expect(steps.nth(1)).toHaveAttribute("aria-current", "step");
    await expect(steps.nth(0)).toHaveText("Plan Completed");
    await expect(
      page.getByRole("heading", { name: "Your team" }),
    ).toBeFocused();

    const seats = page.getByRole("spinbutton", { name: "Seats" });
    await expect(seats).toHaveValue("5");
    await press(page.getByRole("button", { name: "Increase" }), isMobile);
    await expect(seats).toHaveValue("6");
    await expect(
      page.getByRole("checkbox", { name: "Audit log" }),
    ).toBeChecked();

    await press(page.getByRole("button", { name: "Continue" }), isMobile);
    // Six seats at $12, and $20 for the audit log.
    await expect(page.locator(".onboarding__row--total")).toHaveText(
      "Each month$92",
    );

    await press(page.getByRole("button", { name: "Back" }), isMobile);
    await expect(seats).toHaveValue("6");
    await press(page.getByRole("button", { name: "Continue" }), isMobile);
    await press(
      page.getByRole("button", { name: "Create workspace" }),
      isMobile,
    );
    await expect(
      page.getByRole("heading", { name: "Your workspace is ready" }),
    ).toBeFocused();
    await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
  });

  test("list with an action bar: the bar follows what's ticked, and says what was done", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/inbox");
    const bar = page.getByRole("group", { name: "Selected messages" });
    const rows = page
      .getByRole("list", { name: "Messages" })
      .getByRole("listitem");
    await expect(rows).toHaveCount(5);
    await expect(bar).toHaveAccessibleDescription("1 selected");

    await press(page.getByRole("checkbox", { name: "Select all" }), isMobile);
    await expect(bar).toHaveAccessibleDescription("5 selected");
    await press(page.getByRole("checkbox", { name: "Select all" }), isMobile);
    await expect(bar).toHaveCount(0);

    await press(
      page.getByRole("checkbox", {
        name: 'Select "Refund for order ORD-7228"',
      }),
      isMobile,
    );
    await press(bar.getByRole("button", { name: "Archive" }), isMobile);
    await expect(page.getByText("1 message archived.")).toBeVisible();
    await expect(rows).toHaveCount(4);
    await expect(bar).toHaveCount(0);
  });

  test("list with an action bar: deleting takes a hold, and an emptied list says so", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/inbox");
    const bar = page.getByRole("group", { name: "Selected messages" });
    await press(page.getByRole("checkbox", { name: "Select all" }), isMobile);
    const hold = bar.getByRole("button", { name: "Hold to delete" });

    // A press isn't enough.
    await hold.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("list", { name: "Messages" }).getByRole("listitem"),
    ).toHaveCount(5);

    await page.keyboard.down("Enter");
    await expect(page.getByText("5 messages deleted.")).toBeVisible({
      timeout: 4000,
    });
    await page.keyboard.up("Enter");
    await expect(page.getByText("Nothing left")).toBeVisible();

    await press(
      page.getByRole("button", { name: "Show the examples again" }),
      isMobile,
    );
    await expect(
      page.getByRole("list", { name: "Messages" }).getByRole("listitem"),
    ).toHaveCount(5);
  });

  test("reviews: the average is one picture with a name, and a review needs its stars", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/reviews");
    await expect(page.getByRole("img", { name: "4.4 out of 5" })).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "5 stars" }),
    ).toHaveAttribute("aria-valuetext", "62% of reviews");

    await press(page.getByRole("button", { name: "Send review" }), isMobile);
    // Next has an alert of its own in every page, so this one is found
    // by its words.
    const missing = page.getByText("Choose a number of stars.");
    await expect(missing).toHaveAttribute("role", "alert");
    const stars = page.getByRole("radiogroup", { name: "Your rating" });
    await expect(stars).toHaveAttribute("aria-invalid", "true");

    await press(stars.getByRole("radio", { name: "4 stars" }), isMobile);
    await expect(missing).toHaveCount(0);
    await press(page.getByRole("button", { name: "Send review" }), isMobile);
    await expect(
      page.getByText("Thanks. Your review is waiting to be checked."),
    ).toBeVisible();
  });

  test("page with its contents: the list is beside the text on a wide screen, and marks the heading being read", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone isn't this wide.");
    await page.setViewportSize({ width: 1280, height: 700 });
    await open(page, "/blocks/view/article");
    const nav = page.getByRole("navigation", { name: "On this page" });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveCount(6);
    await expect(
      page.getByRole("button", { name: "On this page" }),
    ).toHaveCount(0);

    await nav.getByRole("link", { name: "Claiming it back" }).click();
    await expect(page).toHaveURL(/#claiming$/);
    await expect(nav.locator('[aria-current="location"]')).toHaveText(
      "Claiming it back",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(0);
  });

  test("page with its contents: on a narrow screen the list is behind a button", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize(phone);
    await open(page, "/blocks/view/article");
    const nav = page.getByRole("navigation", { name: "On this page" });
    await expect(nav).toHaveCount(0);

    const toggle = page.getByRole("button", { name: "On this page" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await press(toggle, isMobile);
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Limits" })).toHaveAttribute(
      "data-depth",
      "2",
    );
  });

  test("ask a question: the wait is said in a status, and the answer takes its place", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/ask-panel");
    const status = page.getByRole("status");
    await expect(status).toHaveText("");

    await press(
      page.getByRole("button", { name: "How many refunds are still open?" }),
      isMobile,
    );
    await expect(status).toHaveText("Reading last month's orders");
    await expect(status.locator(".nuv-text-shimmer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask" })).toBeDisabled();

    await expect(status).toContainText("Seven, worth $1,284 together.", {
      timeout: 8000,
    });
    await expect(status.locator(".nuv-text-shimmer")).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Your question" }),
    ).toHaveValue("How many refunds are still open?");
    await expect(page.getByRole("button", { name: "Ask" })).toBeEnabled();
  });

  test("figures: each has its trend in words, and a falling refund rate is good news", async ({
    page,
  }) => {
    await open(page, "/blocks/view/figures");
    const figures = page.getByRole("listitem");
    await expect(figures).toHaveCount(4);
    await expect(figures.locator(".nuv-trend")).toHaveCount(4);

    // The arrow is a picture. The word is in the page for screen readers.
    await expect(figures.nth(0).locator(".nuv-trend")).toHaveText(/Up\s*4\.7%/);
    const refunds = figures.nth(3).locator(".nuv-trend");
    await expect(refunds).toHaveText(/Down\s*0\.4 pts/);
    const customers = figures.nth(2).locator(".nuv-trend");
    expect(await refunds.getAttribute("class")).not.toBe(
      await customers.getAttribute("class"),
    );
  });

  test("filters in a sentence and a sheet: the selects in the sentence narrow the list", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/blocks/view/filter-sheet");
    const rows = page
      .getByRole("list", { name: "Orders" })
      .getByRole("listitem");
    const count = page.getByRole("status");
    await expect(rows).toHaveCount(7);
    await expect(count).toHaveText("7 orders");

    await press(page.getByRole("combobox", { name: "Status" }), isMobile);
    await press(
      page.getByRole("option", { name: "refunded orders" }),
      isMobile,
    );
    await expect(rows).toHaveCount(2);
    await expect(count).toHaveText("2 orders");

    await press(page.getByRole("combobox", { name: "Period" }), isMobile);
    await press(
      page.getByRole("option", { name: "the last 7 days" }),
      isMobile,
    );
    await expect(rows).toHaveCount(1);
    await expect(count).toHaveText("1 order");
    await expect(page.getByRole("combobox", { name: "Period" })).toHaveText(
      "the last 7 days",
    );
  });

  test("filters in a sentence and a sheet: the sheet opens half way up, its handle makes it taller, and its filters count", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/blocks/view/filter-sheet");
    const more = page.getByRole("button", { name: /More filters/ });
    await press(more, isMobile);
    const sheet = page.getByRole("dialog", { name: "More filters" });
    await expect(sheet).toBeVisible();
    const height = async () => (await sheet.boundingBox())?.height ?? 0;
    const screen = page.viewportSize()?.height ?? 0;
    expect(Math.abs((await height()) - screen * 0.5)).toBeLessThanOrEqual(2);

    await sheet.getByRole("button", { name: "Change size" }).focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(async () => Math.abs((await height()) - screen * 0.92))
      .toBeLessThanOrEqual(2);

    await press(sheet.getByRole("checkbox", { name: "Card" }), isMobile);
    const show = sheet.getByRole("button", { name: /^Show \d+ orders?$/ });
    await expect(show).toHaveText("Show 3 orders");
    await press(show, isMobile);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("status")).toHaveText("3 orders");
    await expect(more).toHaveText(/More filters\s*1 in use/);
  });

  test("filters in a sentence and a sheet: a finger swipes the sheet away", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "A swipe is a finger's.");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/blocks/view/filter-sheet");
    await page.getByRole("button", { name: /More filters/ }).tap();
    const sheet = page.getByRole("dialog", { name: "More filters" });
    await expect(sheet).toBeVisible();

    // What a finger sends, dragged from the heading most of the way down.
    await sheet
      .getByRole("heading", { name: "More filters" })
      .evaluate(async (heading) => {
        const send = (type: string, y: number) =>
          heading.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              button: 0,
              pointerId: 9,
              pointerType: "touch",
              clientX: 100,
              clientY: y,
            }),
          );
        send("pointerdown", 100);
        send("pointermove", 250);
        send("pointermove", 500);
        await new Promise((resolve) => setTimeout(resolve, 40));
        send("pointermove", 500);
        send("pointerup", 500);
      });

    await expect(sheet).toBeHidden();
  });
});

test.describe("file browser", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/file-browser");
  });

  const row = (page: Page, name: string) =>
    page
      .getByRole("tree", { name: "Folders and files" })
      .getByRole("treeitem", { name, exact: true });
  // The part of a row that's pressed, which isn't the rows inside it.
  const face = (page: Page, name: string) =>
    row(page, name).locator("> .nuv-tree__row");
  const detail = (page: Page) => page.locator(".file-browser__detail");

  test("file browser: the panel shows the file that's selected", async ({
    page,
    isMobile,
  }) => {
    await expect(row(page, "template.docx")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(detail(page).getByRole("heading")).toHaveText("template.docx");
    await expect(detail(page)).toContainText("Files / Contracts");
    await expect(detail(page)).toContainText("48 KB");

    await press(face(page, "handbook.pdf"), isMobile);

    await expect(detail(page).getByRole("heading")).toHaveText("handbook.pdf");
    await expect(detail(page)).toContainText("2.4 MB");
    await expect(row(page, "template.docx")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  test("file browser: a folder opens when it's pressed, and its panel lists what's inside", async ({
    page,
    isMobile,
  }) => {
    await expect(row(page, "q3.xlsx")).toHaveCount(0);

    await press(face(page, "Reports"), isMobile);

    await expect(row(page, "Reports")).toHaveAttribute("aria-expanded", "true");
    await expect(row(page, "q3.xlsx")).toBeVisible();
    await expect(detail(page)).toContainText("2 items");
    await expect(detail(page).getByRole("button")).toHaveText([
      "q3.xlsx",
      "q3-summary.pdf",
    ]);
  });

  test("file browser: choosing from the panel opens the tree to it", async ({
    page,
    isMobile,
  }) => {
    await press(face(page, "Contracts"), isMobile);
    // That closed the folder, which was open. Its panel still lists it.
    await expect(row(page, "2026")).toHaveCount(0);

    await press(detail(page).getByRole("button", { name: "2026" }), isMobile);
    await expect(row(page, "2026")).toHaveAttribute("aria-selected", "true");
    await press(
      detail(page).getByRole("button", { name: "northwind.pdf" }),
      isMobile,
    );

    await expect(row(page, "northwind.pdf")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(detail(page)).toContainText("Files / Contracts / 2026");
    await expect(detail(page)).toContainText("Ada Lovelace");
  });

  test("file browser: a folder with nothing in it says so, and doesn't open", async ({
    page,
    isMobile,
  }) => {
    await press(face(page, "Archive"), isMobile);

    await expect(row(page, "Archive")).not.toHaveAttribute("aria-expanded");
    await expect(detail(page)).toContainText("There's nothing in this folder.");
  });

  test("file browser: the keyboard moves through the tree, opens a folder and selects a file", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await row(page, "Contracts").focus();

    await page.keyboard.press("ArrowDown");
    await expect(row(page, "2026")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(row(page, "2026")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowRight");
    await expect(row(page, "northwind.pdf")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(detail(page).getByRole("heading")).toHaveText("northwind.pdf");

    // A letter goes to the next name that starts with it.
    await page.keyboard.press("h");
    await expect(row(page, "handbook.pdf")).toBeFocused();
    // And the tree is one stop for Tab: the next is in the panel.
    await page.keyboard.press("Tab");
    await expect(
      detail(page).getByRole("button", { name: "Download" }),
    ).toBeFocused();
  });
});

test.describe("file browser, moving", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/file-browser");
  });

  const row = (page: Page, name: string) =>
    page
      .getByRole("tree", { name: "Folders and files" })
      .getByRole("treeitem", { name, exact: true });
  const face = (page: Page, name: string) =>
    row(page, name).locator("> .nuv-tree__row");
  const detail = (page: Page) => page.locator(".file-browser__detail");
  const moveTo = (page: Page) =>
    page.getByRole("combobox", { name: "Move to" });

  test("file browser: the list in the panel moves the chosen file into a folder, and the tree opens to it", async ({
    page,
    isMobile,
  }) => {
    await press(face(page, "handbook.pdf"), isMobile);
    await expect(moveTo(page)).toHaveText("Files");
    await expect(row(page, "Reports")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await moveTo(page).scrollIntoViewIfNeeded();
    await press(moveTo(page), isMobile);
    await press(
      page.getByRole("option", { name: "Reports", exact: true }),
      isMobile,
    );

    await expect(moveTo(page)).toHaveText("Reports");
    await expect(row(page, "Reports")).toHaveAttribute("aria-expanded", "true");
    await expect(
      row(page, "Reports").getByRole("treeitem", { name: "handbook.pdf" }),
    ).toBeVisible();
    await expect(detail(page)).toContainText("Files / Reports");
  });

  test("file browser: the list offers every folder but the chosen one and those inside it, and moves back to the top", async ({
    page,
    isMobile,
  }) => {
    await press(face(page, "Contracts"), isMobile);
    await moveTo(page).scrollIntoViewIfNeeded();
    await press(moveTo(page), isMobile);
    await expect(page.getByRole("option")).toHaveText([
      "Files",
      "Reports",
      "Archive",
    ]);
    await page.keyboard.press("Escape");

    await press(face(page, "Contracts"), isMobile);
    await press(face(page, "template.docx"), isMobile);
    await expect(moveTo(page)).toHaveText("Contracts");
    await moveTo(page).scrollIntoViewIfNeeded();
    await press(moveTo(page), isMobile);
    await press(
      page.getByRole("option", { name: "Files", exact: true }),
      isMobile,
    );

    await expect(moveTo(page)).toHaveText("Files");
    await expect(
      row(page, "Contracts").getByRole("treeitem", { name: "template.docx" }),
    ).toHaveCount(0);
    await expect(row(page, "template.docx")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("file browser: Alt and an arrow moves a file into the folder above, which opens", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await row(page, "handbook.pdf").focus();

    await page.keyboard.press("Alt+ArrowUp");

    // Archive had nothing in it, and couldn't be opened.
    await expect(row(page, "Archive")).toHaveAttribute("aria-expanded", "true");
    await expect(
      row(page, "Archive").getByRole("treeitem", { name: "handbook.pdf" }),
    ).toBeFocused();
  });

  test("file browser: a file dragged onto a file goes beside it, since only a folder holds files", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "A finger picks a row up by holding, which the tree's own tests cover.",
    );
    const from = await face(page, "handbook.pdf").boundingBox();
    const to = await face(page, "template.docx").boundingBox();
    if (!from || !to) throw new Error("the rows aren't there");

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      from.x + from.width / 2,
      from.y + from.height / 2 - 6,
      { steps: 2 },
    );
    await page.mouse.move(to.x + to.width / 2, to.y + to.height * 0.6, {
      steps: 5,
    });
    await expect(row(page, "template.docx")).toHaveAttribute(
      "data-drop",
      "after",
    );
    await page.mouse.up();

    await expect(
      row(page, "Contracts").getByRole("treeitem", { name: "handbook.pdf" }),
    ).toBeVisible();
    await expect(row(page, "template.docx")).not.toHaveAttribute(
      "aria-expanded",
    );
    // The drag chose nothing: the panel still shows what it did.
    await expect(detail(page).getByRole("heading")).toHaveText("template.docx");
  });
});

test.describe("approvals", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/approvals");
  });

  const list = (page: Page) =>
    page.getByRole("grid", { name: "Requests waiting for you" });
  const row = (page: Page, id: string) =>
    list(page).locator(`[role="row"][data-value="${id}"]`);
  // The name in a row, away from its buttons.
  const face = (page: Page, id: string) =>
    row(page, id).locator(".approvals__from");
  // What was done, as the block says it. The action bar has a status of
  // its own, so the role alone would find two.
  const said = (page: Page) => page.locator(".approvals__said");
  const bar = (page: Page) =>
    page.getByRole("group", { name: "Selected requests" });

  test("approvals: a row's own button decides that request, and focus goes to the next", async ({
    page,
    isMobile,
  }) => {
    await expect(list(page).getByRole("row")).toHaveCount(4);
    await expect(page.getByText("4 requests waiting for you.")).toBeVisible();

    await press(
      page.getByRole("button", { name: "Approve REQ-317" }),
      isMobile,
    );

    await expect(said(page)).toHaveText("REQ-317 approved.");
    await expect(list(page).getByRole("row")).toHaveCount(3);
    await expect(page.getByText("3 requests waiting for you.")).toBeVisible();
    await expect(row(page, "REQ-315")).toBeFocused();
    // Nothing was selected by it.
    await expect(bar(page)).toHaveCount(0);
  });

  test("approvals: several are selected by pressing their rows, and decided from the bar", async ({
    page,
    isMobile,
  }) => {
    await press(face(page, "REQ-318"), isMobile);
    await press(face(page, "REQ-311"), isMobile);
    await expect(row(page, "REQ-318")).toHaveAttribute("aria-selected", "true");
    await expect(bar(page)).toHaveAccessibleDescription("2 selected");

    await press(bar(page).getByRole("button", { name: "Decline" }), isMobile);

    await expect(said(page)).toHaveText("2 requests declined.");
    await expect(list(page).getByRole("row")).toHaveCount(2);
    await expect(bar(page)).toHaveCount(0);
    await expect(row(page, "REQ-317")).toBeFocused();
  });

  test("approvals: the arrow keys move between requests, and Tab goes into the one it's at", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await row(page, "REQ-318").focus();

    await page.keyboard.press("ArrowDown");
    await expect(row(page, "REQ-317")).toBeFocused();
    // A letter goes to the next person whose name starts with it.
    await page.keyboard.press("d");
    await expect(row(page, "REQ-311")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(row(page, "REQ-318")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(row(page, "REQ-318")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Space");
    await expect(row(page, "REQ-318")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Safari leaves anything that isn't a field out of the Tab order
    // unless a setting is changed.
    test.skip(browserName === "webkit", "Safari's Tab skips buttons.");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Approve REQ-317" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Decline REQ-317" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(said(page)).toHaveText("REQ-317 declined.");
    await expect(row(page, "REQ-315")).toBeFocused();
  });

  test("approvals: with every request decided it says so, and the examples come back", async ({
    page,
    isMobile,
  }) => {
    for (const id of ["REQ-318", "REQ-317", "REQ-315", "REQ-311"]) {
      await press(
        page.getByRole("button", { name: `Approve ${id}` }),
        isMobile,
      );
    }

    await expect(page.getByText("All done")).toBeVisible();
    await expect(page.getByText("Nothing is waiting for you.")).toBeVisible();
    await expect(list(page)).toHaveCount(0);

    await press(
      page.getByRole("button", { name: "Show the examples again" }),
      isMobile,
    );
    await expect(list(page).getByRole("row")).toHaveCount(4);
  });

  test("approvals: on a phone a row's buttons go under its name, and nothing runs off the side", async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    const name = await face(page, "REQ-318").boundingBox();
    const approve = await page
      .getByRole("button", { name: "Approve REQ-318" })
      .boundingBox();

    expect(approve?.y ?? 0).toBeGreaterThan(
      (name?.y ?? 0) + (name?.height ?? 0),
    );
    expect(await overflow(page)).toBe(0);
  });
});

test.describe("appearance", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/appearance");
  });

  const brand = (page: Page) =>
    page.getByRole("button", { name: "Brand color" });
  const note = (page: Page) => page.locator(".appearance__note");
  // The picture's button, which takes the brand color.
  const pictured = (page: Page) =>
    page
      .locator(".appearance__button")
      .evaluate((node) => getComputedStyle(node).backgroundColor);

  test("appearance: each color is a row whose button says the color and what it's for", async ({
    page,
  }) => {
    await expect(brand(page)).toHaveText("#2563eb");
    await expect(brand(page)).toHaveAccessibleDescription(
      "Buttons and links. White text sits on it. #2563eb",
    );
    await expect(
      page.getByRole("button", { name: "Sidebar color" }),
    ).toHaveText("#1e293b");
    expect(await pictured(page)).toBe("rgb(37, 99, 235)");
  });

  test("appearance: a preset changes the color, and the picture with it", async ({
    page,
    isMobile,
  }) => {
    await press(brand(page), isMobile);
    const dialog = page.getByRole("dialog");
    await press(dialog.getByRole("button", { name: "Teal" }), isMobile);
    await page.keyboard.press("Escape");

    await expect(brand(page)).toHaveText("#0f766e");
    await expect.poll(() => pictured(page)).toBe("rgb(15, 118, 110)");
    await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  test("appearance: a color white text can't be read on is said, and can't be saved", async ({
    page,
    isMobile,
  }) => {
    await press(brand(page), isMobile);
    await page.getByRole("dialog").getByRole("textbox").fill("#fde047");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");

    await expect(note(page)).toHaveText(
      "White text is hard to read on the brand color. Choose a darker one.",
    );
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();

    await press(page.getByRole("button", { name: "Reset" }), isMobile);
    await expect(brand(page)).toHaveText("#2563eb");
    await expect(note(page)).toHaveText("Put back to the colors it came with.");
    await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  test("appearance: saving says so, and the colors are in the form", async ({
    page,
    isMobile,
  }) => {
    await expect(page.locator('input[name="brand"]')).toHaveValue("#2563eb");
    await expect(page.locator('input[name="sidebar"]')).toHaveValue("#1e293b");

    await press(page.getByRole("button", { name: "Save" }), isMobile);

    await expect(note(page)).toHaveText("Saved.");
  });

  test("appearance: the picker opens from the keyboard and its thumb moves with the arrow keys", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await brand(page).focus();
    await page.keyboard.press("Enter");
    const thumb = page
      .getByRole("dialog")
      .getByRole("slider", { name: "Saturation and brightness" });
    await expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "Saturation 84%, brightness 92%",
    );

    await thumb.focus();
    await page.keyboard.press("ArrowRight");

    await expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "Saturation 85%, brightness 92%",
    );
    await expect(brand(page)).toHaveText("#2362eb");
    await page.keyboard.press("Escape");
    await expect(brand(page)).toBeFocused();
  });

  test("appearance: on a phone the picker stays on the screen, and nothing runs off the side", async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    await brand(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(phone.width);
    expect(await overflow(page)).toBe(0);
  });
});

test.describe("query editor", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/query-editor");
  });

  const handle = (page: Page) =>
    page.getByRole("separator", { name: "Resize the query" });

  test("query editor: a saved query fills the box, and Run shows its rows", async ({
    page,
    isMobile,
  }) => {
    const sql = page.getByRole("textbox", { name: "SQL" });
    await expect(sql).toHaveValue(/where status = 'overdue'/);
    await expect(page.getByRole("status")).toHaveText(
      "Overdue invoices: 4 rows",
    );

    await press(page.getByRole("combobox", { name: "Saved query" }), isMobile);
    await press(
      page.getByRole("option", { name: "Largest customers" }),
      isMobile,
    );
    await expect(sql).toHaveValue(/group by customer/);
    // Choosing isn't running: the rows are still the last query's.
    await expect(page.getByRole("status")).toHaveText(
      "Overdue invoices: 4 rows",
    );

    await press(page.getByRole("button", { name: "Run" }), isMobile);
    await expect(page.getByRole("status")).toHaveText(
      "Largest customers: 5 rows",
    );
    await expect(page.getByRole("columnheader")).toHaveText([
      "customer",
      "invoices",
      "total",
    ]);
    await expect(page.getByRole("row")).toHaveCount(6);
  });

  test("query editor: the query is above its rows, with a handle between that says how much it has", async ({
    page,
  }) => {
    await expect(handle(page)).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "45");
    await expect(handle(page)).toHaveAttribute("aria-valuemin", "30");
    await expect(handle(page)).toHaveAttribute("aria-valuemax", "75");

    const sql = await page.getByRole("textbox", { name: "SQL" }).boundingBox();
    const rows = await page.getByRole("table").boundingBox();
    const line = await handle(page).boundingBox();
    if (!sql || !rows || !line) throw new Error("nothing to measure");
    expect(sql.y + sql.height).toBeLessThan(line.y);
    expect(rows.y).toBeGreaterThan(line.y);
  });

  test("query editor: the arrow keys give the query more room, and it's still there after a reload", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const box = page.getByRole("textbox", { name: "SQL" });
    const before = (await box.boundingBox())?.height ?? 0;
    await handle(page).focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "55");
    await expect
      .poll(async () => (await box.boundingBox())?.height ?? 0)
      .toBeGreaterThan(before);
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("nuv-resizable:query-editor")),
      )
      .toBe('{"query":55,"rows":45}');

    await open(page, "/blocks/view/query-editor");

    await expect(handle(page)).toHaveAttribute("aria-valuenow", "55");
  });

  test("query editor: the handle stops where either part would be too small", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    await handle(page).focus();

    await page.keyboard.press("Home");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "30");
    await page.keyboard.press("End");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "75");
    await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
    await expect(page.getByRole("columnheader").first()).toBeVisible();
  });
});

test.describe("what's new", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/whats-new");
  });

  // The dot the carousel is at.
  const current = (page: Page) =>
    page.locator('.nuv-carousel__dot[aria-current="true"]');
  const note = (page: Page, name: string) =>
    page.getByRole("heading", { name, level: 2 });

  test("what's new: Next goes through the notes, and Back is off at the first", async ({
    page,
    isMobile,
  }) => {
    await expect(
      page.getByRole("region", { name: "What's new in October" }),
    ).toHaveAttribute("aria-roledescription", "carousel");
    await expect(note(page, "Export invoices as CSV")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
    await expect(current(page)).toHaveAccessibleName("Go to slide 1");

    await press(page.getByRole("button", { name: "Next" }), isMobile);
    await expect(current(page)).toHaveAccessibleName("Go to slide 2");
    await expect(note(page, "A read-only role")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Back" })).toBeEnabled();

    await press(page.getByRole("button", { name: "Back" }), isMobile);
    await expect(current(page)).toHaveAccessibleName("Go to slide 1");
  });

  test("what's new: the last note has Done in place of Next, and Done says so", async ({
    page,
    isMobile,
  }) => {
    await press(page.getByRole("button", { name: "Next" }), isMobile);
    await press(page.getByRole("button", { name: "Next" }), isMobile);
    await expect(note(page, "Single sign-on is out of beta")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);

    await press(page.getByRole("button", { name: "Done" }), isMobile);

    await expect(page.getByRole("status")).toHaveText("You're up to date.");
    // The button that was pressed is gone, and focus is on the one that
    // took its place.
    await expect(
      page.getByRole("button", { name: "Read them again" }),
    ).toBeFocused();

    await press(
      page.getByRole("button", { name: "Read them again" }),
      isMobile,
    );
    await expect(current(page)).toHaveAccessibleName("Go to slide 1");
    await expect(page.getByRole("button", { name: "Next" })).toBeFocused();
  });

  test("what's new: a dot goes straight to a note, and the buttons follow it", async ({
    page,
    isMobile,
  }) => {
    await press(page.getByRole("button", { name: "Go to slide 3" }), isMobile);

    await expect(note(page, "Single sign-on is out of beta")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back" })).toBeEnabled();
  });

  test("what's new: a note that's out of sight is out of reach", async ({
    page,
  }) => {
    await expect
      .poll(() =>
        page
          .locator(".nuv-carousel__item")
          .evaluateAll((slides) =>
            slides
              .map((slide) => (slide.hasAttribute("inert") ? "x" : "o"))
              .join(""),
          ),
      )
      .toBe("oxx");
  });
});

// Which slides of the page's carousel are within reach: "o" for one that
// is, "x" for one that isn't.
const slidesInReach = (page: Page) =>
  page
    .locator(".nuv-carousel__item")
    .evaluateAll((slides) =>
      slides.map((slide) => (slide.hasAttribute("inert") ? "x" : "o")).join(""),
    );

test.describe("product gallery", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/product-gallery");
  });

  const thumbnail = (page: Page, name: string) =>
    page
      .getByRole("group", { name: "Choose a photograph" })
      .getByRole("button", { name, exact: true });

  test("product gallery: a thumbnail shows its photograph and is marked", async ({
    page,
    isMobile,
  }) => {
    await expect(
      page.getByRole("region", {
        name: "Photographs of the Linden armchair",
      }),
    ).toHaveAttribute("aria-roledescription", "carousel");
    await expect(thumbnail(page, "Front")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect.poll(() => slidesInReach(page)).toBe("oxxx");

    await press(thumbnail(page, "Back"), isMobile);

    await expect(thumbnail(page, "Back")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(thumbnail(page, "Front")).not.toHaveAttribute("aria-current");
    await expect.poll(() => slidesInReach(page)).toBe("xxox");
    await expect(
      page.locator("figcaption", { hasText: "Back" }),
    ).toBeInViewport();
  });

  test("product gallery: the arrows over the picture go on, and round from the last to the first", async ({
    page,
    isMobile,
  }) => {
    const next = page.getByRole("button", { name: "Next slide" });
    await expect(next).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Previous slide" }),
    ).toBeEnabled();

    await press(thumbnail(page, "Detail of the seam"), isMobile);
    await expect(thumbnail(page, "Detail of the seam")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await press(next, isMobile);

    await expect(thumbnail(page, "Front")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("product gallery: the picture between the arrows can still be dragged", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A drag with a mouse. A swipe is checked by hand.");
    const box = await page.locator(".nuv-carousel__viewport").boundingBox();
    if (!box) throw new Error("the photographs aren't there");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 8 });
    await page.mouse.up();

    await expect(thumbnail(page, "Side")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("product gallery: adding to the cart says so, and says how many", async ({
    page,
    isMobile,
  }) => {
    // The carousel has a status of its own, for the slide it's at.
    const said = page.locator(".product-gallery__about [role='status']");
    await expect(said).toHaveText("");

    await press(page.getByRole("button", { name: "Add to cart" }), isMobile);
    await expect(said).toHaveText("Added to your cart.");

    await press(page.getByRole("button", { name: "Add to cart" }), isMobile);
    await expect(said).toHaveText("2 in your cart.");
  });
});

test.describe("customer stories", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/case-studies");
  });

  test("customer stories: the carousel is named by its heading, and each story by its company", async ({
    page,
  }) => {
    const carousel = page.getByRole("region", { name: "Customer stories" });

    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    await expect(
      carousel.getByRole("group", { name: "Northwind" }),
    ).toBeVisible();
    await expect(page.locator(".nuv-carousel__item")).toHaveCount(5);
  });

  test("customer stories: more show on a wider screen, and the rest are out of reach", async ({
    page,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    // One and the edge of the next on a phone, two from 768 and three
    // from 1024.
    const whole = width >= 1024 ? 3 : 2;

    await expect
      .poll(async () => (await slidesInReach(page)).split("x")[0]?.length)
      .toBe(whole);
    await expect
      .poll(() => slidesInReach(page))
      .toBe("o".repeat(whole) + "x".repeat(5 - whole));
  });

  test("customer stories: the arrows move a story at a time, and stop at the ends", async ({
    page,
    isMobile,
  }) => {
    const earlier = page.getByRole("button", { name: "Earlier stories" });
    const more = page.getByRole("button", { name: "More stories" });
    await expect(earlier).toBeDisabled();
    const start = await slidesInReach(page);

    await press(more, isMobile);
    await expect(earlier).toBeEnabled();
    await expect.poll(() => slidesInReach(page)).not.toBe(start);
    await expect.poll(async () => (await slidesInReach(page))[0]).toBe("x");

    // To the end, however many presses that is at this width.
    for (let pressed = 0; pressed < 4; pressed += 1) {
      if (await more.isDisabled()) break;
      await press(more, isMobile);
    }
    await expect(more).toBeDisabled();
    await expect.poll(async () => (await slidesInReach(page))[4]).toBe("o");
  });

  test("customer stories: the cards in a row are the same height", async ({
    page,
  }) => {
    const heights = await page
      .locator(".case-studies__card")
      .evaluateAll((cards) =>
        cards.map((card) => Math.round(card.getBoundingClientRect().height)),
      );

    expect(new Set(heights).size).toBe(1);
  });
});

test.describe("shipping label", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/shipping-label");
  });

  test("shipping label: the tracking number is a barcode named for what it is, with the number under it", async ({
    page,
  }) => {
    const barcode = page.getByRole("img", {
      name: "Tracking number NV7781204563",
    });

    await expect(barcode).toBeVisible();
    await expect(barcode).toHaveAttribute("data-type", "code128");
    await expect(barcode.locator(".nuv-barcode__text")).toHaveText(
      "NV7781204563",
    );
    await expect(page.locator("[data-invalid]")).toHaveCount(0);
  });

  test("shipping label: the codes are black on white in the dark as well", async ({
    page,
  }) => {
    for (const selector of [".nuv-barcode__bars", ".nuv-qrcode__squares"]) {
      expect(
        await page
          .locator(selector)
          .evaluate((element) => getComputedStyle(element).fill),
      ).toBe("rgb(0, 0, 0)");
    }
    await page.emulateMedia({ colorScheme: "dark" });
    await settleStyles(page);
    for (const selector of [".nuv-barcode__ground", ".nuv-qrcode__ground"]) {
      expect(
        await page
          .locator(selector)
          .first()
          .evaluate((element) => getComputedStyle(element).fill),
      ).toBe("rgb(255, 255, 255)");
    }
  });

  test("shipping label: the QR code opens the tracking page, and so does a link beside it", async ({
    page,
  }) => {
    await expect(
      page.getByRole("img", { name: "Tracking page for this parcel" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Track this parcel" }),
    ).toHaveAttribute("href", "https://example.com/track/NV7781204563");
  });

  test("shipping label: the barcode is saved as a file, and the page says so", async ({
    page,
    isMobile,
  }) => {
    const said = page.locator(".shipping-label__said");
    await expect(said).toHaveText("");

    const svg = page.waitForEvent("download");
    await press(
      page.getByRole("button", { name: "Save barcode as SVG" }),
      isMobile,
    );
    expect((await svg).suggestedFilename()).toBe("parcel-7781.svg");
    await expect(said).toHaveText("Saved the barcode as parcel-7781.svg.");

    const png = page.waitForEvent("download");
    await press(
      page.getByRole("button", { name: "Save barcode as PNG" }),
      isMobile,
    );
    expect((await png).suggestedFilename()).toBe("parcel-7781.png");
    await expect(said).toHaveText("Saved the barcode as parcel-7781.png.");
  });

  test("shipping label: the barcode fits the label, however narrow the screen", async ({
    page,
  }) => {
    const label = await page.locator(".shipping-label__label").boundingBox();
    const barcode = await page.locator(".nuv-barcode").boundingBox();

    expect(barcode?.x ?? 0).toBeGreaterThanOrEqual(label?.x ?? 0);
    expect((barcode?.x ?? 0) + (barcode?.width ?? 0)).toBeLessThanOrEqual(
      (label?.x ?? 0) + (label?.width ?? 0),
    );
  });
});

test.describe("event ticket", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/event-ticket");
  });

  test("event ticket: the card is named by the event, and says when, where and which seat", async ({
    page,
  }) => {
    const card = page.getByRole("article", { name: "Northwind Summit 2026" });

    await expect(card).toBeVisible();
    await expect(card.getByText("Ada Lovelace")).toBeVisible();
    for (const [name, value] of [
      ["Date", "Thursday 12 November 2026"],
      ["Doors", "08:30"],
      ["Venue", "Harbour Hall, Bristol"],
      ["Seat", "Row F, seat 14"],
    ]) {
      await expect(
        card.getByRole("term").filter({ hasText: name }),
      ).toBeVisible();
      await expect(card.getByText(value ?? "", { exact: true })).toBeVisible();
    }
  });

  test("event ticket: the QR code is square, named for what it's for, and came from the server whole", async ({
    page,
  }) => {
    const code = page.getByRole("img", {
      name: "Ticket NS26-8841-KQ, to scan at the door",
    });

    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute("data-error-correction", "Q");
    await expect(code.locator(".nuv-qrcode__squares")).toHaveAttribute(
      "d",
      /^M4 4h7v1h-7z/,
    );
    const box = await code.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(Math.round(box?.height ?? 1));
  });

  test("event ticket: the code is written under it, and a link opens the same ticket", async ({
    page,
  }) => {
    await expect(page.locator(".event-ticket__code")).toHaveText(
      "NS26-8841-KQ",
    );
    await expect(
      page.getByRole("link", { name: "Open the ticket" }),
    ).toHaveAttribute("href", "https://example.com/t/NS26-8841-KQ");
  });

  test("event ticket: the stub is beside the details on a wide screen and under them on a phone", async ({
    page,
  }) => {
    const details = await page.locator(".event-ticket__details").boundingBox();
    const stub = await page.locator(".event-ticket__stub").boundingBox();
    const wide = (page.viewportSize()?.width ?? 0) >= 768;

    if (wide) {
      expect(stub?.x ?? 0).toBeGreaterThanOrEqual(
        (details?.x ?? 0) + (details?.width ?? 0) - 1,
      );
    } else {
      expect(stub?.y ?? 0).toBeGreaterThanOrEqual(
        (details?.y ?? 0) + (details?.height ?? 0) - 1,
      );
    }
  });
});

test.describe("assistant chat", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/assistant-chat");
  });

  const log = (page: Page) =>
    page.getByRole("log", { name: "Conversation with the billing assistant" });
  const field = (page: Page) =>
    page.getByRole("textbox", { name: "Message to the billing assistant" });
  const sendButton = (page: Page) => page.getByRole("button", { name: "Send" });
  // How far the end of the messages is below what's in view.
  const gapOf = (page: Page) =>
    log(page).evaluate((box) =>
      Math.round(box.scrollHeight - box.scrollTop - box.clientHeight),
    );
  const answers = (page: Page) =>
    log(page).locator('.nuv-message[data-from="assistant"]');

  test("assistant chat: it fills the screen and no more, with the box to write in at the bottom", async ({
    page,
  }) => {
    const size = page.viewportSize();
    const box = await page.locator(".nuv-prompt-input").boundingBox();

    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual((size?.height ?? 0) + 1);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      size?.height ?? 0,
    );
    await expect(sendButton(page)).toHaveAttribute("aria-disabled", "true");
  });

  test("assistant chat: a suggestion starts the conversation, and the reply arrives busy and ends whole", async ({
    page,
    isMobile,
  }) => {
    await expect(
      page.getByText("Ask about invoices, customers and what's overdue."),
    ).toBeVisible();

    await press(
      page.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );

    await expect(page.locator(".nuv-conversation__empty")).toHaveCount(0);
    await expect(
      log(page).locator('.nuv-message[data-from="user"]'),
    ).toHaveText("You: Who hasn't paid yet?");
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(answers(page)).toHaveCount(1);
    await expect(answers(page)).toContainText(
      "Everyone else has paid, or isn't due yet.",
    );
  });

  test("assistant chat: a question that's typed is answered by what it asks about, and the end stays in view", async ({
    page,
    isMobile,
  }) => {
    for (const question of [
      "Summarize September",
      "Draft a reminder please",
      "Who hasn't paid?",
    ]) {
      await field(page).fill(question);
      await press(sendButton(page), isMobile);
      await expect(field(page)).toHaveValue("");
      await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });
    }

    await expect(answers(page)).toHaveCount(3);
    await expect(answers(page).nth(0)).toContainText("38 invoices");
    // Line breaks in an answer are kept.
    await expect(answers(page).nth(1)).toContainText("Kind regards,");
    // The box follows a frame after its messages change.
    await expect.poll(() => gapOf(page)).toBe(0);
  });

  test("assistant chat: stopping keeps what had arrived, and trying again asks the same again", async ({
    page,
    isMobile,
  }) => {
    await field(page).fill("Summarize September");
    await press(sendButton(page), isMobile);
    await expect(
      log(page).locator('[aria-busy="true"] .nuv-message__content'),
    ).toContainText("In September");
    await press(page.getByRole("button", { name: "Stop" }), isMobile);

    await expect(sendButton(page)).toBeVisible();
    await expect(answers(page)).toHaveCount(1);
    await expect(answers(page)).not.toContainText("Team plan.");

    await press(page.getByRole("button", { name: "Try again" }), isMobile);
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });

    await expect(log(page).locator(".nuv-message")).toHaveCount(2);
    await expect(answers(page)).toContainText("Team plan.");
  });

  test("assistant chat: each answer has a group of actions, and a question has none", async ({
    page,
    isMobile,
  }) => {
    await press(
      page.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );
    await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });
    const group = answers(page).getByRole("group", { name: "Message actions" });

    await expect(group.getByRole("button", { name: "Copy" })).toBeVisible();
    await expect(
      group.getByRole("button", { name: "Try again" }),
    ).toBeVisible();
    await expect(
      log(page).locator('.nuv-message[data-from="user"]').getByRole("button"),
    ).toHaveCount(0);
  });

  test("assistant chat: the box to write in is as wide as the messages, and the note under it is there", async ({
    page,
    isMobile,
  }) => {
    await press(
      page.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );
    await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });
    const message = await log(page)
      .locator(".nuv-message")
      .first()
      .boundingBox();
    const box = await page.locator(".nuv-prompt-input").boundingBox();

    expect(Math.round(box?.x ?? 0)).toBe(Math.round(message?.x ?? -1));
    expect(Math.round(box?.width ?? 0)).toBe(Math.round(message?.width ?? -1));
    await expect(
      page.getByText("Answers are written by a model and can be wrong."),
    ).toBeVisible();
  });
});

test.describe("assistant beside a record", () => {
  const panel = (page: Page) =>
    page.getByRole("complementary", { name: "Assistant" });
  const toggle = (page: Page) =>
    page.getByRole("button", { name: "Ask the assistant" });
  const record = (page: Page) =>
    page.getByRole("heading", { level: 1, name: "Invoice INV-1042" });
  const log = (page: Page) =>
    page.getByRole("log", { name: "Conversation about INV-1042" });
  const field = (page: Page) =>
    page.getByRole("textbox", { name: "Question about INV-1042" });
  const sendButton = (page: Page) => page.getByRole("button", { name: "Send" });
  const answers = (page: Page) =>
    log(page).locator('.nuv-message[data-from="assistant"]');
  // Open on a wide screen to begin with, and closed on a narrow one.
  const openPanel = async (page: Page, isMobile: boolean) => {
    if ((await toggle(page).getAttribute("aria-expanded")) === "false") {
      await press(toggle(page), isMobile);
    }
    await expect(panel(page)).toBeVisible();
  };

  test("assistant beside a record: on a wide screen it's open, beside the record, and closing gives the record the room", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/blocks/view/assistant-sidebar");

    await expect(panel(page)).toBeVisible();
    await expect(record(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
    const main = await page.getByRole("main").boundingBox();
    const beside = await panel(page).boundingBox();
    expect(Math.round(beside?.x ?? 0)).toBe(
      Math.round((main?.x ?? 0) + (main?.width ?? 0)),
    );
    expect(Math.round((beside?.x ?? 0) + (beside?.width ?? 0))).toBe(1280);

    await page.getByRole("button", { name: "Close the assistant" }).click();
    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page)).toBeFocused();
    expect(
      Math.round((await page.getByRole("main").boundingBox())?.width ?? 0),
    ).toBe(1280);

    // Opened from the button, which is still there, so focus isn't moved
    // into the panel. Whether it's on the button is the browser's: Safari
    // doesn't focus a button that's pressed.
    await toggle(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Assistant" }),
    ).not.toBeFocused();
  });

  test("assistant beside a record: on a narrow screen it's closed, takes the record's place when opened, and gives it back", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize(phone);
    await open(page, "/blocks/view/assistant-sidebar");

    await expect(record(page)).toBeVisible();
    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");

    await press(toggle(page), isMobile);
    await expect(panel(page)).toBeVisible();
    await expect(record(page)).toBeHidden();
    await expect(
      page.getByRole("heading", { level: 2, name: "Assistant" }),
    ).toBeFocused();
    const box = await panel(page).boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(phone.width);
    expect(await overflow(page)).toBe(0);

    await press(
      page.getByRole("button", { name: "Close the assistant" }),
      isMobile,
    );
    await expect(record(page)).toBeVisible();
    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
  });

  test("assistant beside a record: a suggestion is answered about the invoice, with copy under the answer", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-sidebar");
    await openPanel(page, isMobile);

    await press(
      page.getByRole("button", { name: "Summarize this invoice" }),
      isMobile,
    );
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });

    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(answers(page)).toHaveCount(1);
    await expect(answers(page)).toContainText("40 seats on the Team plan");
    await expect(
      answers(page)
        .getByRole("group", { name: "Message actions" })
        .getByRole("button", { name: "Copy" }),
    ).toBeVisible();
  });

  test("assistant beside a record: stopping keeps what had arrived", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-sidebar");
    await openPanel(page, isMobile);

    await field(page).fill("Why is it overdue?");
    await press(sendButton(page), isMobile);
    await expect(
      log(page).locator('[aria-busy="true"] .nuv-message__content'),
    ).toContainText("It was due");
    await press(page.getByRole("button", { name: "Stop" }), isMobile);

    await expect(sendButton(page)).toBeVisible();
    await expect(answers(page)).toHaveCount(1);
    await expect(answers(page)).not.toContainText("out of character.");
    // The press that stopped it sent nothing.
    await expect(log(page).locator(".nuv-message")).toHaveCount(2);
  });

  test("assistant beside a record: closed and opened again, the conversation is still there, at its end", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-sidebar");
    await openPanel(page, isMobile);
    for (const question of ["Draft a second reminder", "Summarize it"]) {
      await field(page).fill(question);
      await press(sendButton(page), isMobile);
      await expect(sendButton(page)).toBeVisible({ timeout: 15_000 });
    }

    await press(
      page.getByRole("button", { name: "Close the assistant" }),
      isMobile,
    );
    await expect(panel(page)).toBeHidden();
    await press(toggle(page), isMobile);

    await expect(answers(page)).toHaveCount(2);
    await expect(answers(page).nth(0)).toContainText("Kind regards,");
    // The box follows a frame after its messages change.
    await expect
      .poll(() =>
        log(page).evaluate((box) =>
          Math.round(box.scrollHeight - box.scrollTop - box.clientHeight),
        ),
      )
      .toBe(0);
  });
});

test.describe("support chat", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/support-chat");
  });

  const launcher = (page: Page) =>
    page.getByRole("button", { name: "Chat with us" });
  const dialog = (page: Page) =>
    page.getByRole("dialog", { name: "Chat with support" });
  const log = (page: Page) =>
    page.getByRole("log", { name: "Conversation with support" });
  const field = (page: Page) =>
    page.getByRole("textbox", { name: "Message to support" });
  const sendButton = (page: Page) => page.getByRole("button", { name: "Send" });
  const from = (page: Page, who: "user" | "assistant") =>
    log(page).locator(`.nuv-message[data-from="${who}"]`);

  test("support chat: the button opens a dialog with a greeting, and Escape closes it", async ({
    page,
    isMobile,
  }) => {
    await expect(dialog(page)).toHaveCount(0);
    await expect(launcher(page)).toHaveAttribute("aria-expanded", "false");

    await press(launcher(page), isMobile);
    await expect(dialog(page)).toBeVisible();
    await expect(launcher(page)).toHaveAttribute("aria-expanded", "true");
    await expect(from(page, "assistant")).toHaveCount(1);
    await expect(from(page, "assistant")).toContainText("Support: Hello.");
    await expect(sendButton(page)).toHaveAttribute("aria-disabled", "true");

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    if (!isMobile) await expect(launcher(page)).toBeFocused();
  });

  test("support chat: with a mouse it opens with the field ready to type in", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a touch screen that would bring the keyboard up.");
    await launcher(page).click();
    await expect(field(page)).toBeFocused();
  });

  test("support chat: the panel is on the screen, whole, at a phone's width and a small one", async ({
    page,
    isMobile,
  }) => {
    for (const size of [phone, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      await press(launcher(page), isMobile);
      const box = await dialog(page).boundingBox();

      expect(box?.x ?? -1, `at ${size.width}`).toBeGreaterThanOrEqual(0);
      expect(box?.y ?? -1, `at ${size.width}`).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(size.width);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        size.height,
      );
      await expect(field(page)).toBeVisible();
      expect(await overflow(page), `at ${size.width}`).toBe(0);
      await press(
        page.getByRole("button", { name: "Close the chat" }),
        isMobile,
      );
      await expect(dialog(page)).toHaveCount(0);
    }
  });

  test("support chat: a reply that's chosen is sent and answered, and the replies to choose from go", async ({
    page,
    isMobile,
  }) => {
    await press(launcher(page), isMobile);
    await press(
      page.getByRole("button", { name: "Where is my order?" }),
      isMobile,
    );

    await expect(from(page, "user")).toHaveText("You: Where is my order?");
    await expect(page.locator(".nuv-prompt-suggestion")).toHaveCount(0);
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(from(page, "assistant").nth(1)).toContainText("NW-48213", {
      timeout: 10_000,
    });
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(0);
  });

  test("support chat: a question that's typed is answered by what it asks about", async ({
    page,
    isMobile,
  }) => {
    await press(launcher(page), isMobile);
    await field(page).fill("How long does a refund take?");
    await press(sendButton(page), isMobile);

    await expect(field(page)).toHaveValue("");
    await expect(from(page, "assistant").nth(1)).toContainText(
      "within five working days",
      { timeout: 10_000 },
    );
  });

  test("support chat: asking for a person hands the conversation over, and nothing answers after that", async ({
    page,
    isMobile,
  }) => {
    await press(launcher(page), isMobile);
    await press(
      page.getByRole("button", { name: "Talk to a person" }),
      isMobile,
    );

    await expect(
      log(page).getByText("Replies usually take about ten minutes."),
    ).toBeVisible({ timeout: 10_000 });
    await expect(dialog(page).locator(".support-chat__status")).toHaveText(
      "With the support team",
    );
    await expect(from(page, "assistant")).toHaveCount(2);

    await field(page).fill("Thank you");
    await press(sendButton(page), isMobile);
    await expect(from(page, "user")).toHaveCount(2);
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(sendButton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(from(page, "assistant")).toHaveCount(2);
  });

  test("support chat: closed and opened again, the conversation is still there", async ({
    page,
    isMobile,
  }) => {
    await press(launcher(page), isMobile);
    await field(page).fill("Can I change the address?");
    await press(sendButton(page), isMobile);
    await expect(from(page, "assistant").nth(1)).toContainText(
      "the carrier has to do it",
      { timeout: 10_000 },
    );

    await press(page.getByRole("button", { name: "Close the chat" }), isMobile);
    await expect(dialog(page)).toHaveCount(0);
    await press(launcher(page), isMobile);

    await expect(from(page, "user")).toHaveText(
      "You: Can I change the address?",
    );
    await expect(from(page, "assistant")).toHaveCount(2);
  });
});

test.describe("team messages", () => {
  const row = (page: Page, name: string) =>
    page
      .getByRole("region", { name: "Messages", exact: true })
      .getByRole("button", { name });
  const listHeading = (page: Page) =>
    page.getByRole("heading", { level: 1, name: "Messages" });
  const openHeading = (page: Page) => page.getByRole("heading", { level: 2 });
  const back = (page: Page) =>
    page.getByRole("button", { name: "Back to all messages" });
  const log = (page: Page, name: string) =>
    page.getByRole("log", { name: `Messages with ${name}` });
  const sendButton = (page: Page) => page.getByRole("button", { name: "Send" });
  // Where one of the two is shown, the way back to the list.
  const toList = async (page: Page, isMobile: boolean) => {
    if (await back(page).isVisible()) await press(back(page), isMobile);
  };

  test("team messages: on a wide screen the list and a conversation are side by side, and the open one is marked", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/blocks/view/team-chat");

    await expect(listHeading(page)).toBeVisible();
    await expect(openHeading(page)).toHaveText("Grace Hopper");
    await expect(back(page)).toBeHidden();
    await expect(row(page, "Grace Hopper")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(row(page, "Launch team")).not.toHaveAttribute("aria-current");

    await row(page, "Launch team").click();
    await expect(openHeading(page)).toHaveText("Launch team");
    await expect(row(page, "Launch team")).toHaveAttribute(
      "aria-current",
      "true",
    );
    // Both are still there, so focus isn't moved to the conversation.
    // Whether it's on the row is the browser's: Safari doesn't focus a
    // button that's pressed.
    await expect(openHeading(page)).not.toBeFocused();
    await expect(log(page, "Launch team")).toContainText(
      "Review is at two tomorrow.",
    );
  });

  test("team messages: on a narrow screen it's the list, then a conversation, and back", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize(phone);
    await open(page, "/blocks/view/team-chat");

    await expect(listHeading(page)).toBeVisible();
    await expect(openHeading(page)).toBeHidden();

    await press(row(page, "Katherine Johnson"), isMobile);
    await expect(listHeading(page)).toBeHidden();
    await expect(openHeading(page)).toHaveText("Katherine Johnson");
    await expect(openHeading(page)).toBeFocused();
    await expect(
      page.getByRole("textbox", { name: "Message to Katherine Johnson" }),
    ).toBeVisible();
    expect(await overflow(page)).toBe(0);

    await press(back(page), isMobile);
    await expect(listHeading(page)).toBeVisible();
    await expect(openHeading(page)).toBeHidden();
    await expect(row(page, "Katherine Johnson")).toBeFocused();
  });

  test("team messages: opening a conversation clears what was unread in it", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/team-chat");
    await expect(row(page, "Grace Hopper")).toContainText("2 new");

    await press(row(page, "Grace Hopper"), isMobile);
    await toList(page, isMobile);

    await expect(row(page, "Grace Hopper")).not.toContainText("new");
  });

  test("team messages: a message from someone else has their name over it, and one's own says You", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/team-chat");
    await press(row(page, "Launch team"), isMobile);
    const messages = log(page, "Launch team").locator(".nuv-message");

    await expect(messages).toHaveCount(4);
    await expect(messages.nth(1).locator(".nuv-message__meta")).toHaveText(
      "Ada Lovelace Yesterday",
    );
    // Said once: the name everyone sees is the one a screen reader reads.
    await expect(messages.nth(1).locator(".nuv-message__label")).toHaveCount(0);
    await expect(messages.nth(2)).toHaveAttribute("data-from", "user");
    await expect(messages.nth(2).locator(".nuv-message__label")).toHaveText(
      "You:",
    );
  });

  test("team messages: a message that's sent is at the end, empties the field, and is the row's last line", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/team-chat");
    await press(row(page, "Grace Hopper"), isMobile);
    const field = page.getByRole("textbox", {
      name: "Message to Grace Hopper",
    });

    await field.fill("On it. They'll have a reminder by noon.");
    await press(sendButton(page), isMobile);

    await expect(field).toHaveValue("");
    const last = log(page, "Grace Hopper").locator(".nuv-message").last();
    await expect(last).toHaveAttribute("data-from", "user");
    await expect(last).toContainText("On it. They'll have a reminder by noon.");
    await expect(last.locator(".nuv-message__meta")).toHaveText("Just now");
    // The box follows a frame after its messages change.
    await expect
      .poll(() =>
        log(page, "Grace Hopper").evaluate((box) =>
          Math.round(box.scrollHeight - box.scrollTop - box.clientHeight),
        ),
      )
      .toBe(0);

    await toList(page, isMobile);
    await expect(row(page, "Grace Hopper")).toContainText(
      "You: On it. They'll have a reminder by noon.",
    );
  });

  test("team messages: each conversation opens at its end, whatever the last one was scrolled to", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width: 390, height: 420 });
    await open(page, "/blocks/view/team-chat");
    await press(row(page, "Launch team"), isMobile);
    await log(page, "Launch team").evaluate((box) => box.scrollTo(0, 0));
    await toList(page, isMobile);

    await press(row(page, "Grace Hopper"), isMobile);
    // The box follows a frame after its messages change.
    await expect
      .poll(() =>
        log(page, "Grace Hopper").evaluate((box) =>
          Math.round(box.scrollHeight - box.scrollTop - box.clientHeight),
        ),
      )
      .toBe(0);
  });
});

test.describe("assistant workspace", () => {
  const log = (page: Page) =>
    page.getByRole("log", { name: "Conversation with the billing assistant" });
  const field = (page: Page) =>
    page.getByRole("textbox", { name: "Message to the billing assistant" });
  // By its class: with the sheet open, the page behind it is hidden from
  // roles.
  const heading = (page: Page) => page.locator(".assistant-workspace__title");
  const menu = (page: Page) =>
    page.getByRole("button", { name: "Show conversations" });
  const sheet = (page: Page) =>
    page.getByRole("dialog", { name: "Conversations" });
  // The list, wherever it is: beside the conversation, or in the sheet,
  // which this opens.
  const threads = async (page: Page, isMobile: boolean) => {
    if (await menu(page).isVisible()) {
      await press(menu(page), isMobile);
      await expect(sheet(page)).toBeVisible();
      return sheet(page);
    }
    return page.getByRole("complementary", { name: "Conversations" });
  };
  const gapOf = (page: Page) =>
    log(page).evaluate((box) =>
      Math.round(box.scrollHeight - box.scrollTop - box.clientHeight),
    );
  const calls = (page: Page) => log(page).locator(".nuv-tool-call__trigger");

  test("assistant workspace: on a wide screen the list is beside the conversation, which opens at its end", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/blocks/view/assistant-workspace");
    const side = page.getByRole("complementary", { name: "Conversations" });

    await expect(side).toBeVisible();
    await expect(menu(page)).toBeHidden();
    await expect(heading(page)).toHaveText("Overdue invoices for Contoso");
    await expect(side.getByRole("row")).toHaveCount(3);
    await expect(side.locator('[aria-selected="true"]')).toHaveText(
      "Overdue invoices for Contoso",
    );
    await expect.poll(() => gapOf(page)).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight + 1,
      ),
    ).toBe(true);
  });

  test("assistant workspace: on a phone the list is in a sheet, and choosing a conversation closes it", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize(phone);
    await open(page, "/blocks/view/assistant-workspace");

    await expect(
      page.getByRole("complementary", { name: "Conversations" }),
    ).toBeHidden();
    const list = await threads(page, isMobile);
    await expect(list.getByRole("row")).toHaveCount(3);

    await press(
      list.getByRole("row", { name: /What our payment terms say/ }),
      isMobile,
    );

    await expect(sheet(page)).toBeHidden();
    await expect(heading(page)).toHaveText("What our payment terms say");
    await expect(log(page).locator(".nuv-message")).toHaveCount(2);
    expect(await overflow(page)).toBe(0);
  });

  test("assistant workspace: a reply's steps, tool call and sources each open", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");

    await expect(calls(page)).toHaveText([
      /Search invoices\s*Done/,
      /Send a reminder\s*Needs approval/,
    ]);
    await expect(
      log(page).locator(".nuv-sources").getByRole("link"),
    ).toHaveCount(0);

    await press(
      log(page).getByRole("button", { name: "Thought for 4 seconds" }),
      isMobile,
    );
    await expect(log(page).locator(".nuv-reasoning__step")).toHaveCount(2);

    await press(calls(page).first(), isMobile);
    await expect(
      log(page).getByRole("group", { name: "Result" }),
    ).toContainText("INV-1057");

    await press(log(page).getByRole("button", { name: "2 sources" }), isMobile);
    await expect(
      log(page).locator(".nuv-sources").getByRole("link"),
    ).toHaveCount(2);
    expect(await overflow(page)).toBe(0);
  });

  test("assistant workspace: a call that sends waits to be approved, then runs, and the answer follows", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    const approval = log(page).getByRole("group", { name: "Approval" });

    await expect(approval).toContainText(
      "Send a reminder for INV-1042 to Contoso?",
    );
    await press(approval.getByRole("button", { name: "Approve" }), isMobile);

    await expect(calls(page).last()).toHaveText(/Send a reminder\s*Running/);
    await expect(approval).toHaveCount(0);
    await expect(calls(page).last()).toHaveText(/Send a reminder\s*Done/);
    await expect(log(page).locator(".nuv-message").last()).toHaveText(
      "Assistant: The reminder is on its way to Contoso.",
    );
    // The box follows a frame after its messages change.
    await expect.poll(() => gapOf(page)).toBe(0);
  });

  test("assistant workspace: denying sends nothing and says so", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");

    await press(
      log(page)
        .getByRole("group", { name: "Approval" })
        .getByRole("button", { name: "Deny" }),
      isMobile,
    );

    await expect(calls(page).last()).toHaveText(/Send a reminder\s*Denied/);
    await expect(log(page).locator(".nuv-message").last()).toHaveText(
      "Assistant: I haven't sent anything.",
    );
  });

  test("assistant workspace: a new conversation starts empty, and its first question names it and puts it at the top of the list", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    let list = await threads(page, isMobile);
    await press(
      list.getByRole("button", { name: "New conversation" }),
      isMobile,
    );

    await expect(heading(page)).toHaveText("New conversation");
    await expect(
      log(page).getByRole("group", { name: "Suggestions" }).getByRole("button"),
    ).toHaveCount(3);

    await field(page).fill("What's due this week?");
    await press(
      page.getByRole("button", { name: "Send", exact: true }),
      isMobile,
    );

    await expect(heading(page)).toHaveText("What's due this week?");
    // The steps are open while it thinks, and closed when it has answered.
    const thinking = log(page).locator(".nuv-reasoning__trigger").last();
    await expect(thinking).toHaveAttribute("aria-expanded", "true");
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    await expect(thinking).toHaveText("Thought for 2 seconds", {
      timeout: 15_000,
    });
    await expect(thinking).toHaveAttribute("aria-expanded", "false");
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect.poll(() => gapOf(page)).toBe(0);

    list = await threads(page, isMobile);
    await expect(list.getByRole("row")).toHaveCount(4);
    await expect(list.getByRole("row").first()).toHaveText(
      "What's due this week?",
    );
    await expect(list.locator('[aria-selected="true"]')).toHaveText(
      "What's due this week?",
    );
  });

  test("assistant workspace: stopping ends the thinking and adds no answer", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    const before = await log(page).locator(".nuv-message").count();

    await field(page).fill("And the other one?");
    await press(
      page.getByRole("button", { name: "Send", exact: true }),
      isMobile,
    );
    await press(page.getByRole("button", { name: "Stop" }), isMobile);

    await expect(
      page.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible();
    await expect(log(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(log(page).locator(".nuv-message")).toHaveCount(before + 1);
  });

  test("assistant workspace: a file waits in the box, and is shown with the message it was sent with", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    await page
      .locator('.assistant-workspace__foot input[type="file"]')
      .setInputFiles([
        {
          name: "statement.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("pdf"),
        },
      ]);

    await expect(
      page.getByRole("list", { name: "Files to send" }).getByRole("listitem"),
    ).toHaveCount(1);
    expect(await overflow(page)).toBe(0);
    await field(page).fill("Is this right?");
    await press(
      page.getByRole("button", { name: "Send", exact: true }),
      isMobile,
    );

    await expect(page.getByRole("list", { name: "Files to send" })).toHaveCount(
      0,
    );
    await expect(
      log(page)
        .getByRole("list", { name: "Files with this message" })
        .locator(".nuv-attachment__name"),
    ).toHaveText(["statement.pdf"]);
  });

  test("assistant workspace: deleting the open conversation leaves a new one, with focus on the button that starts one", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    const list = await threads(page, isMobile);

    await press(
      list.getByRole("button", {
        name: "Delete Overdue invoices for Contoso",
      }),
      isMobile,
    );

    await expect(list.getByRole("row")).toHaveCount(2);
    await expect(
      list.getByRole("button", { name: "New conversation" }),
    ).toBeFocused();
    await expect(heading(page)).toHaveText("New conversation");
  });

  test("assistant workspace: with a keyboard the arrows move through the list and Enter opens a conversation", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no arrow keys");
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/blocks/view/assistant-workspace");
    const side = page.getByRole("complementary", { name: "Conversations" });

    await side.getByRole("row").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(heading(page)).toHaveText("Overdue invoices for Contoso");
    await page.keyboard.press("Enter");

    await expect(heading(page)).toHaveText("What our payment terms say");
    await expect(side.locator('[aria-selected="true"]')).toHaveText(
      "What our payment terms say",
    );
  });

  test("assistant workspace: it passes axe with a reply's parts open, and with the sheet open on a phone", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    await press(
      log(page).getByRole("button", { name: "Thought for 4 seconds" }),
      isMobile,
    );
    await press(calls(page).first(), isMobile);
    await press(log(page).getByRole("button", { name: "2 sources" }), isMobile);
    await expect(
      log(page).locator(".nuv-sources").getByRole("link"),
    ).toHaveCount(2);
    await settleStyles(page);
    expect(
      (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
    ).toEqual([]);

    await page.setViewportSize(phone);
    await press(menu(page), isMobile);
    await expect(sheet(page)).toBeVisible();
    await settleStyles(page);
    expect(
      (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
    ).toEqual([]);
  });
});

test.describe("assistant chat, files", () => {
  test("assistant chat: a file waits in the box, is sent with no text, and is shown with the message", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-chat");
    const log = page.getByRole("log", {
      name: "Conversation with the billing assistant",
    });

    await expect(
      page.getByRole("button", { name: "Attach files" }),
    ).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: "invoices.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("pdf"),
      },
    ]);
    await expect(
      page.getByRole("list", { name: "Files to send" }).getByRole("listitem"),
    ).toHaveCount(1);
    expect(await overflow(page)).toBe(0);

    await press(
      page.getByRole("button", { name: "Send", exact: true }),
      isMobile,
    );

    await expect(page.getByRole("list", { name: "Files to send" })).toHaveCount(
      0,
    );
    await expect(
      log
        .getByRole("list", { name: "Files with this message" })
        .locator(".nuv-attachment__name"),
    ).toHaveText(["invoices.pdf"]);
    // A message that's only a file has no bubble of text.
    await expect(
      log.locator('.nuv-message[data-from="user"] .nuv-message__content'),
    ).toHaveCount(0);
  });

  test("assistant chat: on a phone the button to attach and the choice of customers share a line with the button to send", async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    await open(page, "/blocks/view/assistant-chat");
    const attach = await page
      .getByRole("button", { name: "Attach files" })
      .boundingBox();
    const scope = await page
      .getByRole("combobox", { name: "Which customers to look at" })
      .boundingBox();
    const send = await page
      .getByRole("button", { name: "Send", exact: true })
      .boundingBox();
    const middle = (box: typeof attach) =>
      (box?.y ?? 0) + (box?.height ?? 0) / 2;

    expect(Math.abs(middle(attach) - middle(send))).toBeLessThanOrEqual(1);
    expect(Math.abs(middle(scope) - middle(send))).toBeLessThanOrEqual(1);
    expect((scope?.x ?? 0) + (scope?.width ?? 0)).toBeLessThanOrEqual(
      send?.x ?? 0,
    );
  });
});

test.describe("assistant blocks, markdown", () => {
  test("assistant chat: an answer's markdown is a table, with no marks left as text, while it arrives and after", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/blocks/view/assistant-chat");
    const log = page.getByRole("log", {
      name: "Conversation with the billing assistant",
    });

    await press(
      page.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );

    const answer = log.locator('.nuv-message[data-from="assistant"]').last();
    await expect(answer.getByRole("columnheader")).toHaveText(
      ["Invoice", "Customer", "Amount", "Days late"],
      { timeout: 15_000 },
    );
    await expect(
      page.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(answer.getByRole("row")).toHaveCount(3);
    await expect(answer.getByRole("group", { name: "Table" })).toBeVisible();
    await expect(answer.locator(".nuv-markdown")).not.toContainText("|");
    expect(await overflow(page)).toBe(0);
  });

  test("assistant chat: on a phone a table scrolls in its own box, and the page doesn't", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "/blocks/view/assistant-chat");

    await press(
      page.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );
    await expect(
      page.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByRole("group", { name: "Table" })).toBeVisible();
    expect(await overflow(page)).toBe(0);
  });

  test("assistant chat: a list and bold are drawn, and the answer that's copied is the markdown it was written in", async ({
    page,
    isMobile,
    browserName,
  }) => {
    await open(page, "/blocks/view/assistant-chat");
    const log = page.getByRole("log", {
      name: "Conversation with the billing assistant",
    });

    await press(
      page.getByRole("button", { name: "Summarize last month's invoices" }),
      isMobile,
    );
    await expect(
      page.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });

    const answer = log.locator('.nuv-message[data-from="assistant"]').last();
    await expect(answer.locator("strong")).toHaveText([
      "38 invoices",
      "96,400",
    ]);
    await expect(answer.locator("ul > li")).toHaveText([
      "33 are paid",
      "3 are due this week",
      "2 are overdue",
    ]);
    if (browserName === "chromium") {
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
      await press(answer.getByRole("button", { name: "Copy" }), isMobile);
      await expect(
        answer.getByRole("button", { name: "Copied" }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => navigator.clipboard.readText()),
      ).toContain("**38 invoices**");
    }
  });

  test("assistant workspace: a saved answer's table is drawn, beside its tool call and sources", async ({
    page,
  }) => {
    await open(page, "/blocks/view/assistant-workspace");
    const log = page.getByRole("log", {
      name: "Conversation with the billing assistant",
    });
    const answer = log.locator('.nuv-message[data-from="assistant"]').first();

    await expect(answer.getByRole("columnheader")).toHaveText([
      "Invoice",
      "Amount",
      "Days late",
    ]);
    await expect(answer.getByRole("cell", { name: "INV-1057" })).toBeVisible();
    await expect(answer.locator(".nuv-tool-call")).toHaveCount(1);
    await expect(
      answer.getByRole("button", { name: "2 sources" }),
    ).toBeVisible();
    // An address written out in a reply is a link to write to it.
    await expect(
      log.getByRole("link", { name: "billing@northwind.example" }),
    ).toHaveAttribute("href", "mailto:billing@northwind.example");
    expect(await overflow(page)).toBe(0);
  });
});

// A key that does something to a card on a board, and then a wait until
// the board has said so. Every step of a move is said, so what's said
// changing is how a test knows the step is done, however busy the machine
// is. Then a moment more: the board starts to listen for the next key a
// tick after the one that picked the card up.
async function boardKey(page: Page, name: string) {
  const spoken = page.locator('.nuv-kanban [role="status"]');
  const before = (await spoken.textContent()) ?? "";
  await page.keyboard.press(name);
  await expect(spoken).not.toHaveText(before);
  await page.waitForTimeout(150);
}

test.describe("task board", () => {
  const stage = (page: Page, name: string) =>
    page.getByRole("group", { name, exact: true });
  const tasks = (page: Page, name: string) =>
    stage(page, name).locator("li[data-card]");
  const said = (page: Page) => page.locator(".task-board__said");
  // By the menu on a task, which is how a task is moved without dragging.
  async function send(page: Page, isMobile: boolean, task: string, to: string) {
    await press(
      page.getByRole("button", { name: `Move to: ${task}` }),
      isMobile,
    );
    await press(
      page.getByRole("menuitem", { name: to, exact: true }),
      isMobile,
    );
  }

  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/task-board");
  });

  test("task board: four columns of tasks, each with its count, and the review column with its limit", async ({
    page,
  }) => {
    await expect(
      page.getByRole("group", { name: "Launch plan" }),
    ).toBeVisible();
    await expect(tasks(page, "Backlog")).toHaveCount(3);
    await expect(tasks(page, "In progress")).toHaveCount(2);
    await expect(tasks(page, "In review")).toHaveCount(1);
    await expect(tasks(page, "Done")).toHaveCount(1);
    await expect(
      stage(page, "In review").locator(".nuv-kanban__count"),
    ).toHaveText("1 of 2");
    await expect(said(page)).toHaveText("");
  });

  test("task board: a task's menu moves it to another column, and the page says so", async ({
    page,
    isMobile,
  }) => {
    await send(page, isMobile, "Agree the pricing page", "Done");

    await expect(said(page)).toHaveText(
      '"Agree the pricing page" moved from Backlog to Done.',
    );
    await expect(tasks(page, "Backlog")).toHaveCount(2);
    await expect(tasks(page, "Done")).toHaveText([
      /Publish the setup guide/,
      /Agree the pricing page/,
    ]);
    // The menu doesn't offer the column the task is already in.
    await press(
      page.getByRole("button", { name: "Move to: Agree the pricing page" }),
      isMobile,
    );
    await expect(page.getByRole("menuitem")).toHaveText([
      "Backlog",
      "In progress",
      "In review",
    ]);
  });

  test("task board: the review column takes two, and a third stays where it was", async ({
    page,
    isMobile,
  }) => {
    await send(page, isMobile, "Write the launch emails", "In review");
    await expect(tasks(page, "In review")).toHaveCount(2);
    await expect(
      stage(page, "In review").locator(".nuv-kanban__count"),
    ).toHaveText("2 of 2");

    await send(page, isMobile, "Agree the pricing page", "In review");

    await expect(said(page)).toHaveText(
      'In review takes 2 tasks at a time. "Agree the pricing page" stays in Backlog.',
    );
    await expect(tasks(page, "In review")).toHaveCount(2);
    await expect(tasks(page, "Backlog")).toHaveCount(2);
  });

  test("task board: with the keyboard a task is picked up by its handle and taken to the next column", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    // The board waits a tick after a key before it listens for the next,
    // and measures the columns again after each move.
    const key = (name: string) => boardKey(page, name);

    await page
      .getByRole("button", { name: "Move Agree the pricing page", exact: true })
      .focus();
    await key("Space");
    await key("ArrowRight");
    await expect(
      tasks(page, "In progress").filter({ hasText: "Agree the pricing page" }),
    ).toHaveCount(1);
    await key("Space");

    await expect(said(page)).toHaveText(
      '"Agree the pricing page" moved from Backlog to In progress.',
    );
    await expect(tasks(page, "Backlog")).toHaveCount(2);
    await expect(tasks(page, "In progress")).toHaveCount(3);
  });

  test("task board: a task refused from the keyboard goes back to its column", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const key = (name: string) => boardKey(page, name);
    await send(page, isMobile, "Write the launch emails", "In review");
    await expect(tasks(page, "In review")).toHaveCount(2);

    await page
      .getByRole("button", {
        name: "Move Switch billing to the new plans",
        exact: true,
      })
      .focus();
    await key("Space");
    await key("ArrowRight");
    await key("Space");

    await expect(said(page)).toContainText(
      "In review takes 2 tasks at a time.",
    );
    await expect(tasks(page, "In progress")).toHaveCount(2);
    await expect(tasks(page, "In review")).toHaveCount(2);
  });

  test("task board: on a phone the board scrolls sideways, the page doesn't, and some of the next column shows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "/blocks/view/task-board");
    const board = page.locator(".nuv-kanban");

    expect(await overflow(page)).toBe(0);
    expect(
      await board.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
    ).toBeGreaterThan(0);
    const next = await stage(page, "In progress").boundingBox();
    expect(next?.x).toBeLessThan(320);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`task board: it passes axe in ${theme}, with a task's menu open as well`, async ({
      page,
      isMobile,
    }) => {
      await setTheme(page, theme);
      await open(page, "/blocks/view/task-board");
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);

      await press(
        page.getByRole("button", { name: "Move to: Agree the pricing page" }),
        isMobile,
      );
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      // The menu fades in, and its words are checked for contrast once
      // it has: halfway there they're paler than they'll be.
      await menu.evaluate((element) =>
        Promise.all(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished),
        ),
      );
      await settleStyles(page);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(wcag)
            // Radix hides the page behind an open menu from a screen
            // reader, and keeps Tab and the pointer in the menu. axe sees
            // buttons in what's hidden and can't know they can't be
            // reached. It makes this allowance for a dialog. The library's
            // own tests of the menu leave the rule out for the same reason.
            .disableRules(["aria-hidden-focus"])
            .analyze()
        ).violations,
      ).toEqual([]);
    });
  }
});

test.describe("deal pipeline", () => {
  const stage = (page: Page, name: string) =>
    page.getByRole("group", { name, exact: true });
  const deals = (page: Page, name: string) =>
    stage(page, name).locator("li[data-card]");
  const sum = (page: Page, name: string) =>
    stage(page, name).locator(".nuv-kanban__count");
  const total = (page: Page) => page.locator(".deal-pipeline__sum");
  const said = (page: Page) => page.locator(".deal-pipeline__said");
  const handle = (page: Page, company: string) =>
    page.getByRole("button", { name: `Move ${company}`, exact: true });

  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/deal-pipeline");
  });

  test("deal pipeline: each column adds up its deals, and the heading adds up what's open", async ({
    page,
  }) => {
    await expect(page.getByRole("group", { name: "Pipeline" })).toBeVisible();
    await expect(sum(page, "Lead")).toHaveText("$24,960");
    await expect(sum(page, "Qualified")).toHaveText("$76,000");
    await expect(sum(page, "Proposal")).toHaveText("$88,000");
    await expect(sum(page, "Won")).toHaveText("$52,000");
    await expect(total(page)).toHaveText("$188,960");
    await expect(said(page)).toHaveText("");
  });

  test("deal pipeline: the button adds a deal at the top of the first column, twice, and the sums follow", async ({
    page,
    isMobile,
  }) => {
    const add = page.getByRole("button", { name: "Add a deal" });

    await press(add, isMobile);
    await expect(said(page)).toHaveText("Litware was added to Lead.");
    await expect(deals(page, "Lead")).toHaveCount(3);
    await expect(deals(page, "Lead").first()).toContainText("Litware");
    await expect(sum(page, "Lead")).toHaveText("$28,800");
    await expect(total(page)).toHaveText("$192,800");

    await press(add, isMobile);
    await expect(deals(page, "Lead")).toHaveCount(4);
    await expect(add).toBeDisabled();
  });

  test("deal pipeline: a deal that's won can't be moved, and the others can", async ({
    page,
  }) => {
    await expect(handle(page, "Adatum")).toBeDisabled();
    await expect(handle(page, "Contoso")).toBeEnabled();
    await expect(
      deals(page, "Won").filter({ hasText: "Adatum" }),
    ).toHaveAttribute("data-disabled", "");
  });

  test("deal pipeline: a deal moved along with the keyboard takes its worth with it, and one that's won is locked", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    // The board waits a tick after a key before it listens for the next,
    // and measures the columns again after each move.
    const key = (name: string) => boardKey(page, name);

    await handle(page, "Contoso").focus();
    await key("Space");
    await key("ArrowRight");
    await key("Space");

    await expect(said(page)).toHaveText(
      "Contoso moved from Lead to Qualified.",
    );
    await expect(sum(page, "Lead")).toHaveText("$5,760");
    await expect(sum(page, "Qualified")).toHaveText("$95,200");
    await expect(total(page)).toHaveText("$188,960");

    await handle(page, "Tailspin Toys").focus();
    await key("Space");
    await key("ArrowRight");
    await key("Space");

    await expect(said(page)).toHaveText("Tailspin Toys is won, and locked.");
    await expect(sum(page, "Won")).toHaveText("$140,000");
    await expect(total(page)).toHaveText("$100,960");
    await expect(handle(page, "Tailspin Toys")).toBeDisabled();
    await expect(stage(page, "Proposal")).toContainText("No deals");
  });

  test("deal pipeline: on a phone the board scrolls sideways and the page doesn't", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "/blocks/view/deal-pipeline");
    const board = page.locator(".nuv-kanban");

    expect(await overflow(page)).toBe(0);
    expect(
      await board.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
    ).toBeGreaterThan(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`deal pipeline: it passes axe in ${theme}`, async ({ page }) => {
      await setTheme(page, theme);
      await open(page, "/blocks/view/deal-pipeline");
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);
    });
  }
});

// Everything in an editor selected: by its shortcut, and on a phone,
// which has no keys to hold down, by the selection a finger would make.
// That one starts inside the first block, so typing over it keeps the
// first block as what it was, a heading if it was one.
async function selectEverything(page: Page, editor: Locator) {
  const phone = await page.evaluate(() => /iPhone/.test(navigator.userAgent));
  if (phone) {
    await editor.selectText();
    return;
  }
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
}

// Everything in an editor taken away, down to an empty paragraph. The
// second press takes away the heading or the list the first one leaves
// an empty line of.
async function emptyOut(page: Page, editor: Locator) {
  await selectEverything(page, editor);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
}

test.describe("announcement editor", () => {
  const body = (page: Page) =>
    page.getByRole("textbox", { name: "Announcement", exact: true });
  const read = (page: Page) =>
    page.getByRole("textbox", { name: "The announcement as it will be read" });
  const said = (page: Page) => page.locator(".announcement-editor__said");
  const card = (page: Page) => page.locator(".announcement-editor__card");

  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/announcement-editor");
    // The editor is made once the page is in a browser, a moment after
    // the rest of it.
    await expect(body(page)).toHaveAttribute("contenteditable", "true");
  });

  test("announcement editor: the draft is in the form, and beside it as it will be read", async ({
    page,
  }) => {
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
      "Billing moves to the new plans on 1 November",
    );
    await expect(body(page).locator("li")).toHaveCount(2);
    await expect(card(page).getByRole("heading", { level: 3 })).toHaveText(
      "Billing moves to the new plans on 1 November",
    );
    await expect(read(page)).toHaveAttribute("contenteditable", "false");
    await expect(read(page).locator("strong")).toHaveText("1 November");
    await expect(read(page).locator("a")).toHaveAttribute(
      "href",
      "mailto:billing@example.com",
    );
    await expect(page.locator(".nuv-rich-text-editor__count")).toContainText(
      "of 600 characters",
    );
  });

  test("announcement editor: what's written is what's read, as it's written", async ({
    page,
  }) => {
    await selectEverything(page, body(page));
    await page.keyboard.type("Offices are closed on Friday.");

    await expect(read(page)).toHaveText("Offices are closed on Friday.");

    await page.getByRole("textbox", { name: "Title" }).fill("Closed on Friday");
    await expect(card(page).getByRole("heading", { level: 3 })).toHaveText(
      "Closed on Friday",
    );
  });

  test("announcement editor: publishing says what was published", async ({
    page,
    isMobile,
  }) => {
    await press(page.getByRole("button", { name: "Publish" }), isMobile);

    await expect(said(page)).toHaveText(
      'Published "Billing moves to the new plans on 1 November".',
    );
  });

  test("announcement editor: with nothing written, publishing says what's missing, and writing takes that away", async ({
    page,
    isMobile,
  }) => {
    await press(page.getByRole("button", { name: "Start again" }), isMobile);
    await expect(card(page)).toContainText("Nothing written yet.");
    await expect(card(page)).toContainText("No title yet");

    await press(page.getByRole("button", { name: "Publish" }), isMobile);

    await expect(
      page.getByText("Give the announcement a title."),
    ).toBeVisible();
    await expect(
      page.getByText("Write the announcement before you publish it."),
    ).toBeVisible();
    await expect(body(page)).toHaveAttribute("aria-invalid", "true");
    await expect(said(page)).toHaveText("");

    await body(page).click();
    await page.keyboard.type("Hello");
    await expect(
      page.getByText("Write the announcement before you publish it."),
    ).toHaveCount(0);
    await expect(body(page)).not.toHaveAttribute("aria-invalid", "true");
  });

  test("announcement editor: on a phone the form is over what it makes, and the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "/blocks/view/announcement-editor");
    await expect(body(page)).toHaveAttribute("contenteditable", "true");

    expect(await overflow(page)).toBeLessThanOrEqual(0);
    const form = await page.locator(".announcement-editor__form").boundingBox();
    const made = await page
      .locator(".announcement-editor__preview")
      .boundingBox();
    expect(made?.y).toBeGreaterThan((form?.y ?? 0) + (form?.height ?? 0) - 1);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`announcement editor: it passes axe in ${theme}, with the errors showing as well`, async ({
      page,
      isMobile,
    }) => {
      await setTheme(page, theme);
      await open(page, "/blocks/view/announcement-editor");
      await expect(body(page)).toHaveAttribute("contenteditable", "true");
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);

      await press(page.getByRole("button", { name: "Start again" }), isMobile);
      await press(page.getByRole("button", { name: "Publish" }), isMobile);
      await expect(
        page.getByText("Give the announcement a title."),
      ).toBeVisible();
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);
    });
  }
});

test.describe("document editor", () => {
  const body = (page: Page) =>
    page.getByRole("textbox", { name: "Page", exact: true });
  const title = (page: Page) => page.getByRole("textbox", { name: "Title" });
  const state = (page: Page) => page.locator(".document-editor__state");
  const entries = (page: Page) => page.locator(".document-editor__entry");
  const count = (page: Page) => page.locator(".document-editor__count");

  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/document-editor");
    // The editor is made once the page is in a browser, a moment after
    // the rest of it.
    await expect(body(page)).toHaveAttribute("contenteditable", "true");
  });

  test("document editor: the page is in the editor, with its headings and its words beside it", async ({
    page,
  }) => {
    await expect(title(page)).toHaveValue("How refunds work");
    await expect(body(page).locator("h2")).toHaveCount(2);
    await expect(entries(page)).toHaveText([
      "Who can ask",
      "How long it takes",
      "Card payments",
      "Bank transfers",
    ]);
    await expect(entries(page).nth(1)).toHaveAttribute("data-level", "2");
    await expect(entries(page).nth(2)).toHaveAttribute("data-level", "3");
    await expect(count(page)).toHaveText(/^\d+ words, about 1 min to read$/);
    await expect(state(page)).toHaveText("All changes saved");
  });

  test("document editor: a heading that's written joins the outline, and the words are counted", async ({
    page,
  }) => {
    await emptyOut(page, body(page));
    await page.keyboard.type("## Plans");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Two words");

    await expect(entries(page)).toHaveText(["Plans"]);
    await expect(count(page)).toHaveText("3 words, about 1 min to read");
    await expect(state(page)).toHaveText("Unsaved changes");
  });

  test("document editor: with no headings the outline says so", async ({
    page,
  }) => {
    await emptyOut(page, body(page));
    await page.keyboard.type("Gone");

    await expect(entries(page)).toHaveCount(0);
    await expect(
      page.getByText("Headings you write are listed here."),
    ).toBeVisible();
    await expect(count(page)).toHaveText("1 word, about 1 min to read");
  });

  test("document editor: saving keeps the changes, and discarding puts back what was saved", async ({
    page,
    isMobile,
  }) => {
    await title(page).fill("Refunds");
    await expect(state(page)).toHaveText("Unsaved changes");

    await press(page.getByRole("button", { name: "Save" }), isMobile);
    await expect(state(page)).toHaveText("All changes saved");

    await title(page).fill("Something else");
    await emptyOut(page, body(page));
    await page.keyboard.type("Gone");
    await expect(entries(page)).toHaveCount(0);
    await expect(state(page)).toHaveText("Unsaved changes");

    await press(
      page.getByRole("button", { name: "Discard changes" }),
      isMobile,
    );
    await expect(title(page)).toHaveValue("Refunds");
    await expect(entries(page)).toHaveCount(4);
    await expect(body(page).locator("h2").first()).toHaveText("Who can ask");
    await expect(state(page)).toHaveText("All changes saved");
  });

  test("document editor: on a phone the outline is under the page, and the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "/blocks/view/document-editor");
    await expect(body(page)).toHaveAttribute("contenteditable", "true");

    expect(await overflow(page)).toBeLessThanOrEqual(0);
    const written = await page.locator(".document-editor__page").boundingBox();
    const beside = await page.locator(".document-editor__aside").boundingBox();
    expect(beside?.y).toBeGreaterThan(
      (written?.y ?? 0) + (written?.height ?? 0) - 1,
    );
  });

  for (const theme of ["light", "dark"] as const) {
    test(`document editor: it passes axe in ${theme}`, async ({ page }) => {
      await setTheme(page, theme);
      await open(page, "/blocks/view/document-editor");
      await expect(body(page)).toHaveAttribute("contenteditable", "true");
      await expect(entries(page)).toHaveCount(4);
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);
    });
  }
});

test.describe("comment thread", () => {
  const draft = (page: Page) =>
    page.getByRole("textbox", { name: "Add a comment", exact: true });
  const comments = (page: Page) => page.locator(".comment-thread__comment");
  const said = (page: Page) => page.locator(".comment-thread__said");
  const tools = (page: Page) =>
    page.getByRole("toolbar", { name: "Formatting" });

  test.beforeEach(async ({ page }) => {
    await open(page, "/blocks/view/comment-thread");
    // The editor is made once the page is in a browser, a moment after
    // the rest of it.
    await expect(draft(page)).toHaveAttribute("contenteditable", "true");
  });

  test("comment thread: the comments are there to read, each by who wrote it", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Comments (2)" }),
    ).toBeVisible();
    await expect(comments(page)).toHaveCount(2);
    await expect(comments(page).first()).toContainText("Priya Nair");
    await expect(comments(page).first().locator("li")).toHaveCount(2);

    const second = comments(page).nth(1).getByRole("textbox");
    await expect(second).toHaveAttribute("contenteditable", "false");
    await expect(second).toHaveAttribute("aria-readonly", "true");
    await expect(second.locator("a")).toHaveAttribute(
      "href",
      "https://example.com/finance/invoices",
    );
  });

  test("comment thread: the toolbar has only what a comment needs", async ({
    page,
  }) => {
    await expect(tools(page).getByRole("button")).toHaveCount(6);
    await expect(
      tools(page).getByRole("button", { name: /Heading/ }),
    ).toHaveCount(0);
    await expect(
      tools(page).getByRole("button", { name: "Bold", exact: true }),
    ).toBeVisible();
    await expect(
      tools(page).getByRole("button", { name: "Link", exact: true }),
    ).toBeVisible();
  });

  test("comment thread: a comment that's posted joins the list as it was written, and the editor is empty again", async ({
    page,
    isMobile,
  }) => {
    await draft(page).click();
    await page.keyboard.type("Split it today");
    await selectEverything(page, draft(page));
    await press(
      tools(page).getByRole("button", { name: "Bold", exact: true }),
      isMobile,
    );
    await expect(draft(page).locator("strong")).toHaveText("Split it today");

    await press(
      page.getByRole("button", { name: "Comment", exact: true }),
      isMobile,
    );

    await expect(comments(page)).toHaveCount(3);
    await expect(
      page.getByRole("heading", { name: "Comments (3)" }),
    ).toBeVisible();
    await expect(comments(page).nth(2)).toContainText("Dana Whitfield");
    await expect(comments(page).nth(2).locator("strong")).toHaveText(
      "Split it today",
    );
    await expect(draft(page)).toHaveText("");
    await expect(said(page)).toHaveText("Comment posted.");
  });

  test("comment thread: posting nothing says what's missing, and writing takes that away", async ({
    page,
    isMobile,
  }) => {
    await press(
      page.getByRole("button", { name: "Comment", exact: true }),
      isMobile,
    );

    await expect(
      page.getByText("Write a comment before you post it."),
    ).toBeVisible();
    await expect(draft(page)).toHaveAttribute("aria-invalid", "true");
    await expect(comments(page)).toHaveCount(2);

    await draft(page).click();
    await page.keyboard.type("Hello");
    await expect(
      page.getByText("Write a comment before you post it."),
    ).toHaveCount(0);
    await expect(draft(page)).not.toHaveAttribute("aria-invalid", "true");
  });

  test("comment thread: on a phone the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "/blocks/view/comment-thread");
    await expect(draft(page)).toHaveAttribute("contenteditable", "true");

    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`comment thread: it passes axe in ${theme}, with the error showing as well`, async ({
      page,
      isMobile,
    }) => {
      await setTheme(page, theme);
      await open(page, "/blocks/view/comment-thread");
      await expect(draft(page)).toHaveAttribute("contenteditable", "true");
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);

      await press(
        page.getByRole("button", { name: "Comment", exact: true }),
        isMobile,
      );
      await expect(
        page.getByText("Write a comment before you post it."),
      ).toBeVisible();
      await settleStyles(page);
      expect(
        (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
      ).toEqual([]);
    });
  }
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
      // Each block has its files read and its preview opened again, so the
      // time this takes grows with the category. Ten seconds a block is
      // several times what one takes on a quiet machine.
      test.setTimeout(30_000 + inCategory.length * 10_000);
      await open(page, categoryPath(category));

      for (const block of inCategory) {
        const card = page.locator(`[data-block="${block.name}"]`);
        await card.scrollIntoViewIfNeeded();
        await press(card.getByRole("tab", { name: "Code" }), isMobile);
        await expect(card.locator(".site-block__command")).toHaveText([
          `pnpm add ${block.install.join(" ")}`,
          new RegExp(
            `^pnpm dlx shadcn@latest add https://\\S+/r/${block.name}\\.json$`,
          ),
        ]);

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
