import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

test.describe("event calendar page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/scheduler/event-calendar");
  });

  test("the week has this week's events, and next and today move through time", async ({
    page,
    isMobile,
  }) => {
    const calendar = preview(page, "event-calendar/basic");
    await calendar.scrollIntoViewIfNeeded();
    await expect(
      calendar.getByRole("button", { name: /^Stand-up/ }).first(),
    ).toBeVisible();

    const heading = calendar.getByRole("heading", { level: 2 });
    const now = await heading.textContent();
    await press(calendar.getByRole("button", { name: "Next" }), isMobile);
    await expect(heading).not.toHaveText(now ?? "");
    await expect(
      calendar.getByRole("button", { name: /^Sprint review/ }),
    ).toBeVisible();
    await press(calendar.getByRole("button", { name: "Today" }), isMobile);
    await expect(heading).toHaveText(now ?? "");
  });

  test("the month keeps a full day's other events behind a button", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "the example's month is narrow on a phone");
    const calendar = preview(page, "event-calendar/month");
    await calendar.scrollIntoViewIfNeeded();
    const more = calendar.getByRole("button", { name: /^\d+ more$/ }).first();
    await press(more, isMobile);
    const list = page.getByRole("dialog");
    await expect(list).toBeVisible();
    await expect(list.getByRole("button").first()).toBeVisible();
  });

  test("the agenda lists only the days with events", async ({ page }) => {
    const calendar = preview(page, "event-calendar/agenda");
    await calendar.scrollIntoViewIfNeeded();
    const days = calendar.getByRole("heading", { level: 3 });
    await expect(days.first()).toBeVisible();
    for (const day of await days.all()) {
      await expect(
        page.getByRole("region", { name: (await day.textContent()) ?? "" }),
      ).toHaveCount(1);
    }
  });

  test("a time zone chosen moves the events, and not when they happen", async ({
    page,
  }) => {
    const example = preview(page, "event-calendar/time-zone");
    await example.scrollIntoViewIfNeeded();
    await expect(
      example.getByRole("button", {
        name: /^Call with the London office, 9:00 AM/,
      }),
    ).toBeVisible();
    await example.getByRole("combobox", { name: "Shown in" }).click();
    await page.getByRole("option", { name: "Asia/Tokyo" }).click();
    // Nine in London is five in Tokyo in summer, and six after the clocks
    // go back.
    await expect(
      example.getByRole("button", {
        name: /^Call with the London office, [56]:00 PM/,
      }),
    ).toBeVisible();
  });

  test("the hours example shows the working day only", async ({ page }) => {
    const calendar = preview(page, "event-calendar/hours");
    await calendar.scrollIntoViewIfNeeded();
    await expect(calendar.locator("[data-hour]")).toHaveCount(10);
    await expect(calendar.locator("[data-hour]").first()).toHaveAttribute(
      "data-hour",
      "8",
    );
  });

  test("the arrow keys move around the grid", async ({ page, isMobile }) => {
    test.skip(isMobile, "a phone has no keyboard");
    const calendar = preview(page, "event-calendar/month");
    await calendar.scrollIntoViewIfNeeded();
    const grid = calendar.getByRole("grid");
    await grid.locator('[role="gridcell"][tabindex="0"]').focus();
    const first = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
      )
      .not.toBe(first);
  });
});
