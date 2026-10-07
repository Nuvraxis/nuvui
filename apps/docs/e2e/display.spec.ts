import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

test.describe("card page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/card");
  });

  test("the footer's buttons stack on a phone and sit in a row on a wider screen", async ({
    page,
    isMobile,
  }) => {
    const card = preview(page, "card/basic").locator(".nuv-card");
    const main = await card
      .getByRole("button", { name: "Add seats" })
      .boundingBox();
    const other = await card
      .getByRole("button", { name: "Change plan" })
      .boundingBox();
    if (!main || !other) throw new Error("nothing to measure");

    if (isMobile) {
      expect(main.y + main.height).toBeLessThanOrEqual(other.y);
    } else {
      expect(main.y).toBe(other.y);
      expect(main.x).toBeGreaterThan(other.x);
    }
  });

  test("the action sits at the end of the header", async ({ page }) => {
    const card = preview(page, "card/action").locator(".nuv-card");
    const title = await card.getByRole("heading").boundingBox();
    const action = await card.locator(".nuv-card__action").boundingBox();
    if (!title || !action) throw new Error("nothing to measure");

    expect(action.x).toBeGreaterThanOrEqual(title.x + title.width);
  });

  test("a picture placed straight inside reaches the card's edges", async ({
    page,
  }) => {
    const card = preview(page, "card/bleed").locator(".nuv-card");
    const box = await card.boundingBox();
    const media = await card.locator(".nuv-aspect-ratio").boundingBox();
    if (!box || !media) throw new Error("nothing to measure");

    // Inside the 1px edge on each side.
    expect(media.width).toBeCloseTo(box.width - 2, 0);
    expect(media.y).toBeCloseTo(box.y + 1, 0);
  });

  test("the playground adds and removes parts, in the card and in the code", async ({
    page,
  }) => {
    const area = playground(page);
    await expect(area.locator(".nuv-card__action")).toHaveCount(0);

    await area.getByLabel("with CardAction").check();
    await area.getByLabel("with CardFooter").uncheck();
    await area.getByLabel("title").fill("Enterprise plan");

    await expect(area.locator(".nuv-card__action")).toHaveCount(1);
    await expect(area.locator(".nuv-card__footer")).toHaveCount(0);
    await expect(area.getByRole("heading")).toHaveText("Enterprise plan");
    await expect(area.locator("pre")).toContainText("<CardAction>");
    await expect(area.locator("pre")).not.toContainText("<CardFooter>");
  });
});

test.describe("badge page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/badge");
  });

  test("a count has its unit for screen readers", async ({ page }) => {
    const badge = preview(page, "badge/with-icon").locator(".nuv-badge").nth(1);

    await expect(badge).toHaveText("12 failed jobs");
  });

  test("the playground changes the badge and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const badge = area.locator(".nuv-badge");

    await area.getByLabel("intent").selectOption("danger");
    await area.getByLabel("variant").selectOption("outline");
    await area.getByLabel("children").fill("Overdue");

    await expect(badge).toHaveClass(/nuv-badge--danger/);
    await expect(badge).toHaveClass(/nuv-badge--outline/);
    await expect(area.locator("pre")).toHaveText(
      '<Badge intent="danger" variant="outline">Overdue</Badge>',
    );
  });
});

test.describe("alert page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/alert");
  });

  test("each intent has its role and its own icon", async ({ page }) => {
    const alerts = preview(page, "alert/intents").locator(".nuv-alert");

    await expect(alerts).toHaveCount(4);
    for (const [index, role] of [
      "status",
      "status",
      "alert",
      "alert",
    ].entries()) {
      await expect(alerts.nth(index)).toHaveAttribute("role", role);
    }
    const drawings = await alerts
      .locator(".nuv-alert__icon")
      .evaluateAll((icons) => icons.map((icon) => icon.innerHTML));
    expect(new Set(drawings).size).toBe(4);
  });

  test("an alert added to the page is there to be announced, and goes again", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "alert/live");
    const alert = area.getByRole("alert");
    await expect(alert).toHaveCount(0);

    await press(
      area.getByRole("button", { name: "Save with an error" }),
      isMobile,
    );
    await expect(alert).toContainText("The changes weren't saved");

    await press(
      area.getByRole("button", { name: "Clear the error" }),
      isMobile,
    );
    await expect(alert).toHaveCount(0);
  });

  test("the playground changes the intent and can drop the icon", async ({
    page,
  }) => {
    const area = playground(page);
    const alert = area.locator(".nuv-alert");

    await area.getByLabel("intent").selectOption("warning");
    await area.getByLabel("icon").uncheck();

    await expect(alert).toHaveClass(/nuv-alert--warning/);
    await expect(alert.locator(".nuv-alert__icon")).toHaveCount(0);
    await expect(area.locator("pre")).toContainText(
      '<Alert intent="warning" icon={null}>',
    );
  });
});

