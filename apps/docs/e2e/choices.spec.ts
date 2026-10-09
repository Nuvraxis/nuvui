import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");

// Radix picks the radio button that an arrow key moves focus to, and it
// moves focus a moment after the key goes down. A key that's let go of in
// the same instant has gone before the focus arrives. A finger holds it
// longer than that.
const arrow = (page: Page, key: string) =>
  page.keyboard.press(key, { delay: 50 });

test.describe("number field page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/number-field");
  });

  test("steps with the keys and the buttons, and stops at its limits", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "number-field/basic");
    const seats = area.getByRole("spinbutton", { name: "Seats" });
    await expect(seats).toHaveValue("5");
    await expect(seats).toHaveAttribute("aria-valuenow", "5");

    await press(area.getByRole("button", { name: "Increase" }), isMobile);
    await expect(seats).toHaveValue("6");

    await seats.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(seats).toHaveValue("4");
    await page.keyboard.press("End");
    await expect(seats).toHaveValue("50");
    await expect(area.getByRole("button", { name: "Increase" })).toBeDisabled();
    await page.keyboard.press("Home");
    await expect(seats).toHaveValue("1");
    await expect(area.getByRole("button", { name: "Decrease" })).toBeDisabled();
  });

  test("takes what's typed on leaving, and moves it inside the limits", async ({
    page,
  }) => {
    const seats = preview(page, "number-field/basic").getByRole("spinbutton");

    await seats.fill("900");
    // Still what was typed, and not yet the value.
    await expect(seats).toHaveValue("900");
    await expect(seats).toHaveAttribute("aria-valuenow", "5");
    await seats.blur();
    await expect(seats).toHaveValue("50");

    await seats.fill("lots");
    await seats.blur();
    await expect(seats).toHaveValue("50");
  });

  test("writes each number its own way, and reads typing the same way", async ({
    page,
  }) => {
    const area = preview(page, "number-field/formats");
    const budget = area.getByRole("spinbutton", { name: "Budget" });
    const discount = area.getByRole("spinbutton", { name: "Discount" });
    const weight = area.getByRole("spinbutton", { name: /Weight/ });

    await expect(budget).toHaveValue("$2,500");
    await expect(budget).toHaveAttribute("aria-valuetext", "$2,500");
    await expect(discount).toHaveValue("15%");
    await expect(weight).toHaveValue("1.234,5 kg");

    await discount.fill("33");
    await discount.blur();
    await expect(discount).toHaveValue("33%");
    await expect(discount).toHaveAttribute("aria-valuenow", "0.33");

    await weight.fill("2.000,5");
    await weight.blur();
    await expect(weight).toHaveValue("2.000,5 kg");
    await expect(weight).toHaveAttribute("aria-valuenow", "2000.5");
  });

  test("in a form, sends the plain number, and Enter sends what was just typed", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "number-field/in-a-form");
    const amount = area.getByRole("spinbutton", { name: /Amount/ });
    await expect(amount).toHaveValue(/^1\.250,00\s€$/);
    await expect(amount).toHaveAccessibleDescription(/In euros/);

    await press(area.getByRole("button", { name: "Send" }), isMobile);
    await expect(area.locator("output")).toHaveText("Sent: 1250");

    await amount.fill("2.000,50");
    await page.keyboard.press("Enter");
    await expect(area.locator("output")).toHaveText("Sent: 2000.5");

    // Required: an empty field stops the form.
    await amount.fill("");
    await press(area.getByRole("button", { name: "Send" }), isMobile);
    await expect(area.locator("output")).toHaveText("Sent: 2000.5");
    expect(
      await amount.evaluate(
        (element: HTMLInputElement) => element.validity.valueMissing,
      ),
    ).toBe(true);
  });

  test("the playground changes the field and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const field = area.getByRole("spinbutton", { name: "Amount" });

    await area.getByLabel("format").selectOption("currency");
    await expect(field).toHaveValue("$5.00");
    await area.getByLabel("step").fill("0.5");
    await field.focus();
    await page.keyboard.press("ArrowUp");
    await expect(field).toHaveValue("$5.50");
    await expect(area.locator("[data-value]")).toHaveText("The value is 5.5");

    await area.getByLabel("min and max").uncheck();
    await expect(area.locator("pre")).toContainText(
      '<NumberField step={0.5} format={{ currency: "USD" }} />',
    );
  });
});

