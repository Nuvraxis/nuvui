import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectOnScreen, open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

// A field of a range, by its label. Not by role: while the calendar is open
// as a sheet, the page behind it is hidden from everything that goes by
// role.
const rangeField = (within: Locator, label: string) =>
  within.locator(`input[aria-label="${label}"]`);

const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// The examples open on the month it is when the test runs. These find days
// by where they are in the month, so the tests don't depend on the date.
const days = (within: Locator) =>
  within.locator(".nuv-calendar__day-button:not(:disabled)");

// A date in this month as the field writes it, for a day of the month.
function thisMonth(day: number) {
  const now = new Date();
  const two = (value: number) => String(value).padStart(2, "0");
  return {
    typed: `${two(now.getMonth() + 1)}/${two(day)}/${now.getFullYear()}`,
    sent: `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(day)}`,
  };
}

// On its own, with nothing opened before it. A page that's left while it's
// still fetching logs errors of its own in WebKit.
test.describe("a calendar in the page's HTML", () => {
  test("shows this month, with today marked, and React takes it over cleanly", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });

    await open(page, "/docs/date-picker/calendar");
    const calendar = preview(page, "calendar/basic").locator(".nuv-calendar");

    // The site was built some time ago. The month and the day come from
    // the browser, once it has the page.
    await expect(calendar).not.toHaveAttribute("data-pending");
    const month = new Date().toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    await expect(calendar.getByRole("grid", { name: month })).toBeVisible();
    await expect(calendar.getByRole("button", { name: /^Today/ })).toHaveCount(
      1,
    );
    expect(problems).toEqual([]);
  });
});

