import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
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
