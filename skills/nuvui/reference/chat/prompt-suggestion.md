<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/prompt-suggestion.mdx. Don't edit it here: run `pnpm skill`. -->

# PromptSuggestion

Prompts to start from, as buttons in a row that wraps, for a conversation with nothing in it yet.

Use suggestions to show what can be asked, where someone would otherwise face an empty box. A press sends one, or puts it in the box to be changed first.

```tsx
"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import { useRef, useState } from "react";

const starters = [
  "Summarize last month's invoices",
  "Who hasn't paid yet?",
  "Draft a reminder for an overdue invoice",
];

export default function Example() {
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptSuggestions style={{ justifyContent: "start" }}>
        {starters.map((starter) => (
          <PromptSuggestion
            key={starter}
            onClick={() => {
              // Into the box, to be changed before it's sent.
              setText(starter);
              field.current?.focus();
            }}
          >
            {starter}
          </PromptSuggestion>
        ))}
      </PromptSuggestions>
      <PromptInput value={text} onValueChange={setText} onSubmit={() => {}}>
        <PromptInputTextarea
          ref={field}
          aria-label="Message"
          placeholder="Ask anything"
        />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/chat @nuvui/react
```

## Import

```tsx
import { PromptSuggestion, PromptSuggestions } from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<PromptSuggestions>
  <PromptSuggestion onClick={() => send("Who hasn't paid yet?")}>
    Who hasn't paid yet?
  </PromptSuggestion>
</PromptSuggestions>
```

## What a press does

A suggestion is a button, and what it does is yours. Two things are common:

- **Send it.** One press and the conversation has started. Right when the suggestions are whole questions.
- **Put it in the box.** Set the [prompt box](prompt-input.md)'s `value` and move focus to the field, as the example above does. Right when a suggestion is a start to finish, such as "Draft a reminder for".

## In an empty conversation

Inside a [`ConversationEmpty`](conversation.md#before-the-first-message) they sit in the middle, under a greeting.

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

## Props

`PromptSuggestions` takes `label` and the attributes of a `div`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Suggestions"` | The name of the group for a screen reader. |

`PromptSuggestion` takes the attributes of a `button`. Both pass `ref` to their element.

## Accessibility

### What the component handles

- The suggestions are a group named "Suggestions", and each is a real button named by its text.
- A suggestion is 44 pixels tall on a touch screen and 36 with a mouse. Its text wraps, so a long one doesn't make the page scroll sideways.

### What you need to handle

- Translate `label`.
- If a press sends, move focus to where the reply will be, or leave it to the conversation: the button is gone once there are messages.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-prompt-suggestion-gap` | `calc(var(--spacing) * 2)` | Space between two suggestions. |
| `--nuv-prompt-suggestion-justify` | `center` | Where the suggestions sit in their row: center, start or end. |
| `--nuv-prompt-suggestion-border` | `var(--color-border-strong)` | Color of its edge. Keep it at 3:1 against what's behind it. |
| `--nuv-prompt-suggestion-radius` | `var(--radius-full)` | Corner radius of a suggestion. |
| `--nuv-prompt-suggestion-bg` | `var(--color-background)` | Background of a suggestion. |
| `--nuv-prompt-suggestion-fg` | `var(--color-foreground)` | Color of its text. |
| `--nuv-prompt-suggestion-hover-bg` | `var(--color-muted)` | Its background under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-prompt-suggestion` | PromptSuggestion |
| `.nuv-prompt-suggestions` | PromptSuggestions |

## Server components

Neither has `"use client"` or state. `onClick` is a function, so they're rendered from a client component of yours.

## Do and don't

**Do**

- Keep each to a few words, and to three or four of them.
- Write what your assistant is good at, in the words your users would use.

**Don't**

- Don't keep them on screen once the conversation has started.
- Don't suggest what the assistant can't do.
