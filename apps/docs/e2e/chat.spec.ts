import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
// How far the end of the messages is below what's in view.
const gap = (log: Locator) =>
  log.evaluate((box) =>
    Math.round(box.scrollHeight - box.scrollTop - box.clientHeight),
  );
const send = (within: Locator) => within.getByRole("button", { name: "Send" });

test.describe("chat start page", () => {
  test("says what to install and names the five components", async ({
    page,
  }) => {
    await open(page, "/docs/chat");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/chat @nuvui/react").first(),
    ).toBeVisible();
    for (const [name, address] of [
      ["Conversation", "conversation"],
      ["Message", "message"],
      ["MessageLoader", "message-loader"],
      ["PromptInput", "prompt-input"],
      ["PromptSuggestion", "prompt-suggestion"],
    ]) {
      await expect(
        article.getByRole("link", { name: name ?? "", exact: true }),
      ).toHaveAttribute("href", `/docs/chat/${address}`);
    }
  });
});

test.describe("conversation page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/conversation");
  });

  test("a message that's sent is added, the reply arrives marked as busy, and the end stays in view", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "conversation/basic");
    const log = area.getByRole("log", { name: "Billing questions" });
    const field = area.getByRole("textbox", { name: "Message" });
    await expect(log.locator(".nuv-message")).toHaveCount(4);
    expect(await gap(log)).toBe(0);

    await field.fill("How do I change the day?");
    await press(send(area), isMobile);

    await expect(field).toHaveValue("");
    await expect(
      log.locator('.nuv-message[data-from="user"]').last(),
    ).toHaveText("You: How do I change the day?");
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(area.getByRole("button", { name: "Stop" })).toBeVisible();
    // Until it's done, and then it's a message like the others.
    await expect(send(area)).toBeVisible({ timeout: 15_000 });
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(log.locator(".nuv-message")).toHaveCount(6);
    await expect(log.locator(".nuv-message").last()).toContainText(
      "charged on the day the invoice is sent.",
    );
    expect(await gap(log)).toBe(0);
  });

  test("scrolled up while a reply arrives, the reader is left where they are, and a button goes back", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "conversation/basic");
    const log = area.getByRole("log");
    const button = area.getByRole("button", {
      name: "Go to the latest message",
    });
    await expect(button).toHaveCount(0);

    await area.getByRole("textbox", { name: "Message" }).fill("And then?");
    await press(send(area), isMobile);
    await expect(log.locator(".nuv-message__content").last()).toContainText(
      "first working day of the month",
    );
    await log.evaluate((box) => {
      box.scrollTop = 0;
    });

    await expect(button).toBeVisible();
    await expect(send(area)).toBeVisible({ timeout: 15_000 });
    expect(await log.evaluate((box) => box.scrollTop)).toBe(0);
    // The button is over the messages and clear of the box to write in.
    const over = await button.boundingBox();
    const box = await area.locator(".nuv-prompt-input").boundingBox();
    expect((over?.y ?? 0) + (over?.height ?? 0)).toBeLessThanOrEqual(
      box?.y ?? 0,
    );

    await press(button, isMobile);
    await expect.poll(() => gap(log)).toBe(0);
    await expect(button).toHaveCount(0);
    await expect(log).toBeFocused();
  });

  test("stopping keeps what had arrived, and doesn't send what's waiting", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "conversation/basic");
    const log = area.getByRole("log");
    const field = area.getByRole("textbox", { name: "Message" });

    await field.fill("How do I change the day?");
    await press(send(area), isMobile);
    await expect(log.locator(".nuv-message__content").last()).toContainText(
      "first working day",
    );
    await field.fill("Not sent yet");
    await press(area.getByRole("button", { name: "Stop" }), isMobile);

    await expect(send(area)).toBeVisible();
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(log.locator(".nuv-message")).toHaveCount(6);
    await expect(log.locator(".nuv-message").last()).not.toContainText(
      "charged on the day",
    );
    await expect(field).toHaveValue("Not sent yet");
  });

  test("before any message, a greeting and suggestions sit in the middle, and one starts it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "conversation/empty");
    const log = area.getByRole("log");
    const empty = area.locator(".nuv-conversation__empty");
    const room = await log.boundingBox();
    const inner = await empty.boundingBox();

    expect(
      Math.abs(
        (room?.y ?? 0) +
          (room?.height ?? 0) / 2 -
          ((inner?.y ?? 0) + (inner?.height ?? 0) / 2),
      ),
    ).toBeLessThanOrEqual(1);
    await press(
      area.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );

    await expect(empty).toHaveCount(0);
    await expect(log.locator(".nuv-message")).toHaveText(
      "You: Who hasn't paid yet?",
    );
  });
});

