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
      article.getByRole("link", { name: "EmojiReaction", exact: true }).first(),
    ).toHaveAttribute("href", "/docs/emoji/emoji-reaction");
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

  test("in a popover with little room the picker is made shorter, and the popover doesn't scroll", async ({
    page,
    isMobile,
  }) => {
    const { width } = page.viewportSize() ?? { width: 1280 };
    await page.setViewportSize({ width, height: 360 });
    const area = preview(page, "emoji-picker/popover");
    await press(area.getByRole("button", { name: "Add an emoji" }), isMobile);
    const panel = page.getByRole("dialog", { name: "Pick an emoji" });
    await ready(panel);

    const over = await panel.locator(".nuv-popover__body").evaluate((body) => ({
      down: body.scrollHeight - body.clientHeight,
      across: body.scrollWidth - body.clientWidth,
    }));
    expect(over.down).toBeLessThanOrEqual(0);
    expect(over.across).toBeLessThanOrEqual(0);
    // All of it is still there: the search over the list, the groups under.
    await expect(search(panel)).toBeInViewport();
    await expect(
      panel.getByRole("navigation", { name: "Emoji groups" }),
    ).toBeInViewport();
  });

  test("with a mouse every group's button fits, and the row doesn't scroll sideways", async ({
    page,
    isMobile,
  }) => {
    // Under a finger the buttons keep their size and the row is dragged.
    test.skip(isMobile);
    const area = preview(page, "emoji-picker/basic");
    await ready(area);
    const groups = area.getByRole("navigation", { name: "Emoji groups" });

    expect(
      await groups.evaluate((row) => row.scrollWidth - row.clientWidth),
    ).toBeLessThanOrEqual(0);
    // The last one is inside the row, at a width that can be pressed.
    const row = await groups.boundingBox();
    const last = await groups.getByRole("button").last().boundingBox();
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeLessThanOrEqual(
      (row?.x ?? 0) + (row?.width ?? 0),
    );
    expect(last?.width ?? 0).toBeGreaterThanOrEqual(24);
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
    const find = area.getByRole("searchbox", { name: "Emoji zoeken" });
    // The faces first, whatever order the list was given in: the groups
    // have Unicode's order.
    await expect(own.getByRole("gridcell").first()).toHaveText("😀");

    // Everything in it that's a face or a hand, which is all it has of
    // either: the list is the seven it was given and no more.
    await find.fill("gezicht");
    await expect(own.getByRole("gridcell")).toHaveCount(2);
    await find.fill("grinning");
    await expect(own).toBeHidden();

    await find.fill("hart");
    await press(own.getByRole("gridcell", { name: "rood hart" }), isMobile);

    await expect(area.getByRole("status").last()).toContainText("rood hart");
  });

  test("the playground changes which emoji are listed, and the code with them", async ({
    page,
  }) => {
    const area = playground(page);
    await ready(area);
    await expect(area.locator("pre")).toContainText("storageKey={null}");

    // By its role, since the group of flags has a button of the same name.
    await area.getByRole("checkbox", { name: "flags" }).uncheck();
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

test.describe("emoji reaction page", () => {
  const reaction = (within: Locator | Page, name: string | RegExp) =>
    within.getByRole("button", { name });

  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/emoji/emoji-reaction");
  });

  test("each is read by its emoji's name and its count, and says whether it's the reader's", async ({
    page,
  }) => {
    const area = preview(page, "emoji-reaction/basic");

    await expect(reaction(area, "party popper, 5")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(reaction(area, "clapping hands, 2")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(reaction(area, "party popper, 5")).toHaveText("🎉5");
  });

  test("a press joins a reaction, and a press on the reader's own takes it away", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-reaction/basic");

    await press(reaction(area, "thumbs up, 11"), isMobile);
    await expect(reaction(area, "thumbs up, 12")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await press(reaction(area, "party popper, 5"), isMobile);
    await expect(reaction(area, "party popper, 4")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("the keys press it", async ({ page, isMobile }) => {
    // A phone has no keys to press it with.
    test.skip(isMobile);
    const area = preview(page, "emoji-reaction/basic");

    await reaction(area, "clapping hands, 2").focus();
    await page.keyboard.press("Enter");
    await expect(reaction(area, "clapping hands, 3")).toBeFocused();

    await page.keyboard.press("Space");
    await expect(reaction(area, "clapping hands, 2")).toBeFocused();
  });

  test("an emoji from the picker is a new reaction, and one that's there is joined", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-reaction/picker");
    const add = area.getByRole("button", { name: "Add reaction" });

    await press(add, isMobile);
    let panel = page.getByRole("dialog", { name: "Pick an emoji" });
    await ready(panel);
    await search(panel).fill("party popper");
    await expect(emoji(panel, "party popper")).toBeVisible();
    await search(panel).press("Enter");
    await expect(reaction(area, "party popper, 1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await press(add, isMobile);
    panel = page.getByRole("dialog", { name: "Pick an emoji" });
    await ready(panel);
    await search(panel).fill("thumbs up");
    await expect(emoji(panel, "thumbs up")).toBeVisible();
    await search(panel).press("Enter");
    await expect(reaction(area, "thumbs up, 3")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(area.locator(".nuv-emoji-reaction")).toHaveCount(2);
  });

  test("the last of a reaction taken away leaves no button, and the focus is on the one that adds", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "emoji-reaction/picker");
    const add = area.getByRole("button", { name: "Add reaction" });
    await press(add, isMobile);
    const panel = page.getByRole("dialog", { name: "Pick an emoji" });
    await ready(panel);
    await search(panel).fill("party popper");
    await expect(emoji(panel, "party popper")).toBeVisible();
    await search(panel).press("Enter");

    await press(reaction(area, "party popper, 1"), isMobile);

    await expect(reaction(area, /party popper/)).toHaveCount(0);
    // A finger leaves no focus to follow.
    if (!isMobile) await expect(add).toBeFocused();
  });

  test("a count written shorter is still read in full, and a disabled one can't be pressed", async ({
    page,
  }) => {
    const area = preview(page, "emoji-reaction/states");

    await expect(reaction(area, "rocket, 1284")).toHaveText("🚀1.3K");
    await expect(reaction(area, "eyes, 3")).toBeDisabled();
  });

  test("the playground changes the button, and the code with it", async ({
    page,
    isMobile,
  }) => {
    const area = playground(page);
    await expect(area.locator("pre")).toContainText("count={3}");

    await press(reaction(area, "thumbs up, 3"), isMobile);
    await expect(area.locator("pre")).toContainText("count={4} pressed");
    await expect(area.getByRole("checkbox", { name: "pressed" })).toBeChecked();

    await area.getByLabel("emoji").selectOption("party popper");
    await expect(reaction(area, "party popper, 4")).toBeVisible();
    await expect(area.locator("pre")).toContainText('label="party popper"');
  });

  test("a reaction is 44 pixels tall under a finger and 32 with a mouse", async ({
    page,
    isMobile,
  }) => {
    const box = await reaction(
      preview(page, "emoji-reaction/basic"),
      "clapping hands, 2",
    ).boundingBox();

    expect(Math.round(box?.height ?? 0)).toBe(isMobile ? 44 : 32);
  });

  test("on a narrow screen the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await expect(
      reaction(preview(page, "emoji-reaction/basic"), "party popper, 5"),
    ).toBeVisible();

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });

  test("the examples pass axe", async ({ page }) => {
    await expect(
      reaction(preview(page, "emoji-reaction/basic"), "party popper, 5"),
    ).toBeVisible();

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
