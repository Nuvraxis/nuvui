import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The panel hangs under the menu in the page, so how far down it reaches
// depends on where the page is scrolled to. What it must never do is run
// off either side.
async function expectWithinWidth(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("nothing to measure");

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
}

test.describe("navigation menu page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/navigation-menu");
  });

  const menu = (page: Page, name: string) =>
    page
      .locator(`[data-preview="navigation-menu/${name}"]`)
      .getByRole("navigation");
  const panel = (page: Page) => page.locator(".nuv-navigation-menu__viewport");

  test("a panel's links aren't on the page until its button is pressed", async ({
    page,
    isMobile,
  }) => {
    const nav = menu(page, "basic");
    await expect(nav.getByRole("link", { name: /^Theming/ })).toHaveCount(0);

    await press(nav.getByRole("button", { name: "Guides" }), isMobile);

    await expect(nav.getByRole("link", { name: /^Theming/ })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Guides" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expectWithinWidth(page, panel(page));
  });

  test("resting the pointer on a button opens its panel, and the next button swaps it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "There's no hover on a touch screen.");
    const nav = menu(page, "basic");

    await nav.getByRole("button", { name: "Guides" }).hover();
    await expect(nav.getByRole("link", { name: /^Forms/ })).toBeVisible();

    await nav.getByRole("button", { name: "Components" }).hover();
    await expect(nav.getByRole("link", { name: "Dialog" })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Forms/ })).toHaveCount(0);
    await expect(panel(page)).toHaveCount(1);

    await page.mouse.move(5, 5);
    await expect(panel(page)).toHaveCount(0);
  });

  test("following a link in the panel goes to its page", async ({
    page,
    isMobile,
  }) => {
    const nav = menu(page, "basic");

    await press(nav.getByRole("button", { name: "Guides" }), isMobile);
    await press(nav.getByRole("link", { name: /^Theming/ }), isMobile);

    await expect(page).toHaveURL(/\/docs\/theming$/);
  });

  test("the keyboard opens a panel, goes into it and comes back out", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no keyboard to bring.");
    const nav = menu(page, "basic");
    const guides = nav.getByRole("button", { name: "Guides" });

    await guides.focus();
    await page.keyboard.press("Enter");
    await expect(nav.getByRole("link", { name: /^Theming/ })).toBeVisible();
    await expect(guides).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(nav.getByRole("link", { name: /^Theming/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(nav.getByRole("link", { name: /^Forms/ })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(panel(page)).toHaveCount(0);
    await expect(guides).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(nav.getByRole("button", { name: "Components" })).toBeFocused();
  });

  test("a press outside closes the panel", async ({ page, isMobile }) => {
    const nav = menu(page, "basic");
    await press(nav.getByRole("button", { name: "Guides" }), isMobile);
    await expect(panel(page)).toBeVisible();

    await press(page.getByRole("heading", { level: 1 }), isMobile);

    await expect(panel(page)).toHaveCount(0);
  });

  test("the link to the current page says so", async ({ page }) => {
    const nav = menu(page, "current");

    await expect(
      nav.getByRole("link", { name: "Navigation menu" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
  });

  test("on a desktop the panel takes its content's width and lines up with the menu's end", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a phone the panel is as wide as the menu.");
    const nav = menu(page, "router");
    await nav.scrollIntoViewIfNeeded();

    await nav.getByRole("button", { name: "More guides" }).click();
    await expect(nav.getByRole("link", { name: "Tailwind" })).toBeVisible();
    // Radix measures the content a frame after it shows.
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height ?? 0)
      .toBeGreaterThan(80);

    const box = await panel(page).boundingBox();
    const menuBox = await nav.boundingBox();
    if (!box || !menuBox) throw new Error("nothing to measure");
    // 12rem of content and a 1px border each side.
    expect(box.width).toBe(194);
    expect(
      Math.abs(box.x + box.width - (menuBox.x + menuBox.width)),
    ).toBeLessThanOrEqual(1);
    await expectWithinWidth(page, panel(page));
  });

  test("on a phone the panel is as wide as the menu, and stays on the screen", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "This is about narrow screens.");
    const nav = menu(page, "basic");

    await nav.getByRole("button", { name: "Guides" }).tap();
    await expect(nav.getByRole("link", { name: /^Theming/ })).toBeVisible();
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height ?? 0)
      .toBeGreaterThan(80);

    const box = await panel(page).boundingBox();
    const menuBox = await nav.boundingBox();
    if (!box || !menuBox) throw new Error("nothing to measure");
    expect(Math.round(box.width)).toBe(Math.round(menuBox.width));
    expect(
      (await nav.getByRole("button", { name: "Guides" }).boundingBox())?.height,
    ).toBe(44);
    await expectWithinWidth(page, panel(page));
  });

  test("a router's link gets the look, and changes page without a reload", async ({
    page,
    isMobile,
  }) => {
    const nav = menu(page, "router");
    const link = nav.getByRole("link", { name: "Getting started" });
    await expect(link).toHaveClass(/nuv-navigation-menu__link/);

    await page.evaluate(() => {
      (window as { stayed?: boolean }).stayed = true;
    });
    await press(link, isMobile);

    await expect(page).toHaveURL(/\/docs$/);
    expect(
      await page.evaluate(() => (window as { stayed?: boolean }).stayed),
    ).toBe(true);
  });

  // What the router asks for when it hasn't fetched the first page ahead.
  // A 404 here is a whole page load where a change of page was meant.
  test("the first page's data is at the address the router asks for", async ({
    request,
  }) => {
    const asked = await request.get("/docs.txt");
    expect(asked.status()).toBe(200);
    expect(asked.headers()["content-type"]).toContain("text/plain");
    expect(await asked.text()).toBe(
      await (await request.get("/docs/index.txt")).text(),
    );
  });

  test("the playground centers the panel under the menu", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "On a phone the panel is as wide as the menu.");
    const playground = page.locator("[data-playground]");
    const nav = playground.getByRole("navigation");

    await playground.getByLabel("align").selectOption("center");
    await nav.getByRole("button", { name: "Guides" }).click();
    await expect(nav.getByRole("link", { name: "Theming" })).toBeVisible();

    await expect(nav).toHaveClass(/nuv-navigation-menu--center/);
    const box = await panel(page).boundingBox();
    const menuBox = await nav.boundingBox();
    if (!box || !menuBox) throw new Error("nothing to measure");
    expect(
      Math.abs(box.x + box.width / 2 - (menuBox.x + menuBox.width / 2)),
    ).toBeLessThanOrEqual(1);
    await expect(playground.locator("pre")).toContainText(
      '<NavigationMenu align="center">',
    );
  });
});

