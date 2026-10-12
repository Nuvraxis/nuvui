import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const text = (within: Locator) => within.locator('[role="textbox"]').first();
const tool = (within: Locator, name: string) =>
  within
    .getByRole("toolbar", { name: "Formatting" })
    .getByRole("button", { name, exact: true });

// The editor is made once the page is in a browser, a moment after the
// rest of it. A test waits for the text to be there to write in.
async function ready(within: Locator) {
  await expect(text(within)).toHaveAttribute("contenteditable", /true|false/);
  await within.scrollIntoViewIfNeeded();
}

// Everything in the text selected: by the editor's shortcut, and on a
// phone, which has no keys to hold down, by the selection a finger would
// make.
async function selectAll(page: Page, within: Locator) {
  const phone = await page.evaluate(() => /iPhone/.test(navigator.userAgent));
  if (phone) {
    await text(within).selectText();
    return;
  }
  await text(within).click();
  await page.keyboard.press("ControlOrMeta+a");
}

test.describe("editor start page", () => {
  test("says what to install, that it's HTML, and leads to the component", async ({
    page,
  }) => {
    await open(page, "/docs/editor");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/editor @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article
        .getByRole("link", { name: "RichTextEditor", exact: true })
        .first(),
    ).toHaveAttribute("href", "/docs/editor/rich-text-editor");
    await expect(
      article.getByRole("heading", { name: "Sanitize before you show it" }),
    ).toBeVisible();
    await ready(preview(page, "rich-text-editor/basic"));
  });
});

