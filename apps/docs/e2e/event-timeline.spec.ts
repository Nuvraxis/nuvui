import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

test.describe("event timeline page", () => {
  test.beforeEach(async ({ page }) => {
    // The examples are around the week the page is read in. This one's
    // Monday is the 26th of October.
    await page.clock.setFixedTime(new Date(2026, 9, 26, 8));
    await open(page, "/docs/scheduler/event-timeline");
  });

  test("the vans are rows, and next and today move through the months", async ({
    page,
    isMobile,
  }) => {
    const timeline = preview(page, "event-timeline/basic");
    await timeline.scrollIntoViewIfNeeded();
    await expect(
      timeline.getByRole("rowheader", { name: "Van 1", exact: true }),
    ).toBeVisible();
    await expect(
      timeline.getByRole("button", { name: /^Market deliveries, .*, Van 1$/ }),
    ).toBeVisible();
    const heading = timeline.getByRole("heading", { level: 2 });
    await expect(heading).toHaveText("October 2026");
    await press(
      timeline.getByRole("button", { name: "Next", exact: true }),
      isMobile,
    );
    await expect(heading).toHaveText("November 2026");
    await press(
      timeline.getByRole("button", { name: "Today", exact: true }),
      isMobile,
    );
    await expect(heading).toHaveText("October 2026");
  });

  test("an event moved to the next row from the keyboard goes to that van", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no keyboard");
    const timeline = preview(page, "event-timeline/changes");
    await timeline.scrollIntoViewIfNeeded();
    await timeline
      .getByRole("button", { name: /^Market deliveries, .*, Van 1$/ })
      .focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(
      timeline.getByRole("list", { name: "Changes" }).getByRole("listitem"),
    ).toHaveText(["update, Market deliveries, on van-2"]);
  });

  test("two thousand machines are counted, and drawn as they scroll into view", async ({
    page,
  }) => {
    const timeline = preview(page, "event-timeline/many");
    await timeline.scrollIntoViewIfNeeded();
    const grid = timeline.getByRole("grid");
    await expect(grid).toHaveAttribute("aria-rowcount", "2002");
    await grid.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(
      timeline.getByRole("rowheader", { name: "Machine 2000" }),
    ).toBeVisible();
    expect(await timeline.getByRole("rowheader").count()).toBeLessThan(150);
  });
});