test.describe("avatar page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/avatar");
  });

  test("a picture that loads is shown, and one that doesn't gives way to initials", async ({
    page,
  }) => {
    const area = preview(page, "avatar/basic");

    await expect(area.getByRole("img", { name: "Ada Lovelace" })).toBeVisible();
    await expect(area.getByText("GH")).toBeVisible();
    await expect(area.getByRole("img")).toHaveCount(1);
  });

  test("each avatar in a group has the person's name", async ({ page }) => {
    const group = preview(page, "avatar/group").getByRole("group", {
      name: "Assigned to",
    });

    await expect(group.getByRole("img")).toHaveCount(4);
    await expect(
      group.getByRole("img", { name: "Grace Hopper" }),
    ).toBeVisible();
  });

  test("the playground changes the size and the shape", async ({ page }) => {
    const area = playground(page);
    const avatar = area.locator(".nuv-avatar");

    await area.getByLabel("size").selectOption("lg");
    await area.getByLabel("shape").selectOption("square");

    await expect(avatar).toHaveClass(/nuv-avatar--lg/);
    await expect(avatar).toHaveClass(/nuv-avatar--square/);
    expect((await avatar.boundingBox())?.width).toBe(56);
  });
});

test.describe("empty page", () => {
  test("says what's missing, with the way out", async ({ page }) => {
    await open(page, "/docs/components/empty");
    const area = preview(page, "empty/basic");

    await expect(
      area.getByRole("heading", { name: "No invoices yet" }),
    ).toBeVisible();
    await expect(
      area.getByRole("button", { name: "New invoice" }),
    ).toBeVisible();
    await expect(area.locator(".nuv-empty__media")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

test.describe("skeleton page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/skeleton");
  });

  test("the skeletons give way to the content, and a status says so", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "skeleton/card");
    const card = area.locator(".nuv-card");
    await expect(card).toHaveAttribute("aria-busy", "true");
    await expect(card.locator(".nuv-skeleton")).toHaveCount(3);
    await expect(area.getByRole("status")).toHaveText("Loading the customer");

    await press(area.getByRole("button", { name: "Finish loading" }), isMobile);

    await expect(card.locator(".nuv-skeleton")).toHaveCount(0);
    await expect(card).toHaveAttribute("aria-busy", "false");
    await expect(
      card.getByRole("heading", { name: "Northwind Traders" }),
    ).toBeVisible();
    await expect(area.getByRole("status")).toHaveText(
      "The customer has loaded",
    );
  });

  test("two lines of text are spaced like lines", async ({ page }) => {
    const lines = preview(page, "skeleton/basic").locator(
      ".nuv-skeleton--text",
    );
    const first = await lines.nth(0).boundingBox();
    const second = await lines.nth(1).boundingBox();
    if (!first || !second) throw new Error("nothing to measure");

    expect(second.y).toBeCloseTo(first.y + first.height, 0);
  });
});

test.describe("spinner page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/spinner");
  });

  test("a button shows a spinner while it saves, and keeps focus", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "spinner/button");
    const button = area.getByRole("button", { name: "Save changes" });
    await expect(area.getByRole("status")).toHaveCount(0);

    // From the keyboard where there is one. Safari doesn't give a button
    // focus when it's clicked, so a click says nothing about focus there.
    if (isMobile) {
      await button.tap();
    } else {
      await button.focus();
      await page.keyboard.press("Enter");
    }

    await expect(area.getByRole("status")).toHaveText("Saving");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    if (!isMobile) await expect(button).toBeFocused();

    await expect(area.getByRole("status")).toHaveCount(0);
    await expect(button).not.toHaveAttribute("aria-disabled", "true");
  });

  test("a spinner next to text that says the same is hidden from screen readers", async ({
    page,
  }) => {
    const area = preview(page, "spinner/region");

    await expect(area.locator(".nuv-spinner")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(area.getByRole("status")).toHaveText(
      "Fetching the last 30 days of orders",
    );
  });
});