test.describe("message page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/message");
  });

  test("the person's own is at the end of the row and the assistant's at the start, each said with who it's from", async ({
    page,
  }) => {
    const area = preview(page, "message/basic");
    const mine = area.locator('.nuv-message[data-from="user"]');
    const theirs = area.locator('.nuv-message[data-from="assistant"]');
    const row = await mine.boundingBox();
    const bubble = await mine.locator(".nuv-message__content").boundingBox();
    const answer = await theirs.locator(".nuv-message__content").boundingBox();

    await expect(mine).toContainText("You: Can I move an invoice");
    await expect(theirs).toContainText(
      "Assistant: Yes, while it's still a draft.",
    );
    expect(Math.round((row?.x ?? 0) + (row?.width ?? 0))).toBe(
      Math.round((bubble?.x ?? 0) + (bubble?.width ?? 0)),
    );
    expect(Math.round(answer?.x ?? 0)).toBe(Math.round(row?.x ?? 0));
  });

  test("with the name on the page, it isn't said a second time", async ({
    page,
  }) => {
    const area = preview(page, "message/avatar");

    await expect(area.locator(".nuv-message__label")).toHaveCount(0);
    await expect(area.getByText("Ada Lovelace · 09:41")).toBeVisible();
    await expect(area.locator(".nuv-message__avatar").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("the actions are a named group, and one that's pressed does its work", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "message/actions");
    const group = area.getByRole("group", { name: "Message actions" });

    await expect(group.getByRole("button")).toHaveCount(2);
    await expect(group.getByRole("button", { name: "Copy" })).toBeVisible();
    await press(group.getByRole("button", { name: "Try again" }), isMobile);

    await expect(area.getByText("Answer 2")).toBeVisible();
  });

  test("copying shows a tick and says so", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium lets a test allow the clipboard.",
    );
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const area = preview(page, "message/actions");

    await press(area.getByRole("button", { name: "Copy" }), isMobile);

    await expect(area.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(
      area.locator(".nuv-message__actions").getByRole("status"),
    ).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "INV-1042 for Contoso",
    );
    await expect(area.getByRole("button", { name: "Copy" })).toBeVisible();
  });

  test("a reply that's arriving is the dots, then words, and is busy until it's whole", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "message/streaming");
    const message = area.locator(".nuv-message");
    await expect(message).not.toHaveAttribute("aria-busy", "true");

    await press(area.getByRole("button", { name: "Reply again" }), isMobile);

    await expect(message).toHaveAttribute("aria-busy", "true");
    await expect(area.locator(".nuv-message-loader")).toHaveCount(1);
    await expect(area.locator(".nuv-message__content")).toContainText(
      "Revenue",
    );
    await expect(area.locator(".nuv-message-loader")).toHaveCount(0);
    await expect(message).not.toHaveAttribute("aria-busy", "true", {
      timeout: 15_000,
    });
    await expect(message).toContainText("on the Team plan.");
  });

  test("the playground changes whose it is, and shows the wait", async ({
    page,
  }) => {
    const area = playground(page);
    const message = area.locator(".nuv-message");
    await expect(message).toHaveAttribute("data-from", "assistant");

    await area.getByLabel("from").selectOption("user");
    await expect(message).toHaveAttribute("data-from", "user");
    await expect(area.locator("pre").first()).toContainText('from="user"');

    await area.getByLabel("waiting for the reply").check();
    await expect(area.locator(".nuv-message-loader")).toHaveCount(1);
    await expect(message).toHaveAttribute("aria-busy", "true");
  });
});

test.describe("message loader page", () => {
  test("it's dots with words for a screen reader, or with text beside them", async ({
    page,
  }) => {
    await open(page, "/docs/chat/message-loader");
    const loaders = preview(page, "message-loader/basic").locator(
      ".nuv-message-loader",
    );

    await expect(loaders).toHaveCount(2);
    await expect(loaders.first()).toHaveText("Writing a reply");
    await expect(
      loaders.first().locator(".nuv-message-loader__dots"),
    ).toHaveAttribute("aria-hidden", "true");
    await expect(
      loaders.last().getByText("Searching the invoices"),
    ).toBeVisible();
  });
});

