<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/message-loader.mdx. Don't edit it here: run `pnpm skill`. -->

# MessageLoader

Three dots for the wait between sending a message and the first words of the reply.

Use it for the wait before a reply starts, where the reply will be. Once words are arriving, they're what shows that something is happening, and the dots go.

```tsx
import { Message, MessageLoader } from "@nuvui/chat";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", inlineSize: "100%" }}>
      <Message from="assistant" streaming>
        <MessageLoader />
      </Message>
      <Message from="assistant" streaming>
        <MessageLoader>Searching the invoices</MessageLoader>
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
import { MessageLoader } from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Message from="assistant" streaming>
  <MessageLoader />
</Message>
```

## Saying what the wait is for

Text inside it is shown beside the dots: what the assistant is doing, when you know.

```tsx
<MessageLoader>Searching the invoices</MessageLoader>
```

For anything longer than a step or two, with results to look at, that's a job for a part of its own. [ToolCall](tool-call.md) and [Reasoning](reasoning.md) are those parts.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Writing a reply"` | What a screen reader is told, when there's no text to see. |
| `children` | `ReactNode` |  | Text beside the dots, such as "Searching the docs". With it, `label` isn't used. |

It also takes the attributes of a `div`, and passes `ref` to it.

## Accessibility

### What the component handles

- The dots are hidden from screen readers. With no text beside them there's a label, "Writing a reply", that's read and not seen.
- Inside a [`Conversation`](conversation.md) it's read out when it appears, as anything added to the log is.
- For someone who has asked for less motion the dots don't move.
- The dots take the color of the text around them, at the muted color's contrast.

### What you need to handle

- Outside a conversation, nothing announces it. Add `role="status"` if it should be.
- Translate `label`.
- Take it away when the first words arrive, and show an error in its place if none do. Dots that never end tell nobody that something failed.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-message-loader-fg` | `var(--color-muted-foreground)` | Color of the dots and the text. |
| `--nuv-message-loader-dot-size` | `calc(var(--spacing) * 1.5)` | Width and height of a dot. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-message-loader` | MessageLoader |
| `.nuv-message-loader__dot` | One dot. |
| `.nuv-message-loader__dots` | The three dots together. |
| `.nuv-message-loader__label` | What a screen reader is told. Drawn for nobody. |
| `.nuv-message-loader__text` | The text beside the dots. |

## Server components

MessageLoader has no `"use client"` and no state.
