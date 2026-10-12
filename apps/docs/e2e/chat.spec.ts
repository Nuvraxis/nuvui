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
  test("says what to install and names the twelve components", async ({
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
      ["Markdown", "markdown"],
      ["CodeBlock", "code-block"],
      ["PromptInput", "prompt-input"],
      ["PromptSuggestion", "prompt-suggestion"],
      ["Attachment", "attachment"],
      ["Source", "source"],
      ["ToolCall", "tool-call"],
      ["Reasoning", "reasoning"],
      ["ThreadList", "thread-list"],
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

    // The dots are there for a seventh of a second, too short to be
    // looked for. The playground's test below sees them.
    await expect(message).toHaveAttribute("aria-busy", "true");
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

// A picture a pixel wide, and two small files that aren't one.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const picture = (name: string, copies = 1) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.concat(Array.from({ length: copies }, () => png)),
});
const pdf = { name: "terms.pdf", mimeType: "application/pdf", buffer: png };
const text = { name: "notes.txt", mimeType: "text/plain", buffer: png };

test.describe("prompt input page, files", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/prompt-input");
  });

  const area = (page: Page) => preview(page, "prompt-input/files");
  const picker = (page: Page) => area(page).locator('input[type="file"]');
  const waiting = (page: Page) =>
    area(page).getByRole("list", { name: "Files to send" });

  test("picked files wait in the box, one that isn't allowed is turned away with a reason, and a picture shows itself", async ({
    page,
  }) => {
    await expect(
      area(page).getByRole("button", { name: "Attach files" }),
    ).toBeVisible();
    await expect(waiting(page)).toHaveCount(0);

    await picker(page).setInputFiles([picture("shot.png"), pdf, text]);

    await expect(waiting(page).getByRole("listitem")).toHaveCount(2);
    await expect(waiting(page).locator(".nuv-attachment__name")).toHaveText([
      "shot.png",
      "terms.pdf",
    ]);
    await expect(area(page).getByRole("alert")).toHaveText(
      "notes.txt isn't a picture or a PDF.",
    );
    await expect(waiting(page).locator(".nuv-attachment__image")).toHaveCount(
      1,
    );
    await expect(area(page).locator(".nuv-prompt-input__status")).toHaveText(
      "2 files attached",
    );
  });

  test("a file is taken out by its button, and focus goes to the field", async ({
    page,
    isMobile,
  }) => {
    await picker(page).setInputFiles([picture("shot.png"), pdf]);

    await press(
      area(page).getByRole("button", { name: "Remove shot.png" }),
      isMobile,
    );

    await expect(waiting(page).locator(".nuv-attachment__name")).toHaveText([
      "terms.pdf",
    ]);
    await expect(
      area(page).getByRole("textbox", { name: "Message" }),
    ).toBeFocused();
    await expect(area(page).locator(".nuv-prompt-input__status")).toHaveText(
      "1 file attached",
    );
  });

  test("one more than three is turned away, and the rest are sent with no text", async ({
    page,
    isMobile,
  }) => {
    await expect(send(area(page))).toHaveAttribute("aria-disabled", "true");

    await picker(page).setInputFiles([
      picture("a.png"),
      picture("b.png", 2),
      picture("c.png", 3),
      picture("d.png", 4),
    ]);

    await expect(waiting(page).getByRole("listitem")).toHaveCount(3);
    await expect(area(page).getByRole("alert")).toHaveText(
      "d.png is one more than three.",
    );
    await expect(send(area(page))).not.toHaveAttribute("aria-disabled", "true");
    await press(send(area(page)), isMobile);

    await expect(area(page).getByRole("status").last()).toHaveText(
      'Sent "" with 3 files.',
    );
    await expect(waiting(page)).toHaveCount(0);
  });

  test("the files wrap inside the box, and nothing is wider than the page", async ({
    page,
  }) => {
    await picker(page).setInputFiles([
      picture("a-picture-with-quite-a-long-name-to-it.png"),
      picture("another-picture-with-a-long-name.png", 2),
      pdf,
    ]);
    await expect(waiting(page).getByRole("listitem")).toHaveCount(3);
    const box = await area(page).locator(".nuv-prompt-input").boundingBox();

    for (const item of await waiting(page).getByRole("listitem").all()) {
      const file = await item.boundingBox();
      expect((file?.x ?? 0) + (file?.width ?? 0)).toBeLessThanOrEqual(
        (box?.x ?? 0) + (box?.width ?? 0),
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});

test.describe("attachment page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/attachment");
  });

  test("the files of a message are a named list of links, one with its picture", async ({
    page,
  }) => {
    const area = preview(page, "attachment/basic");
    const list = area.getByRole("list", { name: "Files with this message" });

    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(
      list.getByRole("link", { name: "october-invoices.pdf" }),
    ).toHaveAttribute("href", "#october-invoices");
    await expect(list.locator(".nuv-attachment__image")).toHaveCount(1);
    // In the person's own message, so at the end of the row.
    const row = await area.locator(".nuv-message").boundingBox();
    const files = await list.boundingBox();
    expect(
      Math.abs(
        (files?.x ?? 0) +
          (files?.width ?? 0) -
          ((row?.x ?? 0) + (row?.width ?? 0)),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("one is uploading, one failed and says why, and a button takes each out", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "attachment/states");
    const list = area.getByRole("list", { name: "Files to send" });

    await expect(list.locator('[aria-busy="true"]')).toHaveText(
      /site-photos\.zip\s*Uploading/,
    );
    await expect(list.locator("[data-error]")).toContainText(
      "Too large. The limit is 25 MB.",
    );

    await press(
      list.getByRole("button", { name: "Remove scan-0042.tiff" }),
      isMobile,
    );

    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(area.getByRole("status")).toHaveText("2 of 3 files left.");
  });
});

