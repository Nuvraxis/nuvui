import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const column = (within: Locator, name: string) =>
  within.getByRole("group", { name, exact: true });
const cards = (within: Locator) => within.locator("li[data-card]");
const handle = (within: Locator, card: string) =>
  within.getByRole("button", { name: `Move ${card}`, exact: true });
// What the board last said to a screen reader. It's the library's own
// live region, the one with no words of the example's in it.
const spoken = (within: Locator) =>
  within.locator('.nuv-kanban [role="status"]');

// A key that does something to a card, and then a wait until the board
// has said so. Every step of a move is said, so what's said changing is
// how a test knows the step is done, however busy the machine is. Then a
// moment more: the board starts to listen for the next key a tick after
// the one that picked the card up.
async function key(area: Locator, name: string) {
  const before = (await spoken(area).textContent()) ?? "";
  await area.page().keyboard.press(name);
  await expect(spoken(area)).not.toHaveText(before);
  await area.page().waitForTimeout(150);
}

// A drag with a real mouse, in steps, as a hand would do it.
async function drag(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error("nothing to drag");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    start.x + start.width / 2 + 12,
    start.y + start.height / 2 + 12,
    { steps: 4 },
  );
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 12,
  });
  await page.waitForTimeout(150);
  await page.mouse.up();
}

test.describe("kanban start page", () => {
  test("says what to install and leads to the component", async ({ page }) => {
    await open(page, "/docs/kanban");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/kanban @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "Kanban", exact: true }),
    ).toHaveAttribute("href", "/docs/kanban/kanban");
    await expect(
      preview(page, "kanban/basic").locator("li[data-card]"),
    ).toHaveCount(5);
  });
});

test.describe("kanban page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/kanban/kanban");
  });

  test("the board is three named columns of cards, each card with a handle", async ({
    page,
  }) => {
    const area = preview(page, "kanban/basic");

    await expect(
      area.getByRole("group", { name: "Work for Contoso" }),
    ).toBeVisible();
    await expect(cards(column(area, "To do"))).toHaveCount(3);
    await expect(cards(column(area, "Doing"))).toHaveCount(1);
    await expect(cards(column(area, "Done"))).toHaveCount(1);
    await expect(handle(area, "Write the brief")).toHaveAttribute(
      "aria-roledescription",
      "sortable",
    );
  });

  test("with the keyboard a card is picked up, taken to the next column and dropped, and each step is said", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "kanban/basic");

    await handle(area, "Write the brief").focus();
    await key(area, "Space");
    await expect(spoken(area)).toHaveText(
      "Picked up Write the brief. It is at position 1 of 3 in To do.",
    );
    await key(area, "ArrowRight");
    await expect(
      cards(column(area, "Doing")).filter({ hasText: "Write the brief" }),
    ).toHaveCount(1);
    await expect(spoken(area)).toContainText("of 2 in Doing.");
    await key(area, "Space");

    await expect(spoken(area)).toContainText(
      "Write the brief was dropped at position",
    );
    await expect(cards(column(area, "To do"))).toHaveCount(2);
    await expect(cards(column(area, "Doing"))).toHaveCount(2);
    await expect(handle(area, "Write the brief")).toBeFocused();
  });

  test("Escape puts a carried card back", async ({ page, isMobile }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "kanban/basic");

    await handle(area, "Write the brief").focus();
    await key(area, "Space");
    await key(area, "ArrowRight");
    await expect(cards(column(area, "Doing"))).toHaveCount(2);
    await key(area, "Escape");

    await expect(spoken(area)).toHaveText(
      "Moving Write the brief was cancelled.",
    );
    await expect(cards(column(area, "To do"))).toHaveCount(3);
    await expect(cards(column(area, "Doing"))).toHaveCount(1);
  });

  test("with a mouse a card is dragged into another column", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A finger is tested in the package, not here.");
    const area = preview(page, "kanban/basic");
    await area.scrollIntoViewIfNeeded();

    await drag(
      page,
      cards(area).filter({ hasText: "Raise the invoice" }),
      cards(area).filter({ hasText: "Sign the contract" }),
    );

    await expect(
      cards(column(area, "Done")).filter({ hasText: "Raise the invoice" }),
    ).toHaveCount(1);
    await expect(cards(column(area, "Doing"))).toHaveCount(0);
    await expect(column(area, "Doing")).toContainText("Nothing here yet");
  });

  test("a move that isn't taken is undone, and the page says why", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "kanban/limit");
    const said = area.locator("p[role='status']");
    await expect(said).toHaveText("Nothing moved yet.");

    await handle(area, "Write the brief").focus();
    await key(area, "Space");
    await key(area, "ArrowRight");
    await key(area, "Space");

    await expect(said).toHaveText(
      "Doing takes 2 cards. Write the brief stays where it was.",
    );
    await expect(cards(column(area, "To do"))).toHaveCount(3);
    await expect(cards(column(area, "Doing"))).toHaveCount(2);
  });

  test("a move that is taken stays, and the count in the header follows", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone has no arrow keys.");
    const area = preview(page, "kanban/limit");

    await handle(area, "Raise the invoice").focus();
    await key(area, "Space");
    await key(area, "ArrowRight");
    await key(area, "Space");

    await expect(area.locator("p[role='status']")).toHaveText(
      "Raise the invoice is in Done.",
    );
    await expect(cards(column(area, "Done"))).toHaveCount(1);
    await expect(column(area, "Doing")).toContainText("1 of 2");
  });

  test("a button inside a card is pressed as a button, and the card stays", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "kanban/content");

    await press(area.getByRole("button", { name: "Open T-102" }), isMobile);

    await expect(area.locator("p[role='status']")).toHaveText("Opened T-102.");
    await expect(cards(column(area, "Open"))).toHaveCount(3);
  });

  test("the playground turns moving off, and takes the count and the empty text away", async ({
    page,
  }) => {
    const area = playground(page);
    await expect(handle(area, "Write the brief")).toBeEnabled();
    await expect(column(area, "Done")).toContainText("Nothing here yet");
    await expect(area.locator(".nuv-kanban__count")).toHaveCount(3);

    await area.getByLabel("disabled").check();
    await expect(handle(area, "Write the brief")).toBeDisabled();
    await expect(area.locator("pre").first()).toContainText("disabled");

    await area.getByLabel("count").uncheck();
    await expect(area.locator(".nuv-kanban__count")).toHaveCount(0);

    await area.getByLabel("empty").uncheck();
    await expect(column(area, "Done")).not.toContainText("Nothing here yet");
  });

  test("on a narrow screen the board scrolls sideways and the page doesn't", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const board = preview(page, "kanban/basic").locator(".nuv-kanban");

    expect(
      await board.evaluate((element) => element.scrollWidth),
    ).toBeGreaterThan(await board.evaluate((element) => element.clientWidth));
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });

  test("the examples pass axe, at rest and with a card carried", async ({
    page,
    isMobile,
  }) => {
    const rules = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
    const check = async () =>
      (
        await new AxeBuilder({ page })
          .include("[data-preview]")
          .withTags(rules)
          .analyze()
      ).violations;

    expect(await check()).toEqual([]);
    if (isMobile) return;

    const area = preview(page, "kanban/basic");
    await handle(area, "Write the brief").focus();
    await key(area, "Space");
    expect(await check()).toEqual([]);
    await key(area, "Escape");
  });
});