test.describe("progress page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/progress");
  });

  test("the bar fills as the upload goes, and is named by the text above it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "progress/labelled");
    const bar = area.getByRole("progressbar", { name: "Uploading report.pdf" });
    await expect(bar).toHaveAttribute("aria-valuenow", "0");

    await press(
      area.getByRole("button", { name: "Start the upload" }),
      isMobile,
    );

    await expect(bar).toHaveAttribute("aria-valuenow", "100", {
      timeout: 10_000,
    });
    await expect(bar).toHaveAttribute("data-state", "complete");
    await expect(
      area.getByRole("button", { name: "Upload again" }),
    ).toBeVisible();
  });

  test("a bar with no value doesn't claim one", async ({ page }) => {
    const bar = preview(page, "progress/indeterminate").getByRole(
      "progressbar",
    );

    await expect(bar).not.toHaveAttribute("aria-valuenow");
    await expect(bar).toHaveAttribute("data-state", "indeterminate");
  });

  test("steps are read as steps", async ({ page }) => {
    const bar = preview(page, "progress/steps")
      .getByRole("progressbar")
      .first();

    await expect(bar).toHaveAttribute("aria-valuetext", "Step 2 of 5");
  });

  test("the playground changes the value and the size", async ({ page }) => {
    const area = playground(page);
    const bar = area.getByRole("progressbar");

    await area.getByLabel("value").selectOption("75");
    await area.getByLabel("size").selectOption("lg");

    await expect(bar).toHaveAttribute("aria-valuenow", "75");
    await expect(bar).toHaveClass(/nuv-progress--lg/);
    await expect(area.locator("pre")).toHaveText(
      '<Progress aria-label="Upload" value={75} size="lg" />',
    );

    await area.getByLabel("value").selectOption("not known");
    await expect(bar).not.toHaveAttribute("aria-valuenow");
  });
});

test.describe("kbd and separator pages", () => {
  test("keys are kbd elements, sized by the text around them", async ({
    page,
  }) => {
    await open(page, "/docs/components/kbd");
    const keys = preview(page, "kbd/sizes").locator("kbd.nuv-kbd");
    const small = await keys.nth(0).boundingBox();
    const large = await keys.nth(2).boundingBox();
    if (!small || !large) throw new Error("nothing to measure");

    await expect(keys).toHaveCount(3);
    expect(large.height).toBeCloseTo(small.height * 2, 0);
  });

  test("a line is only announced when it's told to be", async ({ page }) => {
    await open(page, "/docs/components/separator");

    await expect(
      preview(page, "separator/basic").getByRole("separator"),
    ).toHaveCount(0);
    await expect(
      preview(page, "separator/semantic").getByRole("separator"),
    ).toHaveCount(1);
  });

  test("an upright line is as tall as its row", async ({ page }) => {
    await open(page, "/docs/components/separator");
    const row = preview(page, "separator/vertical");
    const line = await row.locator(".nuv-separator").first().boundingBox();
    const word = await row.getByText("Docs", { exact: true }).boundingBox();
    if (!line || !word) throw new Error("nothing to measure");

    expect(line.width).toBe(1);
    expect(line.height).toBeGreaterThanOrEqual(word.height);
  });
});

test.describe("aspect ratio page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/aspect-ratio");
  });

  test("a picture fills a 16 by 9 box", async ({ page }) => {
    const area = preview(page, "aspect-ratio/basic");
    const box = await area.locator(".nuv-aspect-ratio").boundingBox();
    const image = await area.getByRole("img").boundingBox();
    if (!box || !image) throw new Error("nothing to measure");

    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
    expect(image.width).toBeCloseTo(box.width, 0);
    expect(image.height).toBeCloseTo(box.height, 0);
  });

  test("a ratio set in CSS changes with the width of the screen", async ({
    page,
    isMobile,
  }) => {
    const box = await preview(page, "aspect-ratio/responsive")
      .locator(".nuv-aspect-ratio")
      .boundingBox();
    if (!box) throw new Error("nothing to measure");

    expect(box.width / box.height).toBeCloseTo(isMobile ? 1 : 21 / 9, 1);
  });
});