test.describe("breadcrumb page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/breadcrumb");
  });

  const trail = (page: Page, name: string) =>
    page.locator(`[data-preview="breadcrumb/${name}"]`).getByRole("navigation");

  test("the trail is a named landmark that ends on the current page", async ({
    page,
  }) => {
    const nav = trail(page, "basic");

    await expect(nav).toHaveAccessibleName("Breadcrumb");
    await expect(nav.getByRole("listitem")).toHaveCount(3);
    await expect(nav.getByRole("link")).toHaveText(["Home", "Docs"]);
    await expect(nav.getByText("Breadcrumb", { exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("a link goes to its level", async ({ page, isMobile }) => {
    await press(
      trail(page, "basic").getByRole("link", { name: "Docs" }),
      isMobile,
    );

    await expect(page).toHaveURL(/\/docs$/);
  });

  test("a separator of your own is drawn, and kept from screen readers", async ({
    page,
  }) => {
    const nav = trail(page, "separator");
    const marks = nav.locator(".nuv-breadcrumb__separator");

    await expect(marks).toHaveText(["/", "/"]);
    await expect(marks.first()).toHaveAttribute("aria-hidden", "true");
    await expect(nav.getByRole("listitem")).toHaveCount(3);
  });

  test("the dots open a menu of the levels left out", async ({
    page,
    isMobile,
  }) => {
    const nav = trail(page, "collapsed");

    await press(
      nav.getByRole("button", { name: "Show 2 more levels" }),
      isMobile,
    );
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveText(["Docs", "Theming"]);

    await press(menu.getByRole("menuitem", { name: "Theming" }), isMobile);
    await expect(page).toHaveURL(/\/docs\/theming$/);
  });

  test("a router's link gets the look, and changes page without a reload", async ({
    page,
    isMobile,
  }) => {
    const link = trail(page, "router").getByRole("link", { name: "Forms" });
    await expect(link).toHaveClass(/nuv-breadcrumb__link/);

    await page.evaluate(() => {
      (window as { stayed?: boolean }).stayed = true;
    });
    await press(link, isMobile);

    await expect(page).toHaveURL(/\/docs\/forms$/);
    expect(
      await page.evaluate(() => (window as { stayed?: boolean }).stayed),
    ).toBe(true);
  });

  test("links are finger-sized on a phone, and as tall as their text with a mouse", async ({
    page,
    isMobile,
  }) => {
    const link = trail(page, "basic").getByRole("link", { name: "Docs" });

    expect((await link.boundingBox())?.height).toBe(isMobile ? 44 : 20);
  });

  test("the playground swaps the separator and collapses the middle", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    const nav = playground.getByRole("navigation");

    await playground.getByLabel("separator").selectOption("/");
    await playground.getByLabel("current page").fill("Invoices");
    await expect(nav.locator(".nuv-breadcrumb__separator")).toHaveText([
      "/",
      "/",
    ]);
    await expect(nav.getByText("Invoices")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(playground.locator("pre")).toContainText(
      "<BreadcrumbSeparator>/</BreadcrumbSeparator>",
    );

    await playground.getByLabel("collapse the middle").check();
    await expect(nav.getByRole("img", { name: "More" })).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Home"]);
  });
});

test.describe("pagination page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/pagination");
  });

  const pages = (page: Page, name: string) =>
    page.locator(`[data-preview="pagination/${name}"]`).getByRole("navigation");

  test("the row is a named landmark that marks the current page", async ({
    page,
  }) => {
    const nav = pages(page, "basic");

    await expect(nav).toHaveAccessibleName("Pagination");
    await expect(nav.getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "#page-1",
    );
    await expect(nav.getByRole("img", { name: "More pages" })).toBeVisible();
  });

  test("buttons move through the pages, and the row keeps its length", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="pagination/range"]');
    const nav = preview.getByRole("navigation");
    const places = nav.getByRole("listitem");

    await expect(preview.locator("p")).toHaveText("Page 1 of 20");
    await expect(nav.getByRole("button", { name: "Previous" })).toBeDisabled();
    await expect(places).toHaveCount(9);

    await press(nav.getByRole("button", { name: "Page 4" }), isMobile);
    await expect(preview.locator("p")).toHaveText("Page 4 of 20");
    await expect(nav.getByRole("button", { name: "Page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    for (let step = 0; step < 4; step += 1) {
      await press(nav.getByRole("button", { name: "Next" }), isMobile);
      await expect(places).toHaveCount(9);
    }
    await expect(preview.locator("p")).toHaveText("Page 8 of 20");
    // Now a gap on each side of the current page.
    await expect(nav.getByRole("img", { name: "More pages" })).toHaveCount(2);

    await press(nav.getByRole("button", { name: "Page 20" }), isMobile);
    await expect(nav.getByRole("button", { name: "Next" })).toBeDisabled();
    await expect(nav.getByRole("button", { name: "Previous" })).toBeEnabled();
    await expect(places).toHaveCount(9);
  });

  test("a router's link changes page without a reload", async ({
    page,
    isMobile,
  }) => {
    const nav = pages(page, "router");
    await expect(nav.getByRole("link", { name: "Guide 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const next = nav.getByRole("link", { name: "Next" });
    await expect(next).toHaveClass(/nuv-pagination__link--next/);
    await expect(next.locator("svg")).toHaveCount(1);

    await page.evaluate(() => {
      (window as { stayed?: boolean }).stayed = true;
    });
    await press(next, isMobile);

    await expect(page).toHaveURL(/\/docs\/scss$/);
    expect(
      await page.evaluate(() => (window as { stayed?: boolean }).stayed),
    ).toBe(true);
  });

  test("Previous and Next show only their arrows on a phone", async ({
    page,
    isMobile,
  }) => {
    const nav = pages(page, "basic");
    const next = nav.getByRole("link", { name: "Next" });
    const box = await next.boundingBox();
    const text = await next.locator(".nuv-pagination__label").boundingBox();
    if (!box || !text) throw new Error("nothing to measure");

    if (isMobile) {
      expect(box.width).toBe(44);
      expect(text.width).toBeLessThanOrEqual(1);
    } else {
      expect(box.width).toBeGreaterThan(60);
      expect(text.width).toBeGreaterThan(20);
    }
    expect(box.height).toBe(isMobile ? 44 : 40);
  });

  test("with no numbers beside the current one, the row fits a phone on one line", async ({
    page,
  }) => {
    const nav = pages(page, "compact");
    await nav.scrollIntoViewIfNeeded();
    const tops = await nav
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) => Math.round(link.getBoundingClientRect().top)),
      );

    // Previous, 1, 7, 20 and Next, with a gap either side of the 7.
    expect(tops).toHaveLength(5);
    expect(new Set(tops).size).toBe(1);
    await expect(nav.getByRole("img", { name: "More pages" })).toHaveCount(2);
  });

  test("the playground changes how many numbers show", async ({ page }) => {
    const playground = page.locator("[data-playground]");
    const nav = playground.getByRole("navigation");

    await expect(nav.getByRole("button", { name: /^Page / })).toHaveText([
      "1",
      "9",
      "10",
      "11",
      "20",
    ]);

    await playground.getByLabel("siblings").selectOption("2");
    await expect(nav.getByRole("button", { name: /^Page / })).toHaveText([
      "1",
      "8",
      "9",
      "10",
      "11",
      "12",
      "20",
    ]);
    await expect(playground.locator("pre")).toContainText(
      "paginationRange({ page, count: 20, siblings: 2 });",
    );

    await playground.getByLabel("count").selectOption("5");
    await expect(nav.getByRole("button", { name: /^Page / })).toHaveText([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    await expect(nav.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