test.describe("source page", () => {
  test("the sources are closed until asked for, then a numbered list of links, each with where it's from", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/chat/source");
    const area = preview(page, "source/basic");
    const trigger = area.getByRole("button", { name: "3 sources" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(area.getByRole("link")).toHaveCount(0);

    await press(trigger, isMobile);

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(area.getByRole("list").getByRole("listitem")).toHaveCount(3);
    await expect(
      area.getByRole("link", { name: /Payment terms/ }),
    ).toHaveAttribute("href", "https://example.com/help/payment-terms");
    await expect(area.locator(".nuv-source__site")).toHaveText([
      "example.com",
      "example.com",
      "Your workspace",
    ]);

    await press(trigger, isMobile);
    await expect(area.getByRole("link")).toHaveCount(0);
  });

  test("the keyboard opens the list and reaches each source", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, "a phone has no Tab key");
    test.skip(
      browserName === "webkit",
      "Safari leaves links out of the Tab order until its owner turns that on",
    );
    await open(page, "/docs/chat/source");
    const area = preview(page, "source/basic");
    const trigger = area.getByRole("button", { name: "3 sources" });

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(area.getByRole("link")).toHaveCount(3);
    await page.keyboard.press("Tab");

    await expect(area.getByRole("link").first()).toBeFocused();
  });
});

test.describe("tool call page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/tool-call");
  });

  test("each card says its tool and where the call stands, and opens to what was asked and what came back", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "tool-call/basic");
    const done = area.getByRole("button", { name: "Search invoices Done" });
    const failed = area.getByRole("button", {
      name: "Read the bank feed Failed",
    });

    await expect(done).toHaveAttribute("aria-expanded", "true");
    await expect(
      area.getByRole("button", { name: "Look up the customer Running" }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(area.getByRole("group", { name: "Result" })).toContainText(
      '"number": "INV-1042"',
    );

    await press(failed, isMobile);

    await expect(failed).toHaveAttribute("aria-expanded", "true");
    await expect(area.locator(".nuv-tool-call__error")).toHaveText(
      "The bank didn't answer within 30 seconds.",
    );
  });

  test("a call that waits shows its question with the card closed, and approving runs it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "tool-call/approval");
    const card = area.locator(".nuv-tool-call__trigger");
    const approval = area.getByRole("group", { name: "Approval" });

    await expect(card).toHaveText(/Send a reminder\s*Needs approval/);
    await expect(card).toHaveAttribute("aria-expanded", "false");
    await expect(approval).toContainText(
      "Send a reminder for INV-1042 to Contoso?",
    );

    await press(approval.getByRole("button", { name: "Approve" }), isMobile);

    await expect(card).toHaveText(/Send a reminder\s*Running/);
    await expect(approval).toHaveCount(0);
    await expect(card).toHaveText(/Send a reminder\s*Done/);
    await press(card, isMobile);
    await expect(area.getByRole("group", { name: "Result" })).toHaveText(
      "Sent at 10:42.",
    );
  });

  test("the keyboard approves, and focus is on the card after and not lost", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no Tab key");
    const area = preview(page, "tool-call/approval");
    const card = area.locator(".nuv-tool-call__trigger");

    await area.getByRole("button", { name: "Approve" }).focus();
    await page.keyboard.press("Enter");

    await expect(card).toBeFocused();
    await expect(area.getByRole("group", { name: "Approval" })).toHaveCount(0);
  });

  test("denying says so, and nothing runs", async ({ page, isMobile }) => {
    const area = preview(page, "tool-call/approval");

    await press(area.getByRole("button", { name: "Deny" }), isMobile);

    await expect(area.locator(".nuv-tool-call__trigger")).toHaveText(
      /Send a reminder\s*Denied/,
    );
    await expect(area.getByRole("group", { name: "Approval" })).toHaveCount(0);
  });
});

