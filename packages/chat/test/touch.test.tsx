import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Attachment,
  Attachments,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  PromptInput,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
  ThreadList,
  ThreadListItem,
  ToolCall,
  ToolCallApproval,
  ToolCallTrigger,
} from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. What a mouse and a keyboard do is
// checked next to each component.

const rect = (element: Element) => element.getBoundingClientRect();
const field = () =>
  page
    .getByRole("textbox", { name: "Message" })
    .element() as HTMLTextAreaElement;

function Box(props: {
  onSubmit?: (text: string) => void;
  submitOnEnter?: boolean;
}) {
  return (
    <PromptInput onSubmit={props.onSubmit}>
      <PromptInputTextarea
        aria-label="Message"
        submitOnEnter={props.submitOnEnter}
      />
      <PromptInputToolbar>
        <PromptInputSubmit />
      </PromptInputToolbar>
    </PromptInput>
  );
}

test("the button to send is 44px, and the text is 16px so the page doesn't zoom", async () => {
  await render(<Box />);
  const button = rect(page.getByRole("button", { name: "Send" }).element());

  expect(button.width).toBe(44);
  expect(button.height).toBe(44);
  expect(getComputedStyle(field()).fontSize).toBe("16px");
});

test("the text stays 16px whatever the variable for a mouse says", async () => {
  await render(
    <div style={{ "--nuv-prompt-input-font-size": "12px" } as never}>
      <Box />
    </div>,
  );

  expect(getComputedStyle(field()).fontSize).toBe("16px");
});

test("Enter starts a new line, and the button sends", async () => {
  const onSubmit = vi.fn();
  await render(<Box onSubmit={onSubmit} />);
  field().focus();

  await userEvent.keyboard("One{Enter}Two");
  expect(field().value).toBe("One\nTwo");
  expect(onSubmit).not.toHaveBeenCalled();

  await page.getByRole("button", { name: "Send" }).click();
  expect(onSubmit.mock.calls[0]?.[0]).toBe("One\nTwo");
  expect(field().value).toBe("");
});

test("with submitOnEnter, Enter sends here as well", async () => {
  const onSubmit = vi.fn();
  await render(<Box onSubmit={onSubmit} submitOnEnter />);
  field().focus();

  await userEvent.keyboard("Hello{Enter}");

  expect(onSubmit.mock.calls[0]?.[0]).toBe("Hello");
});

test("a press on the box's edge puts the caret in the field", async () => {
  await render(<Box />);
  const row = document.querySelector(
    ".nuv-prompt-input__toolbar",
  ) as HTMLElement;

  await userEvent.click(row, { position: { x: 100, y: 10 } });

  expect(document.activeElement).toBe(field());
});

test("an action under a message and a suggestion are 44px tall", async () => {
  await render(
    <>
      <Message from="assistant">
        <MessageContent>Done.</MessageContent>
        <MessageActions>
          <MessageAction label="Try again">R</MessageAction>
        </MessageActions>
      </Message>
      <PromptSuggestions>
        <PromptSuggestion>Draft a reminder</PromptSuggestion>
      </PromptSuggestions>
    </>,
  );
  const action = rect(
    page.getByRole("button", { name: "Try again" }).element(),
  );

  expect(action.width).toBe(44);
  expect(action.height).toBe(44);
  expect(
    rect(page.getByRole("button", { name: "Draft a reminder" }).element())
      .height,
  ).toBe(44);
});

test("the button to the latest message is 44px, and a press goes there", async () => {
  await render(
    <Conversation style={{ height: 300 }}>
      <ConversationContent aria-label="Support">
        <div style={{ flex: "none", height: 1200 }}>Long</div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>,
  );
  const log = page.getByRole("log").element();
  log.scrollTop = 0;
  const button = page.getByRole("button", { name: "Go to the latest message" });
  await expect.element(button).toBeVisible();

  expect(rect(button.element()).width).toBe(44);
  expect(rect(button.element()).height).toBe(44);
  await button.click();

  await expect
    .poll(
      () => Math.round(log.scrollHeight - log.scrollTop - log.clientHeight),
      { timeout: 3000 },
    )
    .toBe(0);
});