test.describe("collapsible page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/collapsible");
  });

  test("the button shows and hides the content", async ({ page, isMobile }) => {
    const area = preview(page, "collapsible/basic");
    const button = area.getByRole("button", { name: "Show the error details" });
    await expect(area.getByText(/timed out/)).toHaveCount(0);

    await press(button, isMobile);
    await expect(area.getByText(/timed out/)).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");

    await press(button, isMobile);
    await expect(area.getByText(/timed out/)).toHaveCount(0);
  });

  test("the keyboard works it, and focus stays on the button", async ({
    page,
  }) => {
    const button = preview(page, "collapsible/basic").getByRole("button");

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });

  test("a button under the content says what the next press does", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "collapsible/controlled");
    await expect(area.getByRole("listitem")).toHaveCount(2);

    await press(
      area.getByRole("button", { name: "Show 3 more fields" }),
      isMobile,
    );

    await expect(area.getByRole("listitem")).toHaveCount(5);
    await expect(
      area.getByRole("button", { name: "Show fewer fields" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("scroll area page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/scroll-area");
  });

  test("the list scrolls, and the thumb follows", async ({ page }) => {
    const area = preview(page, "scroll-area/basic");
    const viewport = area.locator(".nuv-scroll-area__viewport");
    const thumb = area.locator(".nuv-scroll-area__thumb");
    await expect(thumb).toBeVisible();
    const before = await thumb.boundingBox();

    await viewport.evaluate((element) => element.scrollTo({ top: 300 }));

    await expect
      .poll(async () => (await thumb.boundingBox())?.y)
      .toBeGreaterThan(before?.y ?? 0);
    await expect(area.getByText("Release 2.30")).not.toBeInViewport();
  });

  test("it can be reached and scrolled from the keyboard, and has a name", async ({
    page,
  }) => {
    const viewport = preview(page, "scroll-area/basic").getByRole("group", {
      name: "Releases",
    });
    await expect(viewport).toHaveAttribute("tabindex", "0");

    await viewport.focus();
    await page.keyboard.press("PageDown");

    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
  });

  test("a row of cards scrolls sideways and not the page", async ({ page }) => {
    const area = preview(page, "scroll-area/horizontal");
    const viewport = area.locator(".nuv-scroll-area__viewport");

    const sizes = await viewport.evaluate((element) => ({
      content: element.scrollWidth,
      box: element.clientWidth,
    }));
    expect(sizes.content).toBeGreaterThan(sizes.box);
    await expect(
      area.locator(
        '.nuv-scroll-area__scrollbar[data-orientation="horizontal"]',
      ),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test("with a maximum height it grows with its rows and then scrolls", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "scroll-area/max-height");
    const box = area.locator(".nuv-scroll-area");
    const add = area.getByRole("button", { name: "Add three rows" });
    const short = (await box.boundingBox())?.height ?? 0;
    await expect(area.locator(".nuv-scroll-area__thumb")).toHaveCount(0);

    await press(add, isMobile);
    await press(add, isMobile);

    await expect(area.locator(".nuv-scroll-area__thumb")).toBeVisible();
    const tall = (await box.boundingBox())?.height ?? 0;
    expect(tall).toBeGreaterThan(short);
    expect(tall).toBeCloseTo(160, 0);
  });
});

