<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Chat

The @nuvui/chat package. The parts of a conversation with an assistant, installed next to @nuvui/react. Messages, the scrolling around them, markdown and code, the box a prompt is written in, files, sources, tool calls, reasoning and the list of past conversations.

The parts of a conversation with an assistant are a package of their own, `@nuvui/chat`:

| Component | What it is |
| --- | --- |
| [Conversation](conversation.md) | The messages in a box that scrolls. It stays at the latest message while a reply arrives, and stops following when the reader scrolls up. |
| [Message](message.md) | One message, from the person or from the assistant, with a row of actions under it. |
| [MessageLoader](message-loader.md) | Three dots for the wait before a reply starts. |
| [Markdown](markdown.md) | A reply's markdown drawn with the library's type, safe for text a model wrote, and able to take text that's still arriving. |
| [CodeBlock](code-block.md) | Code with its language, a button that copies it, and colors from a highlighter you plug in. |
| [PromptInput](prompt-input.md) | The box a prompt is written in. It grows with the text, sends on Enter, takes files, and has a row for buttons. |
| [PromptSuggestion](prompt-suggestion.md) | Prompts to start from, for a conversation with nothing in it yet. |
| [Attachment](attachment.md) | A file, in a message or waiting in the prompt box. |
| [Source](source.md) | What a reply was drawn from, as a numbered list of links that opens under it. |
| [ToolCall](tool-call.md) | Something the assistant did with a tool, or asks to do, in a card that opens. |
| [Reasoning](reasoning.md) | The steps the assistant took, open while it works and closed after. |
| [ThreadList](thread-list.md) | The list of past conversations, for a sidebar. |

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

`@nuvui/react` is a peer dependency. Some parts are built on the core's: the ones that open on its Collapsible, the thread list on its ListView.

Two things come from outside, each only for the part that needs it:

