<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/conversation.mdx. Don't edit it here: run `pnpm skill`. -->

# Conversation

The messages of a chat in a box that scrolls. It starts at the latest message, stays there while a reply arrives, and stops following when the reader scrolls up.

Use a conversation around the messages of a chat. It does the one thing a plain scrolling box gets wrong: a reply that grows keeps the end in view, and the moment the reader scrolls up to read something, it leaves them where they are.

```tsx
"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useEffect, useRef, useState } from "react";

type Line = { id: number; from: "user" | "assistant"; text: string };

// A stand-in for a model: the same answer, a few words at a time.
const answer =
  "Invoices are sent on the first working day of the month. To change that, open Billing, then Schedule, and pick another day. The change applies from the next invoice. Invoices already sent keep their dates, and a customer who pays by card is charged on the day the invoice is sent.";

const first: Line[] = [
  { id: 1, from: "user", text: "When do invoices go out?" },
  {
    id: 2,
    from: "assistant",
    text: "On the first working day of each month, at 09:00 in your workspace's time zone.",
  },
  { id: 3, from: "user", text: "And if that's a public holiday?" },
  {
    id: 4,
    from: "assistant",
    text: "Then they go out on the next working day. Holidays come from the country your workspace is set to, under Settings, then Region.",
  },
];

export default function Example() {
  const [lines, setLines] = useState(first);
  // Words of the reply so far, or null when none is on its way.
  const [words, setWords] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const all = answer.split(" ");

  useEffect(() => () => clearInterval(timer.current), []);

  function finish(count: number) {
    clearInterval(timer.current);
    setWords(null);
    if (count === 0) return;
    setLines((now) => [
      ...now,
      {
        id: Date.now(),
        from: "assistant",
        text: all.slice(0, count).join(" "),
      },
    ]);
  }

  function send(text: string) {
    setLines((now) => [...now, { id: Date.now(), from: "user", text }]);
    setWords(0);
    let count = 0;
    timer.current = setInterval(() => {
      count += 2;
      if (count >= all.length) finish(all.length);
      else setWords(count);
    }, 120);
  }

  return (
    <Conversation
      style={{
        inlineSize: "100%",
        maxInlineSize: 520,
        blockSize: 400,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <ConversationContent aria-label="Billing questions">
        {lines.map((line) => (
          <Message key={line.id} from={line.from}>
            <MessageContent>{line.text}</MessageContent>
          </Message>
        ))}
        {words === null ? null : (
          <Message from="assistant" streaming>
            {words === 0 ? (
              <MessageLoader />
            ) : (
              <MessageContent>{all.slice(0, words).join(" ")}</MessageContent>
            )}
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
      <div style={{ padding: "0 1rem 1rem" }}>
        <PromptInput
          busy={words !== null}
          onStop={() => finish(words ?? 0)}
          onSubmit={send}
        >
          <PromptInputTextarea
            aria-label="Message"
            placeholder="Ask about billing"
          />
          <PromptInputToolbar>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </Conversation>
  );
}
```

## Install

```sh
pnpm add @nuvui/chat @nuvui/react
```

## Import

```tsx
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
} from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Conversation style={{ blockSize: 480 }}>
  <ConversationContent aria-label="Billing questions">
    {/* messages */}
  </ConversationContent>
  <ConversationScrollButton />
  {/* the prompt box */}
</Conversation>
```

## Parts

| Part | What it is |
| --- | --- |
| `Conversation` | The whole: a column, as tall as you make it. |
| `ConversationContent` | The messages. This is the box that scrolls, and it takes the room that's left. |
| `ConversationScrollButton` | A button over the end of the messages that goes to the latest one. It's only there while the latest is out of view. |
| `ConversationEmpty` | What's shown before any message, in the middle of the room. |

Whatever else you put in the `Conversation`, such as a [prompt box](prompt-input.md), sits under the messages at its own height.

## Give it a height

A conversation is as tall as you make it, and the messages scroll inside. With no height it grows with its messages and nothing scrolls. Set one on it, or put it in something that has one:

```css
.chat {
  block-size: 100dvh;
}
```

`dvh` follows a phone's address bar and its keyboard, so the prompt box stays in view while someone types.

## Following a reply

It starts at the latest message. While that's in view, anything that makes the messages taller keeps it in view: a reply arriving word by word, a new message, a picture that loads.

When the reader scrolls up, it stops. New messages arrive below without moving what they're reading, and the button appears. It follows again once they scroll back to the end, or press the button.

Sending a message from a `PromptInput` inside the conversation goes to the end as well, wherever the reader was: they've just written something and want to see the answer.

## Before the first message

`ConversationEmpty` holds a greeting and some [prompts to start from](prompt-suggestion.md). Render it in place of the messages while there are none.

