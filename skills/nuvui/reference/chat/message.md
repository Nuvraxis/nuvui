<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/message.mdx. Don't edit it here: run `pnpm skill`. -->

# Message

One message in a conversation, from the person or from the assistant, with room for a picture, a line of details and a row of actions.

Use a message for each turn of a conversation. The person's own sit at the end of the row in a bubble. The assistant's sit at the start and take the row's width, since they're the ones that run long.

```tsx
import { Message, MessageContent } from "@nuvui/chat";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <Message from="user">
        <MessageContent>Can I move an invoice to another month?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          Yes, while it's still a draft. Open the invoice, choose Edit, and
          change the date. An invoice that's been sent can't be moved: void it
          and send a new one.
        </MessageContent>
      </Message>
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
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageCopyAction,
  MessageMeta,
} from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Message from="assistant">
  <MessageContent>Two invoices are overdue.</MessageContent>
</Message>
```

## Parts

| Part | What it is |
| --- | --- |
| `Message` | One message. `from` says whose it is. |
| `MessageContent` | What it says. |
| `MessageMeta` | A small line over or under it: a name, a time. |
| `MessageActions` | A row of buttons under it. |
| `MessageAction` | One of those buttons: an icon, named by `label`. |
| `MessageCopyAction` | A button that copies the message. |

## What it says

`MessageContent` shows text as it was written: line breaks are kept, and a long word or address breaks and doesn't push the row wider. It takes anything else as well. What a model writes is usually markdown. Put a [`Markdown`](markdown.md) in the `MessageContent` and it's drawn as headings, lists, tables and code.

## A picture and a name

`avatar` puts a picture beside the message, and a `MessageMeta` puts a line over it. Each message is already announced with who it's from. When the name is on the page, in the line, pass `label={null}` so it isn't said twice.

```tsx
import { Message, MessageContent, MessageMeta } from "@nuvui/chat";
import { Avatar, AvatarFallback } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <Message
        from="user"
        label={null}
        avatar={
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        }
      >
        <MessageMeta>Ada Lovelace · 09:41</MessageMeta>
        <MessageContent>Is the March report ready?</MessageContent>
      </Message>
      <Message
        from="assistant"
        label={null}
        avatar={
          <Avatar>
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
        }
      >
        <MessageMeta>Northwind assistant · 09:41</MessageMeta>
        <MessageContent>
          It is. Revenue is up 8% on February, and two invoices are overdue.
        </MessageContent>
      </Message>
    </div>
  );
}
```

## A reply that's still arriving

Set `streaming` while a reply is being written and take it off when it's done. Nothing looks different. It tells a screen reader to wait and read the message once it's whole, not each piece as it arrives. Before the first words, show a [`MessageLoader`](message-loader.md) where they'll be.

```tsx
"use client";

import { Message, MessageContent, MessageLoader } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useEffect, useRef, useState } from "react";

const words =
  "Revenue for March was 48,200, up 8% on February. Most of the rise came from three new customers on the Team plan.".split(
    " ",
  );

export default function Example() {
  // How many words have arrived. None yet is the wait before a reply.
  const [count, setCount] = useState(words.length);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  function again() {
    clearInterval(timer.current);
    setCount(0);
    timer.current = setInterval(() => {
      setCount((now) => {
        if (now + 1 >= words.length) clearInterval(timer.current);
        return Math.min(now + 1, words.length);
      });
    }, 150);
  }

  const streaming = count < words.length;

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        justifyItems: "start",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <Message from="assistant" streaming={streaming}>
        {count === 0 ? (
          <MessageLoader />
        ) : (
          <MessageContent>{words.slice(0, count).join(" ")}</MessageContent>
        )}
      </Message>
      <Button intent="secondary" disabled={streaming} onClick={again}>
        Reply again
      </Button>
    </div>
  );
}
```

## Actions

`MessageActions` is a row of buttons under a message. Each `MessageAction` is an icon with a `label`, which is its name for a screen reader and the text of its tooltip. `MessageCopyAction` copies `text` and shows a tick for two seconds.

```tsx
"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageCopyAction,
} from "@nuvui/chat";
import { useState } from "react";

const text =
  "Two invoices are overdue: INV-1042 for Contoso, 12 days, and INV-1057 for Fabrikam, 3 days.";

const icon = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export default function Example() {
  const [tries, setTries] = useState(1);

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="assistant">
        <MessageContent>{text}</MessageContent>
        <MessageActions>
          <MessageCopyAction text={text} />
          <MessageAction
            label="Try again"
            onClick={() => setTries((now) => now + 1)}
          >
            <svg aria-hidden="true" {...icon}>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v2.5H11" />
            </svg>
          </MessageAction>
        </MessageActions>
      </Message>
      <p role="status" style={{ marginBlock: "0.75rem 0" }}>
        Answer {tries}
      </p>
    </div>
  );
}
```

