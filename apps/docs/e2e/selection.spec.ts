import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

test.describe("text shimmer page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/text-shimmer");
  });

  test("the words are text, and move unless less motion was asked for", async ({
    page,
  }) => {
    const text = preview(page, "text-shimmer/basic").getByText("Thinking");

    await expect(text).toHaveClass(/nuv-text-shimmer--active/);
    await expect(text).toHaveCSS("animation-name", "nuv-text-shimmer-sweep");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(text).toHaveCSS("animation-name", "none");
    await expect(text).toHaveCSS("background-image", "none");
  });

  test("the wait is read out from a status, and the answer takes its place", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "text-shimmer/status");
    const status = area.getByRole("status");
    await expect(status).toHaveText("");

    await press(
      area.getByRole("button", { name: "Summarize the quarter" }),
      isMobile,
    );
    await expect(status).toHaveText("Reading the report");
    await expect(status.locator(".nuv-text-shimmer")).toBeVisible();

    await expect(status).toHaveText("Revenue rose 12% over last quarter.", {
      timeout: 8000,
    });
    await expect(status.locator(".nuv-text-shimmer")).toHaveCount(0);
  });

  test("the playground changes the text and the code together", async ({
    page,
  }) => {
    const area = playground(page);

    await area.getByLabel("children").fill("Searching");
    await area.getByLabel("active").uncheck();

    await expect(area.getByText("Searching").first()).toHaveAttribute(
      "data-state",
      "still",
    );
    await expect(area.locator("pre")).toContainText(
      "<TextShimmer active={false}>Searching</TextShimmer>",
    );
  });
});

test.describe("hold to confirm page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/hold-to-confirm");
  });

  test("a press does nothing, and holding a key down confirms", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "hold-to-confirm/basic");
    const button = area.getByRole("button", { name: "Hold to delete" });
    const count = area.getByText(/^Deleted \d+ times?$/);
    await expect(button).toHaveAccessibleDescription("Hold down to confirm.");

    // A scripted tap isn't a finger going down and up in every browser,
    // so the plain press is checked with a mouse.
    if (!isMobile) {
      await button.click();
      await expect(button).toHaveAttribute("data-state", "idle");
    }
    await expect(count).toHaveText("Deleted 0 times");

    await button.focus();
    await page.keyboard.down("Enter");
    await expect(button).toHaveAttribute("data-state", "holding");
    await expect(count).toHaveText("Deleted 1 time", { timeout: 4000 });
    await page.keyboard.up("Enter");
    await expect(button).toHaveAttribute("data-state", "idle");
    await expect(count).toHaveText("Deleted 1 time");
  });

  test("holding the mouse down confirms, and letting go early doesn't", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no mouse");
    const area = preview(page, "hold-to-confirm/basic");
    const button = area.getByRole("button", { name: "Hold to delete" });
    const count = area.getByText(/^Deleted \d+ times?$/);

    await button.hover();
    await page.mouse.down();
    await expect(button).toHaveAttribute("data-state", "holding");
    await page.mouse.up();
    await expect(button).toHaveAttribute("data-state", "idle");
    await expect(count).toHaveText("Deleted 0 times");

    await page.mouse.down();
    await expect(count).toHaveText("Deleted 1 time", { timeout: 4000 });
    await page.mouse.up();
  });

  test("a press that can't be held confirms the second time", async ({
    page,
  }) => {
    const area = preview(page, "hold-to-confirm/basic");
    const button = area.getByRole("button", { name: "Hold to delete" });

    // What a screen reader sends: a click, with nothing going down first.
    await button.dispatchEvent("click");
    await expect(button).toHaveAttribute("data-state", "armed");
    await expect(
      page.getByRole("status").filter({ hasText: "Press again to confirm." }),
    ).toHaveCount(1);

    await button.dispatchEvent("click");
    await expect(area.getByText("Deleted 1 time")).toBeVisible();
    await expect(button).toHaveAttribute("data-state", "idle");
  });

  test("the playground changes the button and the code together", async ({
    page,
  }) => {
    const area = playground(page);

    await area.getByLabel("intent").selectOption("secondary");
    await area.getByLabel("duration").selectOption("800");

    // By its class: the playground has a button of its own, to copy the
    // code.
    await expect(area.locator(".nuv-hold-to-confirm")).toHaveClass(
      /nuv-button--secondary/,
    );
    await expect(area.locator("pre")).toContainText(
      '<HoldToConfirm onConfirm={remove} intent="secondary" duration={800}>',
    );
  });
});