```tsx
"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  Message,
  MessageContent,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import { useState } from "react";

const starters = [
  "Summarize last month's invoices",
  "Who hasn't paid yet?",
  "Draft a reminder",
];

export default function Example() {
  const [sent, setSent] = useState<string[]>([]);

  return (
    <Conversation
      style={{
        inlineSize: "100%",
        maxInlineSize: 520,
        blockSize: 380,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <ConversationContent aria-label="A new conversation">
        {sent.length === 0 ? (
          <ConversationEmpty>
            <p style={{ margin: 0, fontWeight: 600 }}>
              What do you want to know?
            </p>
            <PromptSuggestions>
              {starters.map((text) => (
                <PromptSuggestion
                  key={text}
                  onClick={() => setSent((now) => [...now, text])}
                >
                  {text}
                </PromptSuggestion>
              ))}
            </PromptSuggestions>
          </ConversationEmpty>
        ) : (
          sent.map((text, index) => (
            <Message key={index} from="user">
              <MessageContent>{text}</MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <div style={{ padding: "0 1rem 1rem" }}>
        <PromptInput onSubmit={(text) => setSent((now) => [...now, text])}>
          <PromptInputTextarea
            aria-label="Message"
            placeholder="Ask anything"
          />
          <PromptInputToolbar>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </Conversation>
  );
}
```

## From a part of your own

`useConversation` gives whether the latest message is in view and a function that goes to it, for something of yours inside a `Conversation`, such as a "3 new messages" pill.

```tsx
function NewMessages({ count }: { count: number }) {
  const { atBottom, scrollToBottom } = useConversation();
  if (atBottom || count === 0) return null;
  return (
    <button type="button" onClick={() => scrollToBottom()}>
      {count} new
    </button>
  );
}
```

`scrollToBottom({ behavior: "auto" })` jumps there without gliding.

## ConversationScrollButton props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Go to the latest message"` | The button's name for a screen reader. |
| `children` | `ReactNode` |  | In place of the arrow. |

`Conversation`, `ConversationContent` and `ConversationEmpty` take the attributes of a `div`. All four pass `ref` to their element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Stops at the messages, so they can be scrolled, then at anything in them that takes focus. |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Page Up</kbd> <kbd>Page Down</kbd> <kbd>Home</kbd> <kbd>End</kbd> | With focus on the messages, scroll them. |

### What the component handles

- `ConversationContent` has `role="log"`, so a screen reader reads a message when it's added and doesn't read the others again.
- It can take focus, which is what lets it be scrolled from the keyboard.
- The button to go to the latest message is named, and removed while there's nowhere to go. Pressing it puts focus on the messages, so focus isn't dropped when the button goes.
- For someone who has asked for less motion, going to the end is a jump and not a glide.

### What you need to handle

- Name the messages with `aria-label` on `ConversationContent`: "Conversation with support", say.
- Mark a reply that's still arriving with `streaming` on its [`Message`](message.md), so that it's read once and whole.
- Keep the newest message last in the markup. A log is read in the order it's written.

### What hasn't been checked

The tests check the role, the names and that focus lands where it should. What each screen reader says as messages arrive hasn't been checked by a person.

## On small screens

The messages have 16 pixels of space around them and are never wider than 48rem. The button to go to the end is 44 pixels on a touch screen and 36 with a mouse.

## CSS variables

Set any of these on the `Conversation`, or on anything around it.

```css
.chat {
  --nuv-conversation-max-width: 40rem;
  --nuv-conversation-gap: 2rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-conversation-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-conversation-gap` | `calc(var(--spacing) * 6)` | Space between two messages. |
| `--nuv-conversation-max-width` | `48rem` | The most width the messages take. They sit in the middle of a wider box. |
| `--nuv-conversation-padding` | `calc(var(--spacing) * 4)` | Space around the messages, inside the box that scrolls. |
| `--nuv-conversation-scroll-button-size` | `var(--nuv-touch-size)`, `calc(var(--spacing) * 9)` | The button's width and height. Larger by default with a finger than with a mouse. |
| `--nuv-conversation-scroll-button-offset` | `calc(var(--spacing) * 3)` | How far above the end of the messages the button sits. |
| `--nuv-conversation-scroll-button-border` | `var(--color-border-strong)` | Color of that button's edge. Keep it at 3:1 against the messages' background. |
| `--nuv-conversation-scroll-button-bg` | `var(--color-background)` | Background of the button that goes to the end. |
| `--nuv-conversation-scroll-button-fg` | `var(--color-foreground)` | Color of its arrow. |
| `--nuv-conversation-scroll-button-hover-bg` | `var(--color-muted)` | Its background under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-conversation` | Conversation |
| `.nuv-conversation__content` | The column of messages inside it. |
| `.nuv-conversation__empty` | ConversationEmpty |
| `.nuv-conversation__scroll-button` | ConversationScrollButton |
| `.nuv-conversation__viewport` | ConversationContent: the box that scrolls. |

## Server components

Conversation starts with `"use client"`: it follows the scrolling. A server component can render it with messages written there. A conversation that changes is a client component of yours anyway, since it holds the messages.

## Do and don't

**Do**

- Give it a height, from the page or from what it's in.
- Put the prompt box inside the `Conversation`, after the messages, so sending goes to the end.

**Don't**

- Don't scroll to the end yourself when a message arrives. That takes the page away from someone reading further up, which is what this is for.
- Don't put the newest message first. It follows the end.
