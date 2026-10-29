import { expect, type Locator, type Page, test } from "@playwright/test";
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
    await press(
      calendar.getByRole("button", { name: "Next", exact: true }),
      isMobile,
    );
    await expect(heading).not.toHaveText(now ?? "");
    await expect(
      calendar.getByRole("button", { name: /^Sprint review/ }),
    ).toBeVisible();
    await press(
      calendar.getByRole("button", { name: "Today", exact: true }),
      isMobile,
    );
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

// The examples' week is the one the page is read in, and a narrow example
// shows three days from today. A weekday's stand-up is in every three days
// but a weekend's, so it steps back until one is shown.
async function showStandUps(calendar: Locator) {
  const standUp = calendar.getByRole("button", { name: /^Stand-up/ });
  for (let step = 0; step < 3 && (await standUp.count()) === 0; step += 1) {
    await calendar.getByRole("button", { name: "Previous" }).click();
  }
  return standUp.first();
}

test.describe("editing events page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/scheduler/editing");
  });

  test("a click on empty time makes an event, saved from its popover", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "the week is three days on a phone, and starts today");
    const calendar = preview(page, "event-calendar/controlled");
    await calendar.scrollIntoViewIfNeeded();
    await calendar
      .getByRole("gridcell", { name: /, 7 AM$/ })
      .first()
      .click({ position: { x: 6, y: 4 } });
    const form = page.getByRole("dialog");
    await form.getByRole("textbox", { name: "Title" }).fill("Budget review");
    await form.getByRole("button", { name: "Save" }).click();
    await expect(
      calendar.getByRole("button", { name: /^Budget review, 7:00 AM/ }),
    ).toBeVisible();
    await expect(calendar.getByRole("status").last()).toHaveText(
      "Last change: create, Budget review.",
    );
  });

  test("an event that's read-only opens to be read", async ({
    page,
    isMobile,
  }) => {
    const calendar = preview(page, "event-calendar/read-only");
    await calendar.scrollIntoViewIfNeeded();
    await press(await showStandUps(calendar), isMobile);
    const read = page.getByRole("dialog");
    await expect(read.getByRole("button", { name: "Close" })).toBeVisible();
    await expect(read.getByRole("textbox")).toHaveCount(0);
  });

  test("an event is picked up and moved from the keyboard", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no keyboard");
    const calendar = preview(page, "event-calendar/controlled");
    await calendar.scrollIntoViewIfNeeded();
    await (await showStandUps(calendar)).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-label",
      /^Stand-up, 9:45 AM to 10:00 AM/,
    );
    await expect(calendar.getByRole("status").last()).toHaveText(
      "Last change: update, Stand-up.",
    );
  });
});

test.describe("resources page", () => {
  test.beforeEach(async ({ page }) => {
    // The examples' events are in this week, and a narrow calendar shows the
    // three days from today. On a Monday those are the days that have them.
    await page.clock.setFixedTime(new Date(2026, 9, 26, 8));
    await open(page, "/docs/scheduler/resources");
  });

  test("a resource hidden in the side panel takes its events with it", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "a phone shows three days, which may have none of them",
    );
    const calendar = preview(page, "event-calendar/resources");
    await calendar.scrollIntoViewIfNeeded();
    const inRoom = calendar.getByRole("button", { name: /, Room 4B$/ });
    await expect(inRoom.first()).toBeVisible();
    const panel = calendar.getByRole("button", { name: "Side panel" });
    if ((await panel.getAttribute("aria-expanded")) === "false") {
      await panel.click();
    }
    await calendar.getByRole("checkbox", { name: "Room 4B" }).click();
    await expect(inRoom).toHaveCount(0);
    await expect(
      calendar.getByRole("checkbox", { name: "Rooms", exact: true }),
    ).toHaveAttribute("aria-checked", "mixed");
  });

  test("a booking moved from the keyboard comes back with the app's names", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no keyboard");
    const calendar = preview(page, "event-calendar/keys");
    await calendar.scrollIntoViewIfNeeded();
    await calendar.getByRole("button", { name: /^Interviews/ }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(calendar.getByRole("status").last()).toHaveText(
      "Last change: update, Interviews, room 2A, booked by Wren Halloway.",
    );
  });
});

test.describe("recurring events page", () => {
  test.beforeEach(async ({ page }) => {
    // The examples start in this week. On a Monday, a narrow calendar's
    // three days are its first three.
    await page.clock.setFixedTime(new Date(2026, 9, 26, 8));
    await open(page, "/docs/scheduler/recurring-events");
  });

  test("an occurrence moved from the keyboard asks which, and one is two changes", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no keyboard");
    const calendar = preview(page, "event-calendar/recurring-changes");
    await calendar.scrollIntoViewIfNeeded();
    await calendar
      .getByRole("button", { name: /^Stand-up, .*Tuesday.*, repeats$/ })
      .focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    const question = page.getByRole("alertdialog", {
      name: "Change Stand-up?",
    });
    await expect(question).toBeVisible();
    await question.getByRole("button", { name: "This event" }).click();
    const changes = calendar.getByRole("list", { name: "Changes" });
    await expect(changes.getByRole("listitem")).toHaveText([
      "update, Stand-up, FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR, not on 2026-10-27",
      "create, Stand-up",
    ]);
  });
});
