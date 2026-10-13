<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/markdown.mdx. Don't edit it here: run `pnpm skill`. -->

# Markdown

A reply's markdown drawn with the library's own type. Headings, lists, tables, links and code, safe to give text a model wrote, and able to take text that's still arriving.

Use it for a reply. A model writes markdown, and shown as plain text that's a page of asterisks and backticks. This draws it, with the same type, colors and spacing as the rest of your app.

```tsx
"use client";

import { Message, MessageContent } from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import { createShikiHighlighter } from "@nuvui/chat/shiki";

// One for the whole app, made outside any component.
const highlighter = createShikiHighlighter();

const reply = `## Two invoices are overdue

Both are for **Contoso**. The older one is past the day a [late fee](#late-fees) starts.

| Invoice | Amount | Days late |
| :-- | --: | --: |
| INV-1042 | 4,200 | 12 |
| INV-1057 | 1,150 | 3 |

What I'd do next:

1. Send a reminder for \`INV-1042\` today.
2. Leave \`INV-1057\` until Friday.

To find them yourself:

\`\`\`ts
const overdue = invoices.filter(
  (invoice) => invoice.customer === "Contoso" && invoice.daysLate > 0,
);
\`\`\`
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 560 }}>
      <Message from="assistant">
        <MessageContent>
          <Markdown highlighter={highlighter} headingOffset={1}>
            {reply}
          </Markdown>
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
import { Markdown } from "@nuvui/chat/markdown";
```

It has an entry of its own and isn't exported from `@nuvui/chat`. It brings a markdown parser, [react-markdown](https://github.com/remarkjs/react-markdown) with [remark-gfm](https://github.com/remarkjs/remark-gfm), which is about 42 kB compressed. An app that imports the other parts and not this one doesn't load it.

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Message from="assistant" streaming={replying}>
  <MessageContent>
    <Markdown streaming={replying}>{message.text}</Markdown>
  </MessageContent>
</Message>
```

## What it draws

Everything in CommonMark, and GitHub's additions to it: tables, task lists, struck text and addresses that become links by themselves.

A fenced block of code is a [`CodeBlock`](code-block.md), with its language over it and a button that copies it. A table that's wider than the message scrolls in a box of its own.

## Text a model wrote is not trusted

What a model writes can be steered by what it read: a web page, a file, an earlier message. So this treats its text as something to show and nothing more.

- **HTML in the text is shown as text.** A `<script>` or an `<img onerror>` is drawn as the characters it's made of, and never becomes an element.
- **Addresses are checked.** A link to `javascript:` or another scheme that runs something loses its address.
- **Pictures aren't loaded unless you say so.** A picture is fetched the moment it's drawn, with nobody pressing anything, and its address can carry whatever the model was talked into putting there, a piece of the conversation included. So a picture is drawn as a link, with its description as the text. `allowImages` loads them. Turn it on where you know where the text comes from, or where your server limits which hosts a picture may load from.

## A reply that's still arriving

Markdown that stops halfway is drawn as loose marks: a block of code is a paragraph with three backticks in front of it until its last line arrives. Set `streaming` while the text arrives, and what's open at its end is closed for the moment.

```tsx
"use client";

import { Message, MessageContent } from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import { Button, Switch } from "@nuvui/react";
import { useEffect, useState } from "react";

const reply = `A reminder goes out on **day 31**, and a late fee starts on ~~day 40~~ **day 45**.

In code, with \`dueDays\` as the invoice's own terms:

\`\`\`ts
function isLate(sentOn: Date, dueDays = 30) {
  const due = new Date(sentOn);
  due.setDate(due.getDate() + dueDays);
  return Date.now() > due.getTime();
}
\`\`\`

The [payment terms](#payment-terms) have the rest.`;

export default function Example() {
  // How many characters have arrived.
  const [arrived, setArrived] = useState(reply.length);
  const [closing, setClosing] = useState(true);
  const writing = arrived < reply.length;

  // Stands in for a model: four characters every 40 milliseconds.
  useEffect(() => {
    if (!writing) return;
    const timer = setInterval(
      () => setArrived((now) => Math.min(now + 4, reply.length)),
      40,
    );
    return () => clearInterval(timer);
  }, [writing]);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        justifyItems: "start",
        inlineSize: "100%",
        maxInlineSize: 560,
      }}
    >
      <Message
        from="assistant"
        streaming={writing}
        style={{ inlineSize: "100%", minBlockSize: 300 }}
      >
        <MessageContent style={{ inlineSize: "100%" }}>
          <Markdown streaming={writing && closing}>
            {reply.slice(0, arrived)}
          </Markdown>
        </MessageContent>
      </Message>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <Button
          intent="secondary"
          size="sm"
          disabled={writing}
          onClick={() => setArrived(0)}
        >
          Write it again
        </Button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Switch
            id="close-what-is-open"
            checked={closing}
            onCheckedChange={setClosing}
          />
          <label htmlFor="close-what-is-open">
            Close what's open while it arrives
          </label>
        </div>
      </div>
    </div>
  );
}
```

It closes fenced code, code in a line, `**bold**` and `~~struck~~`, and shows a link whose address is still arriving as its text. It leaves italics alone: a single `*` or `_` is as often a bullet, a product of two numbers or part of a name. The function that does it is exported as `closeMarkdown`, for text you draw another way.

The whole text is read again each time it changes. For a reply of an ordinary length, a few times a second, that isn't noticed. A message that isn't changing isn't read again.

## Colored code

Give it a `highlighter` and the blocks of code are colored. A ready one for Shiki is at `@nuvui/chat/shiki`. [CodeBlock](code-block.md#colors) covers it.

```tsx
import { createShikiHighlighter } from "@nuvui/chat/shiki";