test.describe("rich text editor page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/editor/rich-text-editor");
  });

  test("it's a named textbox under a named toolbar, with the text it was given", async ({
    page,
  }) => {
    const area = preview(page, "rich-text-editor/basic");
    await ready(area);

    await expect(
      area.getByRole("textbox", { name: "Note to the customer" }),
    ).toContainText("It ships on Monday.");
    await expect(text(area).locator("strong")).toHaveText("Monday");
    await expect(tool(area, "Bold")).toBeVisible();
    await expect(tool(area, "Undo")).toBeDisabled();
  });

  test("a toggle formats what's selected, says it's on, and leaves the caret in the text", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);
    await selectAll(page, area);

    await press(tool(area, "Italic"), isMobile);

    await expect(tool(area, "Italic")).toHaveAttribute("aria-pressed", "true");
    await expect(area.locator("pre[data-html]")).toContainText("<em>");
    await expect(text(area)).toBeFocused();
  });

  test("what's typed is reported as HTML with its count, and putting it back replaces the text", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);
    await expect(area.getByRole("status")).toHaveText("8 words");

    await selectAll(page, area);
    await page.keyboard.type("Paid in full");
    await expect(area.locator("pre[data-html]")).toHaveText(
      "<p>Paid in full</p>",
    );
    await expect(area.getByRole("status")).toHaveText("3 words");

    await press(area.getByRole("button", { name: "Put it back" }), isMobile);
    await expect(text(area)).toContainText("Payment is due 30 days");
  });

  test("typing a hyphen and a space at the start of a line makes a list", async ({
    page,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);
    await selectAll(page, area);

    await page.keyboard.type("- One");
    await expect(area.locator("pre[data-html]")).toHaveText(
      "<ul><li><p>One</p></li></ul>",
    );
    await expect(tool(area, "Bulleted list")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("typing two hashes and a space at the start of a line makes a heading", async ({
    page,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);
    await selectAll(page, area);

    await page.keyboard.type("## Title");
    await expect(area.locator("pre[data-html]")).toHaveText("<h2>Title</h2>");
  });

  test("the link button takes an address and makes what's selected a link", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);
    await selectAll(page, area);

    await press(tool(area, "Link"), isMobile);
    const address = page.getByRole("textbox", { name: "Web address" });
    await address.fill("example.com/terms");
    await address.press("Enter");

    await expect(text(area).locator("a")).toHaveAttribute(
      "href",
      "https://example.com/terms",
    );
    await expect(address).toBeHidden();
  });

  test("an address that would run something is refused", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);
    await selectAll(page, area);

    await press(tool(area, "Link"), isMobile);
    const address = page.getByRole("textbox", { name: "Web address" });
    await address.fill("javascript:alert(1)");
    await address.press("Enter");

    await expect(
      page.getByText(
        "Enter a web address, an email address or a phone number.",
      ),
    ).toBeVisible();
    await expect(text(area).locator("a")).toHaveCount(0);
  });

  test("with a limit, typing stops there and the count says so", async ({
    page,
  }) => {
    const area = preview(page, "rich-text-editor/limit");
    await ready(area);
    const count = area.locator(".nuv-rich-text-editor__count");
    await expect(count).toHaveText("25 of 140 characters");

    await selectAll(page, area);
    await page.keyboard.type("x".repeat(150));

    await expect(count).toHaveText("140 of 140 characters");
    await expect(count).toHaveAttribute("data-full", "");
    expect((await text(area).textContent())?.length).toBe(140);
  });

  test("in a form the HTML is what's sent, and sending nothing says what's missing", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rich-text-editor/form");
    await ready(area);
    const reply = area.getByRole("textbox", { name: "Reply" });

    await press(area.getByRole("button", { name: "Send" }), isMobile);
    await expect(
      area.getByText("Write a reply before you send it."),
    ).toBeVisible();
    await expect(reply).toHaveAttribute("aria-invalid", "true");

    await reply.click();
    await page.keyboard.type("On its way");
    await expect(reply).not.toHaveAttribute("aria-invalid", "true");
    await press(area.getByRole("button", { name: "Send" }), isMobile);

    await expect(area.getByRole("status")).toHaveText(
      "Sent: <p>On its way</p>",
    );
  });

  test("a toolbar of your own has only what you gave it", async ({ page }) => {
    const area = preview(page, "rich-text-editor/parts");
    await ready(area);
    const bar = area.getByRole("toolbar", { name: "Formatting" });

    await expect(bar.getByRole("button")).toHaveCount(6);
    await expect(bar.getByRole("button", { name: /Heading/ })).toHaveCount(0);
    await expect(area.locator(".nuv-rich-text-editor__count")).toHaveText(
      "0 characters",
    );
  });

  test("the menu on the selection is there when it's added, and formats what's selected", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "rich-text-editor/bubble");
    await ready(area);
    const menu = page.getByRole("toolbar", { name: "Format the selection" });
    await expect(area.getByRole("toolbar", { name: "Formatting" })).toHaveCount(
      0,
    );
    await expect(menu).toHaveCount(0);

    await selectAll(page, area);
    await expect(menu).toBeVisible();
    await press(
      menu.getByRole("button", { name: "Bold", exact: true }),
      isMobile,
    );

    await expect(text(area).locator("strong")).toHaveText(
      "Select a few of these words to format them.",
    );
  });

  test("under a toolbar there's no menu on the selection to cover it", async ({
    page,
  }) => {
    const area = preview(page, "rich-text-editor/controlled");
    await ready(area);

    await selectAll(page, area);

    await expect(tool(area, "Link")).toBeVisible();
    await expect(
      page.getByRole("toolbar", { name: "Format the selection" }),
    ).toHaveCount(0);
  });

  test("read only, the text is shown and can't be changed", async ({
    page,
  }) => {
    const area = preview(page, "rich-text-editor/read-only");
    await ready(area);
    const saved = area.getByRole("textbox", {
      name: "Payment terms, as saved",
    });

    await expect(saved).toHaveAttribute("contenteditable", "false");
    await expect(saved).toHaveAttribute("aria-readonly", "true");
    await expect(saved.locator("h3")).toHaveText("Late payments");
    await expect(area.getByRole("toolbar")).toHaveCount(0);
  });

  test("the playground turns it off, makes it read only, and gives it a limit", async ({
    page,
  }) => {
    const area = playground(page);
    await ready(area);
    await expect(text(area)).toHaveAttribute("contenteditable", "true");
    await expect(area.locator(".nuv-rich-text-editor__count")).toHaveCount(0);

    await area.getByLabel("maxLength").check();
    await expect(area.locator(".nuv-rich-text-editor__count")).toHaveText(
      "0 of 140 characters",
    );

    await area.getByLabel("disabled").check();
    await expect(text(area)).toHaveAttribute("contenteditable", "false");
    await expect(tool(area, "Bold")).toBeDisabled();
    await expect(area.locator("pre").first()).toContainText("disabled");
    await area.getByLabel("disabled").uncheck();

    await area.getByLabel("readOnly").check();
    await expect(text(area)).toHaveAttribute("aria-readonly", "true");
  });

  test("on a narrow screen the toolbar wraps and the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const area = preview(page, "rich-text-editor/basic");
    await ready(area);
    const first = await tool(area, "Bold").boundingBox();
    const last = await tool(area, "Redo").boundingBox();

    expect(last?.y).toBeGreaterThan(first?.y ?? 0);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });

  test("the examples pass axe", async ({ page }) => {
    await ready(preview(page, "rich-text-editor/read-only"));

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