- **`Markdown`** reads markdown with [react-markdown](https://github.com/remarkjs/react-markdown) and [remark-gfm](https://github.com/remarkjs/remark-gfm), which are installed with the package. It has an entry of its own, `@nuvui/chat/markdown`, and isn't exported from `@nuvui/chat`, so they're loaded only by an app that imports it. They're ESM only: an app that's bundled doesn't notice, and one that loads `@nuvui/chat/markdown` with `require` needs Node 20.19, or 22.12 and later.
- **The ready highlighter** at `@nuvui/chat/shiki` uses [Shiki](https://shiki.style), which is an optional peer dependency: install it if you use that entry. Nothing else needs it.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/chat/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. Each component's styles are also on their own, at `@nuvui/chat/css/conversation.css` and so on, one file for each page here. A part that's built on one of the core's needs that one's file as well:

| Stylesheet | Also needs, from `@nuvui/react/css/` |
| --- | --- |
| `message.css` | `tooltip.css`, for the action buttons |
| `markdown.css` | `code-block.css` from this package |
| `prompt-input.css` | `attachment.css` from this package and `spinner.css`, if it takes files |
| `attachment.css` | `spinner.css` |
| `source.css` | `collapsible.css` |
| `tool-call.css` | `collapsible.css`, `spinner.css`, `button.css` |
| `reasoning.css` | `collapsible.css`, `spinner.css`, `text-shimmer.css` |
| `thread-list.css` | `list-view.css` |

## Put them together

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

export function Chat({ messages, waiting, replying, send, stop }) {
  return (
    <Conversation style={{ blockSize: "100dvh" }}>
      <ConversationContent aria-label="Conversation">
        {messages.map((message) => (
          <Message
            key={message.id}
            from={message.role}
            streaming={replying && message === messages.at(-1)}
          >
            <MessageContent>{message.text}</MessageContent>
          </Message>
        ))}
        {waiting ? (
          <Message from="assistant" streaming>
            <MessageLoader />
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
      <PromptInput busy={waiting || replying} onStop={stop} onSubmit={send}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </Conversation>
  );
}
```

## Where the messages come from is yours

Nothing here talks to a model or to a server. The components take messages as props and tell you when something is sent. That's on purpose: how a reply is fetched, streamed, stored and retried differs from one app to the next, and a UI library that decided it would be in the way of most of them.

So they work with whatever you fetch with. The names line up with what most of those give you: a message has a role, `"user"` or `"assistant"`, which is `Message`'s `from`, and a request has a state, which is `PromptInput`'s `busy` and `Message`'s `streaming`.

## What a screen reader is told

- The messages are a log. A message that's added is read out, and the rest isn't read again.
- A reply that's still arriving is marked as busy, and read once it's whole. Without that, every few words would be read as they came, over each other. Set `streaming` on the message for as long as it's being written.
- Each message starts with who it's from, "You" or "Assistant", said and not seen. `label` changes the words, for another language or another name.
- The button that sends is named "Send", and "Stop" while it stops a reply.

All of that is checked by the tests as roles, names and states. What each screen reader then says hasn't been checked by a person.

## Languages

The few words the components say themselves are props with English defaults:

| Component | Prop | Default |
| --- | --- | --- |
| `Message` | `label` | `"You"` or `"Assistant"` |
| `MessageActions` | `label` | `"Message actions"` |
| `MessageCopyAction` | `label`, `copiedLabel` | `"Copy"`, `"Copied"` |
| `MessageLoader` | `label` | `"Writing a reply"` |
| `CodeBlock` | `copyLabel`, `copiedLabel`, `label` | `"Copy code"`, `"Copied"`, `"Code"` |
| `Markdown` | `tableLabel`, `doneLabel`, `todoLabel`, and the three of `CodeBlock` as `copyLabel`, `copiedLabel`, `codeLabel` | `"Table"`, `"Done"`, `"To do"` |
| `ConversationScrollButton` | `label` | `"Go to the latest message"` |
| `PromptInputSubmit` | `label`, `stopLabel` | `"Send"`, `"Stop"` |
| `PromptSuggestions` | `label` | `"Suggestions"` |
| `PromptInputAttach` | `label` | `"Attach files"` |
| `PromptInputAttachments` | `label`, `removeLabel`, `announce` | `"Files to send"`, `"Remove …"`, `"2 files attached"` |
| `Attachment` | `removeLabel`, `uploadingLabel` | `"Remove …"`, `"Uploading"` |
| `SourcesTrigger` | children | `"Sources"` |
| `ToolCallTrigger` | `statusLabel` | `"Running"`, `"Needs approval"`, `"Done"`, `"Failed"`, `"Denied"` |
| `ToolCallInput`, `ToolCallOutput`, `ToolCallError` | `label` | `"Request"`, `"Result"`, `"Error"` |
| `ToolCallApproval` | `label`, `approveLabel`, `denyLabel` | `"Approval"`, `"Approve"`, `"Deny"` |
| `ReasoningTrigger` | children | `"Thinking"`, then `"Reasoning"` |

A file's size is written in the reader's own number format. `formatSize` on `Attachment` and `PromptInputAttachments` writes it your way.

## Server components

`Conversation`, `Message`, `Markdown`, `CodeBlock`, `PromptInput`, `Sources`, `ToolCall`, `Reasoning` and `ThreadList` are client components: they follow the scrolling, copy to the clipboard, color code, keep what's typed, and open and close. They carry `"use client"`, so a server component can render them. `MessageLoader`, `PromptSuggestions`, `PromptSuggestion`, `Attachments` and `Attachment` have no state and aren't client components.

A conversation that changes is a client component of yours in any case, since it holds the messages.

## What it leaves out

- **Talking to a model.** Covered above: the messages are yours.
- **Uploading.** The prompt box hands you `File` objects.
- **Math and diagrams in markdown.** `Markdown` takes your own elements through `components`, which is where a renderer for either goes.
