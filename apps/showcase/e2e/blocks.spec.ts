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
