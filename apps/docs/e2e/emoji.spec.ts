import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const list = (within: Locator | Page) =>
  within.getByRole("grid", { name: "Emoji", exact: true });
const search = (within: Locator | Page) =>
  within.getByRole("searchbox", { name: "Search emoji" });
const emoji = (within: Locator | Page, name: string) =>
  list(within).getByRole("gridcell", { name, exact: true });

// The list of emoji is asked for when a picker is first drawn, and its
// rows are laid out once there's a width to lay them out in.
async function ready(within: Locator | Page) {
  await expect(list(within)).not.toHaveAttribute("aria-busy", "true");
  await expect
    .poll(async () => Number(await list(within).getAttribute("aria-colcount")))
    .toBeGreaterThan(1);
}

test.describe("emoji start page", () => {
  test("says what to install, that the emoji are the device's, and leads to the component", async ({
    page,
  }) => {
    await open(page, "/docs/emoji");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/emoji @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "EmojiPicker", exact: true }).first(),
    ).toHaveAttribute("href", "/docs/emoji/emoji-picker");
    await expect(
      article.getByRole("heading", { name: "The device's own emoji" }),
    ).toBeVisible();
    await ready(preview(page, "emoji-picker/basic"));
  });
});

test.describe("emoji picker page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/emoji/emoji-picker");
  });

  test("it's a search box over a list of emoji, each named, with the groups under it", async ({
    page,
  }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);

    await expect(search(area)).toBeVisible();
    await expect(emoji(area, "grinning face")).toHaveText("😀");
    await expect(
      area
        .getByRole("navigation", { name: "Emoji groups" })
        .getByRole("button", { name: "Smileys and emotion" }),
    ).toHaveAttribute("aria-current", "true");
  });

  test("of all the emoji there are, only the rows in view are in the page", async ({
    page,
  }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);

    expect(
      Number(await list(area).getAttribute("aria-rowcount")),
    ).toBeGreaterThan(100);
    expect(await list(area).getByRole("gridcell").count()).toBeLessThan(300);
  });

  test("a search finds an emoji by its name, and a press picks it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);
    await expect(area.getByRole("status").last()).toHaveText(
      "Nothing picked yet",
    );

    await search(area).fill("pizza");
    await expect(
      area.getByRole("status").filter({ hasText: "emoji found" }),
    ).toHaveText("1 emoji found");
    await press(emoji(area, "pizza"), isMobile);

    await expect(area.getByRole("status").last()).toHaveText("You picked 🍕");
  });

  test("Enter in the search box picks the first emoji found", async ({
    page,
  }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);

    await search(area).fill("rocket");
    await expect(emoji(area, "rocket")).toBeVisible();
    await search(area).press("Enter");

    await expect(area.getByRole("status").last()).toHaveText("You picked 🚀");
  });

  test("a search that finds nothing says so", async ({ page }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);

    await search(area).fill("zzzz");

    await expect(area.locator(".nuv-emoji-picker__note")).toHaveText(
      "No emoji found",
    );
    await expect(list(area)).toBeHidden();
  });

  test("the arrow keys move over the list, and Enter picks", async ({
    page,
    isMobile,
  }) => {
    // A phone has no arrow keys.
    test.skip(isMobile);
    const area = preview(page, "emoji-picker/basic");
    await ready(area);

    await search(area).fill("face");
    await search(area).press("ArrowDown");
    await expect(list(area)).toBeFocused();
    const first = await list(area).getAttribute("aria-activedescendant");
    await page.keyboard.press("ArrowRight");
    await expect(list(area)).not.toHaveAttribute(
      "aria-activedescendant",
      first ?? "",
    );

    await page.keyboard.press("Enter");
    await expect(area.getByRole("status").last()).toHaveText(/^You picked ./);
  });

  test("a group's button goes to its group, and is marked while it's in view", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);
    const food = area
      .getByRole("navigation", { name: "Emoji groups" })
      .getByRole("button", { name: "Food and drink" });

    await press(food, isMobile);

    await expect(food).toHaveAttribute("aria-current", "true");
    await expect(
      list(area).getByRole("columnheader", { name: "Food and drink" }),
    ).toBeVisible();
  });

  test("a skin tone that's chosen is drawn on the emoji that have one", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-picker/basic");
    await ready(area);
    await search(area).fill("waving hand");
    await expect(emoji(area, "waving hand")).toHaveText("👋");

    await press(area.getByRole("button", { name: /^Skin tone/ }), isMobile);
    await press(
      page.getByRole("menuitemradio", { name: "Medium", exact: true }),
      isMobile,
    );

    await expect(emoji(area, "waving hand")).toHaveText("👋🏽");
    await expect(
      area.getByRole("button", { name: "Skin tone: Medium" }),
    ).toBeVisible();
  });

  test("in a popover the caret is in the search box, and picking closes it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-picker/popover");
    await press(area.getByRole("button", { name: "Add an emoji" }), isMobile);
    const panel = page.getByRole("dialog", { name: "Pick an emoji" });
    await ready(panel);
    await expect(search(panel)).toBeFocused();

    await search(panel).fill("party popper");
    await expect(emoji(panel, "party popper")).toBeVisible();
    await search(panel).press("Enter");

    await expect(area.locator("[data-text]")).toHaveText("Shipped 🎉");
    await expect(panel).toBeHidden();
  });

  test("recent emoji and a skin tone kept by the app are what's drawn, and the app is told of a pick", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-picker/kept");
    await ready(area);

    await expect(list(area).getByRole("columnheader").first()).toHaveText(
      "Recently used",
    );
    await expect(list(area).getByRole("gridcell").first()).toHaveText("👍🏽");

    await search(area).fill("pizza");
    await press(emoji(area, "pizza"), isMobile);

    await expect(area.locator("[data-kept]")).toContainText("🍕 👍 🎉 🚀");
  });

  test("a list of your own is all there is, in the language it's in", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-picker/data");
    const own = area.getByRole("grid", { name: "Emoji's" });
    await expect(own.getByRole("gridcell")).toHaveCount(7);
    await expect(
      area.getByRole("searchbox", { name: "Emoji zoeken" }),
    ).toBeVisible();

    await press(own.getByRole("gridcell", { name: "rood hart" }), isMobile);

    await expect(area.getByRole("status").last()).toContainText("rood hart");
  });

  test("the playground changes which emoji are listed, and the code with them", async ({
    page,
  }) => {
    const area = playground(page);
    await ready(area);
    await expect(area.locator("pre")).toContainText("storageKey={null}");

    await area.getByLabel("flags").uncheck();
    await area.getByLabel("emojiVersion").selectOption("16");

    await expect(area.locator("pre")).toContainText("emojiVersion={16}");
    await expect(area.locator("pre")).toContainText("flags={false}");
    await expect(
      area
        .getByRole("navigation", { name: "Emoji groups" })
        .getByRole("button", { name: "Flags" }),
    ).toHaveCount(0);
  });

  test("on a narrow screen the picker fits and the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const area = preview(page, "emoji-picker/basic");
    await ready(area);
    const box = await area.locator(".nuv-emoji-picker").boundingBox();

    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });

  test("the examples pass axe", async ({ page }) => {
    await ready(preview(page, "emoji-picker/basic"));
    await ready(preview(page, "emoji-picker/kept"));

    expect(
      (
        await new AxeBuilder({ page })
          .include("[data-preview]")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
});