test.describe("calendar page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/date-picker/calendar");
  });

  test("a press picks a day, and another press picks a different one", async ({
    page,
    isMobile,
  }) => {
    const calendar = preview(page, "calendar/basic");
    await press(days(calendar).nth(9), isMobile);
    await expect(calendar.locator('[aria-selected="true"]')).toHaveCount(1);
    await expect(days(calendar).nth(9)).toHaveAccessibleName(/selected$/);

    await press(days(calendar).nth(12), isMobile);
    await expect(calendar.locator('[aria-selected="true"]')).toHaveCount(1);
    await expect(days(calendar).nth(12)).toHaveAccessibleName(/selected$/);
  });

  test("a range runs from the first press to the second", async ({
    page,
    isMobile,
  }) => {
    const calendar = preview(page, "calendar/range");
    await press(days(calendar).nth(4), isMobile);
    await press(days(calendar).nth(8), isMobile);
    await expect(calendar.locator('[aria-selected="true"]')).toHaveCount(5);
    await expect(
      calendar.locator(".nuv-calendar__day--range-middle"),
    ).toHaveCount(3);
  });

  test("the arrow keys move from day to day, and Enter picks", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const calendar = preview(page, "calendar/basic");
    await days(calendar).nth(9).focus();
    await page.keyboard.press("ArrowRight");
    await expect(days(calendar).nth(10)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(days(calendar).nth(8)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(days(calendar).nth(8)).toHaveAccessibleName(/selected$/);
  });

  test("the month buttons change the month, and say so", async ({
    page,
    isMobile,
  }) => {
    const calendar = preview(page, "calendar/basic");
    const name = calendar.getByRole("status");
    const before = await name.textContent();
    await press(
      calendar.getByRole("button", { name: "Go to the Next Month" }),
      isMobile,
    );
    await expect(name).not.toHaveText(before ?? "");
  });

  test("weekends and days gone by can't be picked", async ({ page }) => {
    const calendar = preview(page, "calendar/disabled");
    await expect(
      calendar.locator(".nuv-calendar__day-button:disabled").first(),
    ).toBeVisible();
    await expect(
      calendar.getByRole("button", { name: /^(Saturday|Sunday)/ }).first(),
    ).toBeDisabled();
    await expect(
      calendar.getByRole("button", { name: "Go to the Previous Month" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("the year can be chosen from a list", async ({ page }) => {
    const calendar = preview(page, "calendar/dropdown");
    await calendar.getByRole("combobox", { name: "Choose the Year" }).click();
    await page.getByRole("option", { name: "1975" }).click();
    await expect(
      calendar.getByRole("grid", { name: "January 1975" }),
    ).toBeVisible();
  });

  test("a locale puts the calendar in another language", async ({ page }) => {
    const calendar = preview(page, "calendar/locale");
    await expect(calendar.locator(".nuv-calendar")).toHaveAttribute(
      "lang",
      "fr",
    );
    await expect(
      calendar.getByRole("button", { name: "Aller au mois suivant" }),
    ).toBeVisible();
  });

  test("the playground changes the calendar and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    await area.getByLabel("mode").selectOption("range");
    await area.getByLabel("numberOfMonths").selectOption("2");
    await area.getByLabel("showWeekNumber").check();

    await expect(area.getByRole("grid")).toHaveCount(2);
    await expect(area.getByRole("grid").first()).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    await expect(area.getByRole("rowheader").first()).toBeVisible();
    await expect(area.locator("pre")).toContainText('mode="range"');
    await expect(area.locator("pre")).toContainText("numberOfMonths={2}");
    await expect(area.locator("pre")).toContainText("showWeekNumber");
  });

  test("the reference tables are read from the add-on package", async ({
    page,
  }) => {
    await expect(
      page.getByRole("rowheader", { name: "--nuv-calendar-cell-size" }),
    ).toBeVisible();
    await expect(
      page.getByRole("rowheader", { name: ".nuv-calendar__day--today" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^captionLayout/ }),
    ).toBeVisible();
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`a picked range passes axe in ${colorScheme}`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await open(page, "/docs/date-picker/calendar");
      const calendar = preview(page, "calendar/range");
      await press(days(calendar).nth(4), isMobile);
      await press(days(calendar).nth(8), isMobile);

      const results = await new AxeBuilder({ page })
        .include('[data-preview="calendar/range"] > div:first-child')
        .withTags(wcag)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("date picker page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/date-picker/date-picker");
  });

  test("the calendar opens by the field on a wide screen and as a sheet on a phone, and stays on the screen", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-picker/basic");
    const button = example.getByRole("button", { name: /^Choose date/ });
    await press(button, isMobile);

    const popup = page.getByRole("dialog", { name: "Choose date" });
    await expect(popup).toBeVisible();
    await expectOnScreen(page, popup);

    const viewport = page.viewportSize();
    const box = await popup.boundingBox();
    if (!viewport || !box) throw new Error("nothing to measure");
    if (viewport.width < 640) {
      // A sheet: as wide as the screen and against its bottom edge.
      expect(box.width).toBe(viewport.width);
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
      await expect(
        popup.getByRole("heading", { name: "Choose date" }),
      ).toBeVisible();
    } else {
      await expect(popup.getByRole("heading")).toHaveCount(0);
    }
  });

  test("picking a day fills the field and puts focus back on the button", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-picker/basic");
    const field = example.getByRole("textbox", { name: "Due date" });
    const button = example.getByRole("button", { name: /^Choose date/ });
    await press(button, isMobile);

    const popup = page.getByRole("dialog", { name: "Choose date" });
    await press(days(popup).nth(14), isMobile);

    await expect(popup).toBeHidden();
    await expect(field).toHaveValue(thisMonth(15).typed);
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleName(/^Choose date, .+ 15th, /);
  });

  test("a typed date is taken, and the calendar opens on it", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-picker/basic");
    await example.getByRole("textbox", { name: "Due date" }).fill("03/09/2031");
    await press(
      example.getByRole("button", { name: /^Choose date/ }),
      isMobile,
    );

    const popup = page.getByRole("dialog", { name: "Choose date" });
    await expect(popup.getByRole("grid", { name: "March 2031" })).toBeVisible();
    await expect(
      popup.getByRole("button", { name: /March 9th, 2031, selected/ }),
    ).toBeFocused();
  });

  test("the keyboard opens the calendar, moves through it, picks and closes", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const example = preview(page, "date-picker/basic");
    const field = example.getByRole("textbox", { name: "Due date" });
    await field.fill("03/09/2031");
    await field.press("Alt+ArrowDown");

    const popup = page.getByRole("dialog", { name: "Choose date" });
    await expect(
      popup.getByRole("button", { name: /March 9th, 2031/ }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(popup).toBeHidden();
    await expect(field).toHaveValue("03/16/2031");

    // Focus is back on the button a moment after the calendar has gone.
    await expect(
      example.getByRole("button", { name: /^Choose date/ }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(popup).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(field).toHaveValue("03/16/2031");
  });

  test("a looser date is rewritten, and text that isn't a date is marked", async ({
    page,
  }) => {
    const field = preview(page, "date-picker/basic").getByRole("textbox", {
      name: "Due date",
    });
    await field.fill("3/9/31");
    await field.blur();
    await expect(field).toHaveValue("03/09/2031");
    await expect(field).not.toHaveAttribute("aria-invalid");

    await field.fill("next week");
    await field.blur();
    await expect(field).toHaveValue("next week");
    await expect(field).toHaveAttribute("aria-invalid", "true");
  });

  test("buttons outside the field can set and clear the date", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-picker/controlled");
    const field = example.getByRole("textbox", { name: "Start date" });
    await press(example.getByRole("button", { name: "Today" }), isMobile);
    await expect(field).not.toHaveValue("");
    await expect(example.getByText("No date picked.")).toBeHidden();

    await press(example.getByRole("button", { name: "Clear" }), isMobile);
    await expect(field).toHaveValue("");
    await expect(example.getByText("No date picked.")).toBeVisible();
  });

  test("a weekend is refused in a field that only takes weekdays", async ({
    page,
  }) => {
    const field = preview(page, "date-picker/limits").getByRole("textbox", {
      name: "Delivery date",
    });
    // Whichever of the next seven days is a Saturday.
    const saturday = new Date();
    saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7));
    const two = (value: number) => String(value).padStart(2, "0");
    await field.fill(
      `${two(saturday.getMonth() + 1)}/${two(saturday.getDate())}/${saturday.getFullYear()}`,
    );
    await field.blur();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    expect(
      await field.evaluate(
        (element) => (element as HTMLInputElement).validationMessage,
      ),
    ).toBe("Enter a weekday in the next 90 days.");
  });

  test("in a form, an empty field shows its error, and a date is sent as year, month and day", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-picker/field");
    const field = example.getByRole("textbox", { name: "Start date" });
    const save = example.getByRole("button", { name: "Save" });

    await press(save, isMobile);
    await expect(example.getByText("Enter the date you start.")).toBeVisible();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAccessibleDescription(
      "Your first day with us. Enter the date you start.",
    );

    await field.fill("03/09/2031");
    await press(save, isMobile);
    await expect(example.getByText("Sent: start=2031-03-09")).toBeVisible();
    await expect(field).not.toHaveAttribute("aria-invalid");
  });

  test("a locale changes the order a date is typed in", async ({ page }) => {
    const field = preview(page, "date-picker/locale").getByRole("textbox", {
      name: "Termin",
    });
    await expect(field).toHaveAttribute("placeholder", "TT.MM.JJJJ");
    await field.fill("9.3.31");
    await field.blur();
    await expect(field).toHaveValue("09.03.2031");
  });

  test("a day in Tokyo is midnight in Tokyo, wherever the browser is", async ({
    page,
  }) => {
    const example = preview(page, "date-picker/time-zone");
    await example
      .getByRole("textbox", { name: "Launch day in Tokyo" })
      .fill("03/09/2031");
    // Japan is nine hours ahead of UTC all year.
    await expect(
      example.getByText(
        "Midnight in Tokyo is 2031-03-08T15:00:00.000Z in UTC.",
      ),
    ).toBeVisible();
  });

  test("the playground changes the field and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const field = area.getByRole("textbox", { name: "Due date" });
    await area.getByLabel("format").selectOption("yyyy-MM-dd");
    await expect(field).toHaveAttribute("placeholder", "yyyy-mm-dd");
    await expect(area.locator("pre")).toContainText('format="yyyy-MM-dd"');

    await area.getByLabel("disabled").check();
    await expect(field).toBeDisabled();
    await expect(
      area.getByRole("button", { name: /^Choose date/ }),
    ).toBeDisabled();
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`the open calendar passes axe in ${colorScheme}`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await open(page, "/docs/date-picker/date-picker");
      const example = preview(page, "date-picker/basic");
      await example
        .getByRole("textbox", { name: "Due date" })
        .fill("03/09/2031");
      await press(
        example.getByRole("button", { name: /^Choose date/ }),
        isMobile,
      );
      await expect(
        page.getByRole("dialog", { name: "Choose date" }),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(wcag)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("date range picker page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/date-picker/date-range-picker");
  });

  test("the calendar stays open after the first day and closes on the second", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-range-picker/basic");
    // By class, for the same reason as the fields in it.
    const group = example.locator(".nuv-date-picker");
    const button = group.getByRole("button", { name: /^Choose dates/ });
    await press(button, isMobile);

    const popup = page.getByRole("dialog", { name: "Choose dates" });
    await expect(popup).toBeVisible();
    await expectOnScreen(page, popup);
    const viewport = page.viewportSize();
    await expect(popup.getByRole("grid")).toHaveCount(
      viewport && viewport.width < 640 ? 1 : 2,
    );

    await press(days(popup).nth(4), isMobile);
    await expect(popup).toBeVisible();
    await expect(rangeField(group, "Start date")).toHaveValue(
      thisMonth(5).typed,
    );
    await expect(rangeField(group, "End date")).toHaveValue("");

    await press(days(popup).nth(8), isMobile);
    await expect(popup).toBeHidden();
    await expect(rangeField(group, "End date")).toHaveValue(thisMonth(9).typed);
    await expect(button).toBeFocused();
  });

  test("both days can be typed, and a last day before the first is refused", async ({
    page,
  }) => {
    const group = preview(page, "date-range-picker/basic").getByRole("group", {
      name: "Stay",
    });
    const start = rangeField(group, "Start date");
    const end = rangeField(group, "End date");

    await start.fill("03/09/2031");
    await end.fill("03/01/2031");
    await end.blur();
    await expect(end).toHaveAttribute("aria-invalid", "true");
    await expect(start).not.toHaveAttribute("aria-invalid");

    await end.fill("03/12/2031");
    await expect(end).not.toHaveAttribute("aria-invalid");
  });

  test("in a form, each day is sent under its own name", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-range-picker/field");
    const run = example.getByRole("button", { name: "Run report" });
    await press(run, isMobile);
    await expect(example.getByText("Enter both dates.")).toBeVisible();

    const group = example.getByRole("group", { name: "Report period" });
    await rangeField(group, "Start date").fill("03/01/2020");
    await rangeField(group, "End date").fill("03/31/2020");
    await press(run, isMobile);
    await expect(
      example.getByText("Sent: from=2020-03-01 to=2020-03-31"),
    ).toBeVisible();
  });

  test("a range shorter than it's allowed to be starts again", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "date-range-picker/nights");
    const group = example.locator(".nuv-date-picker");
    await press(group.getByRole("button", { name: /^Choose dates/ }), isMobile);

    const popup = page.getByRole("dialog", { name: "Choose dates" });
    // On to next month, where every day can be picked whatever today is.
    await press(
      popup.getByRole("button", { name: "Go to the Next Month" }),
      isMobile,
    );
    // Two days next to each other are one night, and two are needed.
    const open = days(popup);
    await press(open.nth(1), isMobile);
    await press(open.nth(2), isMobile);
    await expect(popup).toBeVisible();
    await expect(rangeField(group, "Check-out")).toHaveValue("");

    await press(open.nth(5), isMobile);
    await expect(popup).toBeHidden();
    await expect(rangeField(group, "Check-out")).not.toHaveValue("");
  });

  test("the playground changes the field and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    await area.getByLabel("startLabel").fill("From");
    await expect(area.getByRole("textbox", { name: "From" })).toBeVisible();
    await expect(area.locator("pre")).toContainText('startLabel="From"');
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`an open range passes axe in ${colorScheme}`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await open(page, "/docs/date-picker/date-range-picker");
      const group = preview(page, "date-range-picker/basic").getByRole(
        "group",
        { name: "Stay" },
      );
      await rangeField(group, "Start date").fill("03/09/2031");
      await rangeField(group, "End date").fill("03/20/2031");
      await press(
        group.getByRole("button", { name: /^Choose dates/ }),
        isMobile,
      );
      await expect(
        page.getByRole("dialog", { name: "Choose dates" }),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(wcag)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