test.describe("action bar page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/action-bar");
  });

  test("the bar is there while something is selected, and says how much", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "action-bar/basic");
    const bar = area.getByRole("group", { name: "Selected messages" });
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAccessibleDescription("1 selected");

    await press(
      area.getByRole("checkbox", { name: "Welcome to the team" }),
      isMobile,
    );
    await expect(bar).toHaveAccessibleDescription("2 selected");
    await expect(area.getByRole("status")).toHaveText("2 selected");

    await press(bar.getByRole("button", { name: "Archive" }), isMobile);
    await expect(bar).toHaveCount(0);
    // What a screen reader listens to stays, with nothing in it.
    await expect(area.getByRole("status")).toHaveText("");
    await expect(
      area.getByRole("checkbox", { name: "Welcome to the team" }),
    ).not.toBeChecked();
  });

  test("a sticky bar stays in view at the bottom of the box that scrolls", async ({
    page,
  }) => {
    const area = preview(page, "action-bar/sticky");
    const box = area.getByRole("region", { name: "Files" });
    const bar = area.getByRole("group", { name: "Selected files" });
    await box.scrollIntoViewIfNeeded();

    const bottoms = async () => {
      const [outer, inner] = await Promise.all([
        box.boundingBox(),
        bar.boundingBox(),
      ]);
      if (!outer || !inner) throw new Error("nothing to measure");
      return { outer: outer.y + outer.height, inner: inner.y + inner.height };
    };

    // The list is longer than the box, and the bar is in view all the same.
    const before = await bottoms();
    expect(before.inner).toBeLessThanOrEqual(before.outer);
    expect(before.outer - before.inner).toBeLessThan(40);

    await box.evaluate((element) => {
      element.scrollTop = 80;
    });
    const after = await bottoms();
    expect(Math.round(after.inner)).toBe(Math.round(before.inner));
  });

  test("the playground changes the bar and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    // By its name: the playground's controls are a group too.
    const bar = area.getByRole("group", { name: "Selected messages" });
    await expect(bar).toBeVisible();

    await area.getByLabel("selected").selectOption("0");
    await expect(bar).toHaveCount(0);

    await area.getByLabel("selected").selectOption("12");
    await area.getByLabel("position").selectOption("sticky");
    await expect(area.locator(".nuv-action-bar")).toHaveClass(
      /nuv-action-bar--sticky/,
    );
    await expect(area.locator("pre")).toContainText(
      '<ActionBar open={12 > 0} position="sticky" aria-label="Selected messages">',
    );
  });
});

test.describe("table of contents page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/table-of-contents");
  });

  test("lists the page's headings, and each link goes to one that's there", async ({
    page,
  }) => {
    const nav = preview(page, "table-of-contents/basic").getByRole(
      "navigation",
      { name: "On this page" },
    );
    await expect(nav.getByRole("link")).toHaveCount(6);

    for (const href of await nav
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      await expect(page.locator(`[id="${href?.slice(1)}"]`)).toHaveCount(1);
    }
    await expect(
      nav.getByRole("link", { name: "What the component handles" }),
    ).toHaveAttribute("data-depth", "2");
  });

  test("marks the heading the page has scrolled to", async ({ page }) => {
    const nav = preview(page, "table-of-contents/basic").getByRole(
      "navigation",
    );
    const marked = nav.locator('[aria-current="location"]');
    await expect(marked).toHaveCount(0);

    await page.locator("#props").evaluate((heading) => {
      heading.scrollIntoView({ block: "start" });
    });
    await expect(marked).toHaveText("Props");

    await page.locator("#css-variables").evaluate((heading) => {
      heading.scrollIntoView({ block: "start" });
    });
    await expect(marked).toHaveText("CSS variables");
    await expect(marked).toHaveCount(1);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(marked).toHaveCount(0);
  });

  test("the playground marks the heading it's told to", async ({ page }) => {
    const area = playground(page);
    const marked = area.locator('[aria-current="location"]');

    await area.getByLabel("value").selectOption("props");
    await expect(marked).toHaveText("Props");
    await expect(area.locator("pre")).toContainText(
      '<TableOfContents aria-label="On this page" items={items} value="props" offset={128} />',
    );

    await area.getByLabel("value").selectOption("null");
    await expect(marked).toHaveCount(0);
  });
});