test.describe("prompt input page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/prompt-input");
  });

  test("with nothing typed the button is marked as disabled, and what's typed is sent by the button", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "prompt-input/basic");
    const field = area.getByRole("textbox", { name: "Message" });
    await expect(send(area)).toHaveAttribute("aria-disabled", "true");

    await field.fill("Who hasn't paid?");
    await expect(send(area)).not.toHaveAttribute("aria-disabled", "true");
    await press(send(area), isMobile);

    await expect(area.getByRole("status")).toHaveText("Sent: Who hasn't paid?");
    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();
  });

  test("with a keyboard Enter sends and Shift with Enter starts a line, and on a phone Enter starts a line", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "prompt-input/basic");
    const field = area.getByRole("textbox", { name: "Message" });
    await field.focus();

    await page.keyboard.type("One");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("Two");
    await expect(field).toHaveValue("One\nTwo");
    await page.keyboard.press("Enter");

    if (isMobile) {
      await expect(field).toHaveValue("One\nTwo\n");
      await expect(area.getByRole("status")).toHaveText("Nothing sent yet.");
    } else {
      await expect(field).toHaveValue("");
      await expect(area.getByRole("status")).toHaveText("Sent: One\nTwo");
    }
  });

  test("the field grows with its lines, stops at 12rem, and shrinks again", async ({
    page,
  }) => {
    const field = preview(page, "prompt-input/basic").getByRole("textbox", {
      name: "Message",
    });
    const height = async () => (await field.boundingBox())?.height ?? 0;
    const one = await height();

    await field.fill("One\nTwo\nThree");
    expect(await height()).toBeGreaterThan(one + 30);
    await field.fill("line\n".repeat(40));
    expect(await height()).toBe(192);
    await field.fill("");
    expect(await height()).toBe(one);
  });

  test("while it's busy the button stops, and what's typed meanwhile is kept and not sent", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "prompt-input/busy");
    const field = area.getByRole("textbox", { name: "Message" });

    await field.fill("First");
    await press(send(area), isMobile);
    await expect(area.getByRole("status")).toHaveText("Replying to: First");
    const stop = area.getByRole("button", { name: "Stop" });
    await expect(stop).toHaveAttribute("type", "button");

    await field.fill("Second");
    await press(stop, isMobile);

    await expect(area.getByRole("status")).toHaveText("Stopped.");
    await expect(field).toHaveValue("Second");
    await expect(send(area)).toBeVisible();
  });

  test("a button in the row does its own work and sends nothing", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "prompt-input/tools");
    const field = area.getByRole("textbox", { name: "Message" });

    await field.fill("Kept");
    await press(area.getByRole("button", { name: "Clear" }), isMobile);
    await expect(area.getByRole("status")).toHaveText("Cleared.");
    await expect(field).toHaveValue("Kept");

    await area.getByLabel("Where to look").selectOption("Invoices");
    await press(send(area), isMobile);
    await expect(area.getByRole("status")).toHaveText("Asked Invoices: Kept");
  });

  test("text that's kept outside is limited there", async ({ page }) => {
    const area = preview(page, "prompt-input/controlled");
    const field = area.getByRole("textbox", { name: "Message" });

    await field.fill("a".repeat(300));

    await expect(field).toHaveValue("a".repeat(280));
    await expect(area.getByText("0 characters left")).toBeVisible();
    await expect(field).toHaveAccessibleDescription("0 characters left");
  });

  test("the playground makes it busy, with and without a way to stop", async ({
    page,
  }) => {
    const area = playground(page);
    await area.getByRole("textbox", { name: "Message" }).fill("Hello");

    await area.getByLabel("busy").check();
    await expect(area.getByRole("button", { name: "Stop" })).toBeVisible();
    await expect(area.locator("pre").first()).toContainText("onStop={stop}");

    await area.getByLabel("onStop").uncheck();
    await expect(send(area)).toHaveAttribute("aria-disabled", "true");

    await area.getByLabel("disabled").check();
    await expect(area.getByRole("textbox", { name: "Message" })).toBeDisabled();
  });
});

test.describe("prompt suggestion page", () => {
  test("a suggestion goes into the box, to be changed before it's sent", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/chat/prompt-suggestion");
    const area = preview(page, "prompt-suggestion/basic");
    const field = area.getByRole("textbox", { name: "Message" });
    const group = area.getByRole("group", { name: "Suggestions" });

    await expect(group.getByRole("button")).toHaveCount(3);
    await press(
      group.getByRole("button", { name: "Who hasn't paid yet?" }),
      isMobile,
    );

    await expect(field).toHaveValue("Who hasn't paid yet?");
    await expect(field).toBeFocused();
    await expect(send(area)).not.toHaveAttribute("aria-disabled", "true");
  });
});