// Once, outside any component.
const highlighter = createShikiHighlighter();

<Markdown highlighter={highlighter}>{text}</Markdown>;
```

## Headings

A reply's `#` is an `h1`, and your page has one already. `headingOffset` moves a reply's headings down: with `2`, `#` is an `h3` and `##` an `h4`. They don't go past `h6`.

## Your own elements

`components` replaces an element with one of yours, by tag name, the way react-markdown takes them. Links that open in a new tab, for one:

```tsx
const components = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
};

<Markdown components={components}>{text}</Markdown>;
```

Keep the object outside the component, or in a `useMemo`. A new object on every render makes every element a new one, and a block of code would lose its colors each time.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` (required) | `string` |  | The markdown. |
| `streaming` | `boolean` | `false` | The text is still arriving. What's open at its end is closed for the moment, so a block of code is drawn as one before its last line has come, and bold as bold. |
| `highlighter` | `CodeHighlighter` |  | Colors the blocks of code. Without one they're in one color. A ready one for Shiki is at `@nuvui/chat/shiki`. Make it once, outside the component: a new one on every render colors everything again. |
| `allowImages` | `boolean` | `false` | Whether pictures in the text are loaded. Left off, a picture is a link with its description as the text. A picture's address is fetched as soon as it's drawn, and text a model wrote can put anything in that address, the conversation included. |
| `headingOffset` | `number` | `0` | How many levels the headings are moved down, so that they fit under the page's own. With `2`, `#` is an `h3`. |
| `components` | `Components` |  | Your own elements in place of these, by tag name, as react-markdown takes them. Keep the object the same from one render to the next. |
| `tableLabel` | `string` | `"Table"` | The name of the box a wide table scrolls in. |
| `doneLabel` | `string` | `"Done"` | What a ticked item of a task list is called. |
| `todoLabel` | `string` | `"To do"` | What one that isn't ticked is called. |
| `copyLabel` | `string` | `"Copy code"` | The name of the button that copies a block of code. |
| `copiedLabel` | `string` | `"Copied"` | Its name for the two seconds after it has copied. |
| `codeLabel` | `string` | `"Code"` | The name of the box a block of code scrolls in. |

It also takes the attributes of a `div`, and passes `ref` to it.

## Accessibility

### What the component handles

- Headings, lists, tables and quotes are the real elements, so a screen reader can move by them.
- A table's box, and a block of code, can take focus when they scroll, and are named "Table" and "Code".
- A task list's box says "Done" or "To do", since nothing else names it.
- A link is underlined. It's told from the text around it by more than a color.
- A picture that isn't loaded is a link with the picture's description as its text.

### What you need to handle

- Put it in a [`Message`](message.md) that has `streaming` while the reply arrives, so a screen reader reads it once it's whole.
- Set `headingOffset` so a reply's headings fit under your page's.
- Translate `tableLabel`, `doneLabel`, `todoLabel`, `copyLabel`, `copiedLabel` and `codeLabel`.
- A model writes what it writes. Headings that skip a level, or a picture with no description, come through as they are.

## CSS variables

Set any of these on a `Markdown`, or on anything around it.

```css
.chat {
  --nuv-markdown-gap: calc(var(--spacing) * 4);
  --nuv-markdown-link-fg: var(--color-primary);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-markdown-gap` | `calc(var(--spacing) * 3)` | Space between paragraphs, lists and the other parts. |
| `--nuv-markdown-fg` | `inherit` | Color of the text. It's the message's unless you set it. |
| `--nuv-markdown-link-fg` | `inherit` | Color of a link. Keep it at 4.5:1. The default theme's primary color is checked as a control's color, at 3:1, and not as text. |
| `--nuv-markdown-quote-border` | `var(--color-border-strong)` | Color of the line beside a quote. |
| `--nuv-markdown-quote-fg` | `var(--color-muted-foreground)` | Color of a quote's text. Keep it at 4.5:1. |
| `--nuv-markdown-border` | `var(--color-border)` | Color of a table's lines and of a rule. |
| `--nuv-markdown-code-bg` | `var(--color-muted)` | Background of code in a line. |
| `--nuv-markdown-code-fg` | `var(--color-foreground)` | Color of code in a line. Keep it at 4.5:1 against its background. |
| `--nuv-markdown-table-head-bg` | `var(--color-muted)` | Background of a table's heading row. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-markdown` | Markdown |
| `.nuv-markdown__table` | The box a table scrolls in. |

What's inside has no classes: it's styled by its element, `h2`, `ul`, `table`, each in `:where()`, which adds nothing to how strong the rule is. A rule of yours with one class wins.

## Server components

Markdown starts with `"use client"`. A server component can render it with text and no function: without `highlighter`, and without `components`.

## Do and don't

**Do**

- Set `streaming` for exactly as long as the text arrives.
- Make the highlighter once for the whole app.

**Don't**

- Don't turn `allowImages` on for text you can't vouch for.
- Don't use it for a page of your own writing. That's a build step's job, where the text is read once and not in the browser.