test.describe("reasoning page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/reasoning");
  });

  test("the steps are a list under a line that closes and opens them", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "reasoning/basic");
    const trigger = area.getByRole("button", { name: "Thought for 6 seconds" });

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(area.getByRole("listitem")).toHaveCount(3);

    await press(trigger, isMobile);

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(area.getByRole("listitem")).toHaveCount(0);
  });

  test("while the assistant works the steps are open and arrive one by one, and they close when the reply is there", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "reasoning/streaming");
    const trigger = area.locator(".nuv-reasoning__trigger");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await press(area.getByRole("button", { name: "Ask again" }), isMobile);

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveText("Thinking");
    await expect(area.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(area.locator('.nuv-message[aria-busy="true"]')).toHaveCount(1);
    // Until it's done.
    await expect(trigger).toHaveText("Thought for 3 seconds", {
      timeout: 15_000,
    });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(area.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(area.locator(".nuv-message__content")).toContainText(
      "Two invoices are overdue",
    );
  });

  test("closed by the reader while it works, and opened again, they stay open when it's done", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "reasoning/streaming");
    const trigger = area.locator(".nuv-reasoning__trigger");

    await press(area.getByRole("button", { name: "Ask again" }), isMobile);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await press(trigger, isMobile);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await press(trigger, isMobile);

    await expect(trigger).toHaveText("Thought for 3 seconds", {
      timeout: 15_000,
    });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(area.getByRole("listitem")).toHaveCount(3);
  });
});

test.describe("thread list page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/thread-list");
  });

  const area = (page: Page) => preview(page, "thread-list/basic");
  const list = (page: Page) =>
    area(page).getByRole("grid", { name: "Conversations" });

  test("the conversations are rows under two headings, one is open, and a press opens another", async ({
    page,
    isMobile,
  }) => {
    await expect(list(page).getByRole("row")).toHaveCount(4);
    await expect(list(page).getByRole("rowgroup")).toHaveCount(2);
    await expect(list(page).locator(".nuv-thread-list__heading")).toHaveText([
      "Today",
      "Yesterday",
    ]);
    await expect(list(page).locator('[aria-selected="true"]')).toHaveText(
      "Overdue invoices for Contoso",
    );

    await press(
      list(page).getByRole("row", { name: /What our payment terms say/ }),
      isMobile,
    );

    await expect(area(page).getByRole("status")).toHaveText(
      "Open: What our payment terms say",
    );
    await expect(list(page).locator('[aria-selected="true"]')).toHaveCount(1);
  });

  test("a long title is cut short and the list stays as wide as it was", async ({
    page,
  }) => {
    const row = list(page).getByRole("row").nth(3);
    const title = row.locator(".nuv-thread-list__title");

    expect(
      await title.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    const box = await list(page).boundingBox();
    const size = await row.boundingBox();
    expect((size?.x ?? 0) + (size?.width ?? 0)).toBeLessThanOrEqual(
      (box?.x ?? 0) + (box?.width ?? 0) + 0.5,
    );
  });

  test("the arrows move without opening, Enter opens, and Tab goes into the row's button and then out", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no arrow keys");
    const rows = list(page).getByRole("row");

    await rows.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    await expect(rows.nth(1)).toBeFocused();
    await expect(area(page).getByRole("status")).toHaveText(
      "Open: Overdue invoices for Contoso",
    );

    await page.keyboard.press("Enter");
    await expect(area(page).getByRole("status")).toHaveText(
      "Open: Draft a payment reminder",
    );

    await page.keyboard.press("Tab");
    await expect(
      list(page).getByRole("button", {
        name: "Delete Draft a payment reminder",
      }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => document.activeElement?.closest('[role="grid"]') === null,
      ),
    ).toBe(true);
  });

  test("a row's button does its own work: the row goes, and no other is opened by it", async ({
    page,
    isMobile,
  }) => {
    await press(
      list(page).getByRole("button", {
        name: "Delete What our payment terms say",
      }),
      isMobile,
    );

    await expect(list(page).getByRole("row")).toHaveCount(3);
    await expect(area(page).getByRole("status")).toHaveText(
      "Open: Overdue invoices for Contoso",
    );
  });
});