test.describe("rating page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/rating");
  });

  test("a press chooses a star, and the arrow keys move the choice", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rating/basic");
    const group = area.getByRole("radiogroup", {
      name: "How was the delivery?",
    });
    await expect(group.getByRole("radio")).toHaveCount(5);
    await expect(group.getByRole("radio", { name: "3 stars" })).toBeChecked();

    await press(group.getByRole("radio", { name: "5 stars" }), isMobile);
    await expect(area.getByText("5 of 5")).toBeVisible();

    await group.getByRole("radio", { name: "5 stars" }).focus();
    await arrow(page, "ArrowLeft");
    await expect(area.getByText("4 of 5")).toBeVisible();
    await expect(group.locator(".nuv-rating__star--on")).toHaveCount(4);
  });

  test("a rating that only shows is one picture, with part of a star filled", async ({
    page,
  }) => {
    const area = preview(page, "rating/read-only");

    await expect(area.getByRole("radio")).toHaveCount(0);
    await expect(area.getByRole("img", { name: "4.5 out of 5" })).toBeVisible();
    await expect(area.getByRole("img", { name: "3.7 out of 5" })).toBeVisible();
    // Four whole stars and half of the fifth, at 16 pixels a star.
    const widths = await area
      .getByRole("img", { name: "4.5 out of 5" })
      .locator(".nuv-rating__fill")
      .evaluateAll((fills) =>
        fills.map((fill) => fill.getBoundingClientRect().width),
      );
    expect(widths).toEqual([16, 16, 16, 16, 8]);
  });

  test("there are as many stars as max says", async ({ page }) => {
    await expect(
      preview(page, "rating/sizes")
        .getByRole("radiogroup", { name: "Out of ten" })
        .getByRole("radio"),
    ).toHaveCount(10);
  });

  test("the playground changes the rating and the code together", async ({
    page,
  }) => {
    const area = playground(page);

    await area.getByLabel("size").selectOption("lg");
    await area.getByLabel("max").selectOption("10");
    await expect(area.getByRole("radio")).toHaveCount(10);
    await expect(area.locator(".nuv-rating")).toHaveClass(/nuv-rating--lg/);

    await area.getByLabel("readOnly").check();
    await area.getByLabel("value").selectOption("4.5");
    await expect(
      area.getByRole("img", { name: "4.5 out of 10" }),
    ).toBeVisible();
    await expect(area.locator("pre")).toContainText(
      '<Rating aria-label="Rating" readOnly value={4.5} size="lg" max={10} />',
    );
  });
});

