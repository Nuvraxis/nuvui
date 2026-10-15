import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const confetti = (page: Page) => page.locator("canvas.nuv-confetti");

test.describe("animated number page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/animated-number");
  });

  test("a press changes the number, the digits move, and it's plain text again after", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "animated-number/basic");
    const number = example.locator(".nuv-animated-number");
    await expect(number.locator(".nuv-animated-number__text")).toHaveText(
      "1,280",
    );

    await press(example.getByRole("button", { name: "Add 145" }), isMobile);

    await expect(number.locator(".nuv-animated-number__text")).toHaveText(
      "1,425",
    );
    await expect(number).toHaveAttribute("value", "1425");
    // The copy that moves is hidden, and goes once it has arrived.
    await expect(number.locator(".nuv-animated-number__motion")).toHaveCount(
      0,
      { timeout: 4000 },
    );
    await expect(number).toHaveAttribute("data-state", "still");
  });

  test("with less motion the new number is there at once", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const example = preview(page, "animated-number/basic");

    await press(example.getByRole("button", { name: "Remove 37" }), isMobile);

    await expect(example.locator(".nuv-animated-number__text")).toHaveText(
      "1,243",
    );
    await expect(example.locator(".nuv-animated-number__motion")).toHaveCount(
      0,
    );
  });

  test("a number in a live region is read once it has changed", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "animated-number/announced");
    const live = example.locator("[aria-live=polite]");

    await press(example.getByRole("button", { name: "Add to cart" }), isMobile);

    await expect(live).toContainText("3");
    await expect(live.locator(".nuv-animated-number__motion")).toHaveCount(0, {
      timeout: 4000,
    });
    await expect(live).toHaveText("3 items in your cart");
  });

  test("each currency is written its own way, and only the digits move", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "animated-number/currencies");
    const text = (market: string) =>
      example
        .locator("dt", { hasText: market })
        .locator("+ dd .nuv-animated-number__text");

    await press(
      example.getByRole("button", { name: "Show yearly prices" }),
      isMobile,
    );

    // The euro after the number, with a comma, and the pound before it.
    await expect(text("Germany")).toHaveText(/^490,00\s€$/);
    await expect(text("United Kingdom")).toHaveText("£420.00");
    await expect(text("Japan")).toHaveText("￥78,000");
    await expect(example.locator(".nuv-animated-number__motion")).toHaveCount(
      0,
      { timeout: 4000 },
    );
  });

  test("the playground changes the animation and the code together", async ({
    page,
  }) => {
    await playground(page).getByLabel("animation").selectOption("pop");

    await expect(playground(page).locator(".nuv-animated-number")).toHaveClass(
      /nuv-animated-number--pop/,
    );
    await expect(playground(page).locator("pre")).toContainText(
      'animation="pop"',
    );
  });
});

test.describe("text reveal page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/text-reveal");
  });

  test("the lines are one heading, read as words", async ({ page }) => {
    await expect(
      preview(page, "text-reveal/basic").getByRole("heading", {
        name: "Every report your team asks for",
      }),
    ).toBeVisible();
  });

  test("text further down waits to be scrolled to, then rises", async ({
    page,
  }) => {
    const reveal = preview(page, "text-reveal/view").locator(
      ".nuv-text-reveal",
    );
    await expect(reveal).toHaveAttribute("data-state", "waiting");

    await reveal.scrollIntoViewIfNeeded();

    await expect(reveal).toHaveAttribute("data-state", "rising");
    await expect(reveal).toHaveText(/Rises the first time\s+it's scrolled/);
  });

  test("the page from the server has every word", async ({ page }) => {
    const html = await (
      await page.request.get("/docs/components/text-reveal")
    ).text();

    expect(html).toContain("Every report");
    expect(html).toContain("your team asks for");
    expect(html).not.toContain('data-state="waiting"');
  });
});

test.describe("confetti page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/confetti");
  });

  test("a press throws it on a canvas over the page, which goes when it's over", async ({
    page,
    isMobile,
  }) => {
    const button = preview(page, "confetti/basic").getByRole("button", {
      name: "Publish",
    });

    await press(button, isMobile);

    await expect(confetti(page)).toHaveCount(1);
    await expect(confetti(page)).toHaveAttribute("aria-hidden", "true");
    // It doesn't stand in the way of the next press.
    await press(button, isMobile);
    await expect(confetti(page)).toHaveCount(0, { timeout: 8000 });
  });

  test("the last step of the list throws it, and says so in words", async ({
    page,
    isMobile,
  }) => {
    const example = preview(page, "confetti/checklist");

    for (const step of [
      "Invite your team",
      "Connect a data source",
      "Share a report",
    ]) {
      await press(example.getByRole("checkbox", { name: step }), isMobile);
    }

    await expect(example.getByRole("status")).toHaveText("All set up.");
    await expect(confetti(page)).toHaveCount(1);
  });

  test("nothing is thrown for anyone who asked for less motion", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await press(
      preview(page, "confetti/basic").getByRole("button", { name: "Publish" }),
      isMobile,
    );

    await expect(confetti(page)).toHaveCount(0);
  });
});