test.describe("toolbar page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/toolbar");
  });

  test("toggles stay pressed, and a group of one keeps one", async ({
    page,
    isMobile,
  }) => {
    const bar = preview(page, "toolbar/basic").getByRole("toolbar");

    await press(bar.getByRole("button", { name: "Bold" }), isMobile);
    await press(bar.getByRole("button", { name: "Italic" }), isMobile);
    await expect(bar.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(bar.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await press(bar.getByRole("radio", { name: "Right" }), isMobile);
    await expect(bar.getByRole("radio", { name: "Right" })).toBeChecked();
    await expect(bar.getByRole("radio", { name: "Left" })).not.toBeChecked();
  });

  test("the arrow keys move through it, and Tab leaves in one press", async ({
    page,
  }) => {
    const area = preview(page, "toolbar/basic");
    const bar = area.getByRole("toolbar");

    await bar.getByRole("button", { name: "Bold" }).focus();
    await page.keyboard.press("ArrowRight", { delay: 30 });
    await expect(bar.getByRole("button", { name: "Italic" })).toBeFocused();
    await page.keyboard.press("End", { delay: 30 });
    await expect(bar.getByRole("button", { name: "Share" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(bar.locator(":focus")).toHaveCount(0);
  });

  test("icon buttons have names, and a disabled one is skipped", async ({
    page,
  }) => {
    const bar = preview(page, "toolbar/icons").getByRole("toolbar");

    await bar.getByRole("button", { name: "Undo" }).focus();
    await page.keyboard.press("ArrowRight", { delay: 30 });

    await expect(bar.getByRole("button", { name: "Redo" })).toBeDisabled();
    await expect(bar.getByRole("button", { name: "Bold" })).toBeFocused();
  });

  test("a menu's button takes part in the toolbar, and opens its menu", async ({
    page,
    isMobile,
  }) => {
    const bar = preview(page, "toolbar/with-menu").getByRole("toolbar");
    const exportButton = bar.getByRole("button", { name: "Export" });

    await expect(exportButton).toHaveClass(/nuv-toolbar__button/);
    await press(exportButton, isMobile);

    await expect(page.getByRole("menuitem", { name: "PDF" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("on a phone, every control is big enough for a finger", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "With a mouse the controls are smaller on purpose.");
    const controls = preview(page, "toolbar/icons").locator(
      ".nuv-toolbar__button, .nuv-toolbar__toggle-item",
    );

    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("visually hidden page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/visually-hidden");
  });

  test("an icon button gets its name from text nobody sees", async ({
    page,
  }) => {
    const area = preview(page, "visually-hidden/basic");
    const button = area.getByRole("button", { name: "Delete the invoice" });
    const text = await area.getByText("Delete the invoice").boundingBox();

    await expect(button).toBeVisible();
    expect(text?.width).toBeLessThanOrEqual(1);
  });

  test("a skip link shows while it has focus, and goes to its target", async ({
    page,
  }) => {
    const area = preview(page, "visually-hidden/skip-link");
    const link = area.getByRole("link", { name: "Skip to the article" });
    // The element that does the hiding. The link inside keeps its size and
    // is clipped by it.
    const wrapper = area.locator(".nuv-visually-hidden");
    expect((await wrapper.boundingBox())?.width).toBeLessThanOrEqual(1);

    await link.focus();
    expect((await wrapper.boundingBox())?.width).toBeGreaterThan(50);

    await page.keyboard.press("Enter");
    await expect(area.getByText("The article starts here.")).toBeFocused();
    expect((await wrapper.boundingBox())?.width).toBeLessThanOrEqual(1);
  });

  test("each Open button in the table says what it opens", async ({ page }) => {
    const table = preview(page, "visually-hidden/table-header").getByRole(
      "table",
    );

    await expect(
      table.getByRole("columnheader", { name: "Actions" }),
    ).toHaveCount(1);
    await expect(
      table.getByRole("button", { name: "Open Northwind Traders" }),
    ).toBeVisible();
    await expect(
      table.getByRole("button", { name: "Open Contoso" }),
    ).toBeVisible();
  });
});

test.describe("right-to-left page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/right-to-left");
  });

  test("with the provider, the left arrow moves to the next tab", async ({
    page,
  }) => {
    const tabs = preview(page, "right-to-left/provider").getByRole("tab");

    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowLeft", { delay: 30 });

    await expect(tabs.nth(1)).toBeFocused();
    // The next tab is the one drawn to the left.
    const first = await tabs.nth(0).boundingBox();
    const second = await tabs.nth(1).boundingBox();
    expect(second?.x).toBeLessThan(first?.x ?? 0);
  });

  test("switching back to left to right turns the keys and the layout round", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "right-to-left/provider");
    const tabs = area.getByRole("tab");

    await press(area.getByRole("radio", { name: "Left to right" }), isMobile);
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight", { delay: 30 });

    await expect(tabs.nth(1)).toBeFocused();
    const first = await tabs.nth(0).boundingBox();
    const second = await tabs.nth(1).boundingBox();
    expect(second?.x).toBeGreaterThan(first?.x ?? 0);
  });

  test("the slider and the progress bar start from the right", async ({
    page,
  }) => {
    const area = preview(page, "right-to-left/provider");
    const track = await area.locator(".nuv-slider").boundingBox();
    const handle = await area.getByRole("slider").boundingBox();
    const bar = await area.getByRole("progressbar").boundingBox();
    const filled = await area.locator(".nuv-progress__indicator").boundingBox();
    if (!track || !handle || !bar || !filled) {
      throw new Error("nothing to measure");
    }

    expect(handle.x + handle.width / 2).toBeGreaterThan(
      track.x + track.width / 2,
    );
    expect(filled.x + filled.width).toBeCloseTo(bar.x + bar.width - 1, 0);
  });
});
