import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press, sameColor } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

const width = async (locator: Locator) =>
  Math.round((await locator.boundingBox())?.width ?? -1);

function style(locator: Locator, property: string) {
  return locator.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name).trim(),
    property,
  );
}

// The width changes over a quarter of a second.
async function settled(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) =>
        element.getAnimations().every((item) => item.playState !== "running"),
      ),
    )
    .toBe(true);
}

const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("sidebar page, on a wide screen", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, "On a phone the sidebar is a panel. See below.");
    await open(page, "/docs/components/sidebar");
  });

  test("the trigger collapses the sidebar to its icons, where a tooltip names each one", async ({
    page,
  }) => {
    const area = preview(page, "sidebar/basic");
    const bar = area.getByRole("navigation", { name: "Main" });
    const trigger = area.getByRole("button", { name: "Toggle sidebar" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(await width(bar)).toBe(256);

    await trigger.click();
    await settled(bar);

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await width(bar)).toBe(57);
    // Still there for a screen reader, with its count.
    const inbox = bar.getByRole("link", { name: "Inbox 12" });
    await expect(inbox).toHaveAttribute("aria-current", "page");

    await inbox.hover();
    const tip = page.getByRole("tooltip", { name: "Inbox" });
    await expect(tip).toBeVisible();
    const tipBox = await tip.boundingBox();
    const barBox = await bar.boundingBox();
    if (!tipBox || !barBox) throw new Error("nothing to measure");
    expect(tipBox.x).toBeGreaterThanOrEqual(barBox.x + barBox.width - 1);
  });

  test("an icon doesn't move when the sidebar collapses", async ({ page }) => {
    const area = preview(page, "sidebar/basic");
    const bar = area.getByRole("navigation", { name: "Main" });
    const icon = bar.getByRole("link", { name: "Reports" }).locator("svg");
    const before = await icon.boundingBox();

    await area.getByRole("button", { name: "Toggle sidebar" }).click();
    await settled(bar);

    expect(await icon.boundingBox()).toEqual(before);
  });

  test("the first sidebar is still collapsed after the page is loaded again", async ({
    page,
    context,
  }) => {
    const bar = preview(page, "sidebar/basic").getByRole("navigation", {
      name: "Main",
    });
    await preview(page, "sidebar/basic")
      .getByRole("button", { name: "Toggle sidebar" })
      .click();
    await settled(bar);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === "nuv-sidebar")?.value).toBe(
      "false",
    );

    await open(page, "/docs/components/sidebar");

    await expect.poll(() => width(bar)).toBe(57);
    // The others on the page store nothing, and are as they started.
    expect(
      await width(
        preview(page, "sidebar/submenu").getByRole("navigation", {
          name: "Reports menu",
        }),
      ),
    ).toBe(256);
  });

  test("Ctrl+B collapses the first sidebar and leaves the others alone", async ({
    page,
  }) => {
    const first = preview(page, "sidebar/basic").getByRole("navigation", {
      name: "Main",
    });
    const other = preview(page, "sidebar/submenu").getByRole("navigation", {
      name: "Reports menu",
    });

    await page.keyboard.press("Control+b");
    await settled(first);

    expect(await width(first)).toBe(57);
    expect(await width(other)).toBe(256);
  });

  test("a sidebar on the end side leaves the screen, and comes back", async ({
    page,
  }) => {
    const area = preview(page, "sidebar/end");
    const bar = area.locator(".nuv-sidebar");
    const trigger = area.getByRole("button", { name: "Toggle details" });
    const frame = await area.locator(".nuv-sidebar-layout").boundingBox();
    const box = await bar.boundingBox();
    if (!frame || !box) throw new Error("nothing to measure");
    // On the right, inside the example's own edge.
    expect(Math.round(box.x + box.width)).toBe(
      Math.round(frame.x + frame.width - 1),
    );

    await trigger.click();
    await settled(bar);
    await expect(bar).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(
      area.getByRole("navigation", { name: "Details" }),
    ).toBeVisible();
  });

  test("a submenu opens and closes under its item", async ({ page }) => {
    const area = preview(page, "sidebar/submenu");
    const reports = area.getByRole("button", { name: "Reports" });
    const revenue = area.getByRole("link", { name: "Revenue" });
    await expect(reports).toHaveAttribute("aria-expanded", "true");
    await expect(revenue).toHaveAttribute("aria-current", "page");

    await reports.click();
    await expect(revenue).toBeHidden();

    await reports.click();
    await expect(revenue).toBeVisible();
  });

  test("a submenu is out of the way on the strip of icons", async ({
    page,
  }) => {
    const area = preview(page, "sidebar/submenu");
    const bar = area.getByRole("navigation", { name: "Reports menu" });

    await area.getByRole("button", { name: "Toggle sidebar" }).click();
    await settled(bar);

    await expect(area.getByRole("link", { name: "Revenue" })).toBeHidden();
    await expect(area.getByRole("link", { name: "Invoices" })).toBeVisible();
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`the dark sidebar is dark and the brand one takes the primary color, with the page ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await open(page, "/docs/components/sidebar");
      const area = preview(page, "sidebar/themed");
      const dark = area.getByRole("navigation", { name: "Dark sidebar" });
      const brand = area.getByRole("navigation", { name: "Brand sidebar" });
      const probe = (color: string) =>
        page.evaluate((value) => {
          const element = document.createElement("span");
          element.style.color = value;
          document.body.append(element);
          const painted = getComputedStyle(element).color;
          element.remove();
          return painted;
        }, color);

      // Gray 900 is the dark theme's surface color.
      expect(
        await sameColor(
          page,
          await style(dark, "background-color"),
          await probe("var(--color-gray-900)"),
        ),
      ).toBe(true);
      expect(
        await sameColor(
          page,
          await style(brand, "background-color"),
          await probe("var(--color-primary)"),
        ),
      ).toBe(true);
      expect(
        await sameColor(
          page,
          await style(brand.getByRole("link", { name: "Logs" }), "color"),
          await probe("var(--color-primary-foreground)"),
        ),
      ).toBe(true);
    });
  }

  test("the page passes axe with every sidebar collapsed", async ({ page }) => {
    // A panel that is still fading in has colors it never has at rest.
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const name of ["sidebar/basic", "sidebar/submenu", "sidebar/end"]) {
      const area = preview(page, name);
      await area.locator(".nuv-sidebar__trigger").click();
      await settled(area.locator(".nuv-sidebar"));
    }

    const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the playground moves the sidebar and changes how it collapses", async ({
    page,
  }) => {
    const area = playground(page);
    const bar = area.locator(".nuv-sidebar");
    const trigger = area.getByRole("button", { name: "Toggle sidebar" });

    await area.getByLabel("side", { exact: true }).selectOption("end");
    await area.getByLabel("collapsible").selectOption("offcanvas");
    await expect(area.locator("pre")).toContainText(
      '<Sidebar side="end" collapsible="offcanvas">',
    );
    await expect(bar).toHaveClass(/nuv-sidebar--end/);

    await trigger.click();
    await settled(bar);
    await expect(bar).toBeHidden();

    await area.getByLabel("collapsible").selectOption("none");
    await expect(bar).toBeVisible();
    await trigger.click();
    await expect(bar).toBeVisible();

    await area.getByLabel("with tooltips").uncheck();
    await expect(area.locator("pre")).not.toContainText("tooltip=");
  });
});

test.describe("sidebar page, on a phone", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "On a wide screen the sidebar is in the page.");
    await open(page, "/docs/components/sidebar");
  });

  test("the sidebar isn't in the page, and the trigger opens it as a panel", async ({
    page,
  }) => {
    const area = preview(page, "sidebar/basic");
    await expect(area.locator(".nuv-sidebar")).toHaveCount(0);
    const trigger = area.getByRole("button", { name: "Toggle sidebar" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.tap();
    const panel = page.getByRole("dialog", { name: "Main" });
    await expect(panel).toBeVisible();
    await settled(panel);

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error("nothing to measure");
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(Math.round(box.height)).toBe(viewport.height);
    // A strip of the page is left to tap.
    expect(viewport.width - box.width).toBeGreaterThanOrEqual(48);
    await expect(panel.getByRole("link", { name: "Inbox 12" })).toBeVisible();
    await expect(panel.getByText("Workspace")).toBeVisible();
  });

  test("its close button closes it, and so does a tap on the page behind", async ({
    page,
  }) => {
    const trigger = preview(page, "sidebar/basic").getByRole("button", {
      name: "Toggle sidebar",
    });
    const panel = page.getByRole("dialog", { name: "Main" });

    await trigger.tap();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Close" }).tap();
    await expect(panel).toBeHidden();

    await trigger.tap();
    await expect(panel).toBeVisible();
    await settled(panel);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("nothing to measure");
    await page.touchscreen.tap(viewport.width - 10, viewport.height / 2);
    await expect(panel).toBeHidden();
  });

  test("rows in the panel are 44 pixels tall", async ({ page }) => {
    await preview(page, "sidebar/basic")
      .getByRole("button", { name: "Toggle sidebar" })
      .tap();
    const panel = page.getByRole("dialog", { name: "Main" });
    await expect(panel).toBeVisible();

    const row = await panel
      .getByRole("link", { name: "Reports" })
      .boundingBox();
    const close = await panel
      .getByRole("button", { name: "Close" })
      .boundingBox();
    // To a hundredth of a pixel. Safari on Linux has measured the button at
    // 44.00002 while the panel was still arriving.
    expect(row?.height).toBeCloseTo(44, 2);
    expect(close?.width).toBeCloseTo(44, 2);
    expect(close?.height).toBeCloseTo(44, 2);
  });

  test("a panel on the end side comes from the other edge", async ({
    page,
  }) => {
    await preview(page, "sidebar/end")
      .getByRole("button", { name: "Toggle details" })
      .tap();
    const panel = page.getByRole("dialog", { name: "Details" });
    await expect(panel).toBeVisible();
    await settled(panel);

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error("nothing to measure");
    expect(Math.round(box.x + box.width)).toBe(viewport.width);
  });

  test("the dark sidebar's panel is dark too", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/docs/components/sidebar");
    await preview(page, "sidebar/themed")
      .getByRole("button", { name: "Toggle the dark sidebar" })
      .tap();
    const panel = page.getByRole("dialog", { name: "Dark sidebar" });
    await expect(panel).toBeVisible();

    const dark = await page.evaluate(() => {
      const element = document.createElement("span");
      element.style.color = "var(--color-gray-900)";
      document.body.append(element);
      const painted = getComputedStyle(element).color;
      element.remove();
      return painted;
    });
    expect(
      await sameColor(page, await style(panel, "background-color"), dark),
    ).toBe(true);
  });

  for (const name of ["Main", "Dark sidebar", "Brand sidebar"]) {
    test(`the open panel of "${name}" passes axe`, async ({ page }) => {
      const triggers: Record<string, [string, string]> = {
        Main: ["sidebar/basic", "Toggle sidebar"],
        "Dark sidebar": ["sidebar/themed", "Toggle the dark sidebar"],
        "Brand sidebar": ["sidebar/themed", "Toggle the brand sidebar"],
      };
      const [example, label] = triggers[name] ?? ["", ""];
      // A panel that is still fading in has colors it never has at rest.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await preview(page, example).getByRole("button", { name: label }).tap();
      const panel = page.getByRole("dialog", { name });
      await expect(panel).toBeVisible();
      await settled(panel);

      const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("the page doesn't scroll sideways with a panel open", async ({
    page,
  }) => {
    await preview(page, "sidebar/basic")
      .getByRole("button", { name: "Toggle sidebar" })
      .tap();
    await expect(page.getByRole("dialog", { name: "Main" })).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the playground opens its sidebar as a panel", async ({ page }) => {
    const area = playground(page);
    await press(area.getByRole("button", { name: "Toggle sidebar" }), true);

    const panel = page.getByRole("dialog", { name: "Playground menu" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("button", { name: "Inbox" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