test.describe("stepper page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/stepper");
  });

  test("says which steps are done and which is current", async ({ page }) => {
    const list = preview(page, "stepper/basic").getByRole("list", {
      name: "Setting up",
    });
    const items = list.getByRole("listitem");

    await expect(items).toHaveCount(4);
    await expect(items.nth(0)).toHaveAttribute("data-state", "complete");
    await expect(items.nth(2)).toHaveAttribute("data-state", "current");
    await expect(items.nth(2)).toHaveAttribute("aria-current", "step");
    await expect(items.nth(3)).toHaveAttribute("data-state", "upcoming");
    await expect(list.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(list.locator(".nuv-stepper__title").first()).toHaveText(
      "Account Completed",
    );
  });

  test("the circles are in a row across, and in a column down", async ({
    page,
  }) => {
    const across = await preview(page, "stepper/basic")
      .locator(".nuv-stepper__indicator")
      .evaluateAll((circles) =>
        circles.map((circle) => Math.round(circle.getBoundingClientRect().top)),
      );
    const down = await preview(page, "stepper/vertical")
      .locator(".nuv-stepper__indicator")
      .evaluateAll((circles) =>
        circles.map((circle) =>
          Math.round(circle.getBoundingClientRect().left),
        ),
      );

    expect(new Set(across).size).toBe(1);
    expect(new Set(down).size).toBe(1);
  });

  test("moves on when the value does, to all done and back", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "stepper/vertical");
    const items = area.getByRole("listitem");
    const states = () =>
      items.evaluateAll((all) =>
        all.map((item) => (item as HTMLElement).dataset.state),
      );
    expect(await states()).toEqual([
      "complete",
      "current",
      "upcoming",
      "upcoming",
    ]);

    const next = area.getByRole("button", { name: "Next" });
    await press(next, isMobile);
    await press(next, isMobile);
    await press(next, isMobile);
    expect(await states()).toEqual([
      "complete",
      "complete",
      "complete",
      "complete",
    ]);
    await expect(next).toBeDisabled();
    await expect(area.locator('[aria-current="step"]')).toHaveCount(0);

    await press(area.getByRole("button", { name: "Back" }), isMobile);
    await expect(items.nth(3)).toHaveAttribute("aria-current", "step");
  });

  test("the playground changes the stepper and the code together", async ({
    page,
  }) => {
    const area = playground(page);

    await area.getByLabel("value").selectOption("3");
    await area.getByLabel("orientation").selectOption("vertical");
    await area.getByLabel("variant").selectOption("dot");

    await expect(area.locator(".nuv-stepper")).toHaveClass(
      /nuv-stepper--vertical/,
    );
    await expect(area.locator(".nuv-stepper")).toHaveClass(/nuv-stepper--dot/);
    await expect(area.getByRole("listitem").nth(2)).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(area.locator("pre")).toContainText(
      '<Stepper value={3} orientation="vertical" variant="dot" aria-label="Setting up">',
    );
  });
});

test.describe("choice card page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/choice-card");
  });

  test("a radio card is named by its title, and pressing its text chooses it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "choice-card/radio");
    const group = area.getByRole("radiogroup", { name: "Plan" });
    const team = group.getByRole("radio", { name: "Team", exact: true });
    const enterprise = group.getByRole("radio", {
      name: "Enterprise",
      exact: true,
    });

    await expect(group.getByRole("radio")).toHaveCount(3);
    await expect(team).toBeChecked();
    await expect(team).toHaveAccessibleDescription(
      "Up to 50 people. $12 a seat.",
    );

    await press(area.getByText("Any number of people"), isMobile);
    await expect(enterprise).toBeChecked();
    await expect(team).not.toBeChecked();

    await enterprise.focus();
    await arrow(page, "ArrowUp");
    await expect(team).toBeChecked();
  });

  test("checkbox cards are ticked one by one, and a disabled one isn't", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "choice-card/checkbox");
    const sso = area.getByRole("checkbox", { name: "Single sign-on" });
    const audit = area.getByRole("checkbox", { name: "Audit log" });
    const support = area.getByRole("checkbox", { name: "Priority support" });

    await expect(area.getByRole("group", { name: "Add-ons" })).toBeVisible();
    await expect(sso).toBeChecked();
    await expect(audit).not.toBeChecked();

    await press(area.getByText("Who changed what"), isMobile);
    await expect(audit).toBeChecked();
    await expect(sso).toBeChecked();

    await expect(support).toBeDisabled();
    await area
      .getByText("An answer within four working hours.")
      .click({ force: true });
    await expect(support).not.toBeChecked();
  });

  test("the playground changes the card and the code together", async ({
    page,
  }) => {
    const area = playground(page);

    await area.getByLabel("indicator").selectOption("end");
    await area.getByLabel("ChoiceCardTitle").fill("Data export");
    await area.getByLabel("ChoiceCardDescription").uncheck();

    await expect(area.locator(".nuv-choice-card")).toHaveClass(
      /nuv-choice-card--end/,
    );
    await expect(
      area.getByRole("checkbox", { name: "Data export", exact: true }),
    ).toBeVisible();
    await expect(area.locator(".nuv-choice-card__description")).toHaveCount(0);
    await expect(area.locator("pre")).toContainText(
      '<CheckboxCard indicator="end">',
    );
  });
});