test("on a phone the messages have 16px either side, and nothing is wider than the screen", async () => {
  await render(
    <Conversation style={{ height: 300 }}>
      <ConversationContent aria-label="Support">
        <Message from="user">
          <MessageContent>{"word ".repeat(40)}</MessageContent>
        </Message>
        <Message from="assistant">
          <MessageContent>
            {`https://example.com/${"a".repeat(200)}`}
          </MessageContent>
        </Message>
      </ConversationContent>
    </Conversation>,
  );
  const log = rect(page.getByRole("log").element());
  const message = rect(document.querySelector(".nuv-message") as Element);

  expect(message.left - log.left).toBe(16);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
});

test("the button to attach and the one that takes a file out are 44px", async () => {
  await render(
    <PromptInput defaultFiles={[new File(["x"], "a.txt")]}>
      <PromptInputAttachments />
      <PromptInputTextarea aria-label="Message" />
      <PromptInputToolbar>
        <PromptInputAttach />
        <PromptInputSubmit />
      </PromptInputToolbar>
    </PromptInput>,
  );
  const attach = rect(
    page.getByRole("button", { name: "Attach files" }).element(),
  );
  const remove = rect(
    page.getByRole("button", { name: "Remove a.txt" }).element(),
  );

  expect(attach.width).toBe(44);
  expect(attach.height).toBe(44);
  expect(remove.width).toBe(44);
  expect(remove.height).toBe(44);
});

test("a file in a message has a button of 44px too, and stays inside the screen", async () => {
  await render(
    <Attachments aria-label="Files">
      <Attachment
        name={`${"a-very-long-name-".repeat(8)}.pdf`}
        size={1}
        onRemove={() => {}}
      />
    </Attachments>,
  );
  const button = rect(page.getByRole("button").element());

  expect(button.width).toBe(44);
  expect(button.height).toBe(44);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
});

test("the lines that open sources and reasoning are 44px tall, and a tap opens them", async () => {
  await render(
    <>
      <Sources>
        <SourcesTrigger>1 source</SourcesTrigger>
        <SourcesContent>
          <Source href="https://example.com/a" title="A" />
        </SourcesContent>
      </Sources>
      <Reasoning>
        <ReasoningTrigger />
        <ReasoningContent>It looked.</ReasoningContent>
      </Reasoning>
    </>,
  );
  const sources = page.getByRole("button", { name: "1 source" });
  const reasoning = page.getByRole("button", { name: "Reasoning" });

  expect(rect(sources.element()).height).toBe(44);
  expect(rect(reasoning.element()).height).toBe(44);

  await sources.click();
  await reasoning.click();

  expect(sources.element().getAttribute("aria-expanded")).toBe("true");
  expect(reasoning.element().getAttribute("aria-expanded")).toBe("true");
  expect(rect(page.getByRole("link").element()).height).toBeGreaterThanOrEqual(
    44,
  );
});

test("a tool call's top line and its two buttons are 44px tall", async () => {
  await render(
    <ToolCall status="approval">
      <ToolCallTrigger>Send a reminder</ToolCallTrigger>
      <ToolCallApproval>Send it?</ToolCallApproval>
    </ToolCall>,
  );

  for (const button of page.getByRole("button").elements()) {
    expect(rect(button).height).toBeGreaterThanOrEqual(44);
  }
  expect(page.getByRole("button").elements()).toHaveLength(3);
});

test("a conversation in the list is 44px tall, and a tap opens it", async () => {
  const onValueChange = vi.fn();
  await render(
    <ThreadList aria-label="Conversations" onValueChange={onValueChange}>
      <ThreadListItem value="a">One</ThreadListItem>
      <ThreadListItem value="b">Two</ThreadListItem>
    </ThreadList>,
  );
  const row = page.getByRole("row", { name: "Two" });

  expect(rect(row.element()).height).toBe(44);
  await row.click();

  expect(onValueChange).toHaveBeenCalledWith("b");
});