The buttons are always there. Showing them only under the pointer would hide them from a touch screen and from the keyboard.

Copying needs a page served over HTTPS, or `localhost`. Where the browser refuses, `onCopyError` is called and nothing is shown as copied.

## Message props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `from` (required) | `"assistant" \| "user"` |  | Who wrote it. The person's own messages sit at the end of the row in a bubble, and the assistant's at the start, across the row. |
| `label` | `ReactNode` | `"You" for the person's own, "Assistant" for the other` | Said before the message to a screen reader, and seen by nobody: who the message is from. Pass `null` when the name is on the page, in a `MessageMeta`. |
| `avatar` | `ReactNode` |  | A picture of who wrote it, beside the message. An `Avatar`, most often. |
| `streaming` | `boolean` | `false` | The message is still being written. A screen reader waits until it's finished and then reads it whole, and doesn't read each piece as it arrives. |

## MessageAction props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the button does, in a word or two. It's the button's name for a screen reader and the text of its tooltip. |
| `children` (required) | `ReactNode` |  | The icon. |

## MessageCopyAction props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `text` (required) | `string` |  | The text that's copied. |
| `label` | `string` | `"Copy"` |  |
| `copiedLabel` | `string` | `"Copied"` | The button's name for the two seconds after it has copied. |
| `onCopy` | `((text: string) => void)` |  | Called once the text is on the clipboard. |
| `onCopyError` | `((error: unknown) => void)` |  | Called if the browser wouldn't copy: the page isn't served over HTTPS, or permission was refused. |

## MessageActions props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Message actions"` | The name of the group for a screen reader. |

`MessageContent` and `MessageMeta` take the attributes of a `div`. Every part passes `ref` to its element.

## Accessibility

### What the component handles

- Each message starts with who it's from, "You" or "Assistant", in text that's read and not seen. The side a message is on and its bubble are for the eye. This is the same thing for the ear.
- A message with `streaming` has `aria-busy`, and loses it when it's done.
- The picture is hidden from screen readers. Who the message is from has been said.
- The actions are a group with a name. Each is a real button with a name, and its tooltip shows on focus as well as under the pointer.
- When a message has been copied, the button's name changes and "Copied" is announced.
- An action is 44 pixels on a touch screen and 32 with a mouse.

### What you need to handle

- Translate `label` with the rest of your app, and the actions' labels.
- Give every `MessageAction` a `label` that says what it does: "Try again", not "Action 2".
- Don't mark who a message is from by color alone if you restyle. Keep the side, the bubble or a name.

## CSS variables

Set any of these on a `Message`, or on anything around it.

```css
.chat {
  --nuv-message-user-bg: var(--color-primary);
  --nuv-message-user-fg: var(--color-primary-foreground);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-message-gap` | `calc(var(--spacing) * 3)` | Space between the picture and the message. |
| `--nuv-message-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-message-font-size` | `var(--text-base)` | Size of the text. |
| `--nuv-message-user-max-width` | `85%` | The most of the row the person's own message takes. |
| `--nuv-message-user-radius` | `var(--radius-xl)` | Corner radius of the person's own message. |
| `--nuv-message-user-bg` | `var(--color-muted)` | Background of the person's own message. |
| `--nuv-message-user-fg` | `var(--color-foreground)` | Color of its text. Keep it at 4.5:1 against the background. |
| `--nuv-message-meta-fg` | `var(--color-muted-foreground)` | Color of the small line. Keep it at 4.5:1. |
| `--nuv-message-action-fg` | `var(--color-muted-foreground)` | Color of an action's icon. Keep it at 3:1. |
| `--nuv-message-action-hover-bg` | `var(--color-muted)` | Background of an action under the pointer. |
| `--nuv-message-action-hover-fg` | `var(--color-foreground)` | Color of its icon under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-message` | Message |
| `.nuv-message__action` | MessageAction and MessageCopyAction. |
| `.nuv-message__actions` | MessageActions |
| `.nuv-message__avatar` | The picture, from the avatar prop. |
| `.nuv-message__body` | The column beside the picture, with everything else in it. |
| `.nuv-message__content` | MessageContent |
| `.nuv-message__label` | Who the message is from, and that it was copied. Read out and drawn for nobody. |
| `.nuv-message__meta` | MessageMeta |

A message has `data-from`, and `data-streaming` while it's being written. The copy button has `data-copied` for the two seconds after it has copied.

## Server components

Message starts with `"use client"`, for the copy button and the tooltips. A server component can render one, without the functions: `onClick`, `onCopy`.

## Do and don't

**Do**

- Set `streaming` for exactly as long as the reply is being written.
- Keep the actions to a few. Copy and try again cover most of it.

**Don't**

- Don't put a whole page in a message. A table or a form the assistant made belongs under the reply or beside the conversation.
- Don't hide the actions until the pointer is over the message.