test.describe("markdown page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/markdown");
  });

  test("a reply's markdown is headings, a table, a list and code, with the heading moved under the page's own", async ({
    page,
  }) => {
    const area = preview(page, "markdown/basic");
    const reply = area.locator(".nuv-markdown");

    await expect(
      reply.getByRole("heading", {
        level: 3,
        name: "Two invoices are overdue",
      }),
    ).toBeVisible();
    await expect(reply.locator("strong")).toHaveText("Contoso");
    await expect(reply.getByRole("link", { name: "late fee" })).toHaveAttribute(
      "href",
      "#late-fees",
    );
    await expect(reply.getByRole("columnheader")).toHaveText([
      "Invoice",
      "Amount",
      "Days late",
    ]);
    await expect(reply.getByRole("row")).toHaveCount(3);
    await expect(reply.locator("ol > li")).toHaveCount(2);
    await expect(reply.locator("li code").first()).toHaveText("INV-1042");
    await expect(reply.locator(".nuv-code-block")).toHaveAttribute(
      "data-language",
      "ts",
    );
    // No marks left on the page as text.
    await expect(reply).not.toContainText("**");
    await expect(reply).not.toContainText("```");
  });

  test("its block of code is colored once Shiki has loaded, and the text is the same code", async ({
    page,
  }) => {
    const block = preview(page, "markdown/basic").locator(".nuv-code-block");

    await expect(block).toHaveAttribute("data-highlighted", "", {
      timeout: 20_000,
    });
    await expect(block.locator(".nuv-code-block__code")).toContainText(
      "const overdue = invoices.filter(",
    );
    // A keyword and a string are two colors, and neither is the plain one.
    const colors = await block
      .locator(".nuv-code-block__code span span")
      .evaluateAll((tokens) => [
        ...new Set(tokens.map((token) => getComputedStyle(token).color)),
      ]);
    expect(colors.length).toBeGreaterThanOrEqual(3);
  });

  test("text that's arriving is drawn as what it's about to be, and whole once it's all there", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "markdown/streaming");
    const reply = area.locator(".nuv-markdown");
    await expect(reply.locator(".nuv-code-block")).toHaveCount(1);

    await press(area.getByRole("button", { name: "Write it again" }), isMobile);

    // While it arrives the message is busy, and no loose mark is shown.
    await expect(area.locator('.nuv-message[aria-busy="true"]')).toHaveCount(1);
    await expect(reply.locator("strong").first()).toBeVisible();
    await expect(reply).not.toContainText("**");
    // The block of code is a block before its last line has come.
    await expect(reply.locator(".nuv-code-block")).toHaveCount(1);
    await expect(area.locator('[aria-busy="true"]')).toHaveCount(1);

    await expect(area.locator('[aria-busy="true"]')).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(reply.locator("del")).toHaveText("day 40");
    await expect(
      reply.getByRole("link", { name: "payment terms" }),
    ).toHaveAttribute("href", "#payment-terms");
    await expect(reply.locator(".nuv-code-block__code")).toContainText(
      "return Date.now() > due.getTime();",
    );
  });

  test("nothing is wider than the page, while it arrives and after", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "markdown/streaming");
    const wide = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );

    expect(await wide()).toBe(false);
    await press(area.getByRole("button", { name: "Write it again" }), isMobile);
    await expect(area.locator(".nuv-code-block")).toHaveCount(1);
    expect(await wide()).toBe(false);
  });
});

test.describe("code block page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/chat/code-block");
  });

  test("code has its language over it, or a title in its place, and scrolls in a named box", async ({
    page,
  }) => {
    const area = preview(page, "code-block/basic");
    const blocks = area.locator(".nuv-code-block");

    await expect(blocks).toHaveCount(2);
    await expect(blocks.nth(0).locator(".nuv-code-block__title")).toHaveText(
      "ts",
    );
    await expect(blocks.nth(1).locator(".nuv-code-block__title")).toHaveText(
      "Terminal",
    );
    await expect(blocks.nth(1)).toHaveAttribute("data-language", "sh");
    await expect(area.getByRole("group", { name: "Code" })).toHaveCount(2);
    await expect(blocks.nth(1).locator(".nuv-code-block__code")).toHaveText(
      "pnpm add @nuvui/chat @nuvui/react",
    );
  });

  test("the one with a highlighter is colored, and the one without stays in one color", async ({
    page,
  }) => {
    const blocks = preview(page, "code-block/basic").locator(".nuv-code-block");

    await expect(blocks.nth(0)).toHaveAttribute("data-highlighted", "", {
      timeout: 20_000,
    });
    await expect(blocks.nth(1)).not.toHaveAttribute("data-highlighted");
    await expect(
      blocks.nth(1).locator(".nuv-code-block__code span"),
    ).toHaveCount(0);
  });

  test("the button copies the code and says so", async ({
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
    const block = preview(page, "code-block/basic")
      .locator(".nuv-code-block")
      .nth(1);

    await press(block.getByRole("button", { name: "Copy code" }), isMobile);

    await expect(block.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(block.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "pnpm add @nuvui/chat @nuvui/react",
    );
    await expect(block.getByRole("button", { name: "Copy code" })).toBeVisible({
      timeout: 5000,
    });
  });
});
