<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/code-block.mdx. Don't edit it here: run `pnpm skill`. -->

# CodeBlock

Code in a box of its own, with its language over it, a button that copies it, and colors from a highlighter you plug in. One for Shiki is ready-made.

Use it for code in a reply. [`Markdown`](markdown.md) draws every fenced block with it, and it works alone where you have the code yourself.

```tsx
"use client";

import { CodeBlock } from "@nuvui/chat";
import { createShikiHighlighter } from "@nuvui/chat/shiki";

// One for the whole app, made outside any component.
const highlighter = createShikiHighlighter();

const code = `type Invoice = { number: string; amount: number; daysLate: number };

// The ones a reminder should go out for today.
export function overdue(invoices: Invoice[], after = 0) {
  return invoices
    .filter((invoice) => invoice.daysLate > after)
    .sort((a, b) => b.daysLate - a.daysLate);
}`;

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 560,
      }}
    >
      <CodeBlock code={code} language="ts" highlighter={highlighter} />
      <CodeBlock
        code={`pnpm add @nuvui/chat @nuvui/react`}
        language="sh"
        title="Terminal"
      />
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
import { CodeBlock } from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<CodeBlock code={code} language="ts" />
```

## What it shows

`code` is the code. `language` is written over it, and `title` takes its place there, for a file's name. A button copies the code, and shows a tick for two seconds. `copyable={false}` leaves the button out.

Lines aren't wrapped, since where a line breaks means something in code. A long line scrolls sideways inside the box. `--nuv-code-block-max-height` gives the box a height to scroll down in as well.

## Colors

By itself the code is in one color, and the component depends on nothing. Colors come from a `highlighter`: a function that's given the code and the language and returns the code's lines as tokens, each with a color.

One for [Shiki](https://shiki.style) is ready. Install Shiki next to the package:

```sh
pnpm add shiki
```

```tsx
import { CodeBlock } from "@nuvui/chat";
import { createShikiHighlighter } from "@nuvui/chat/shiki";

// Once for the whole app, outside any component.
const highlighter = createShikiHighlighter();

<CodeBlock code={code} language="ts" highlighter={highlighter} />;
```

Nothing of Shiki is loaded with the page. It's fetched the first time code is colored, and each language's grammar the first time that language turns up. Until then the code is in one color, and it stays that way for a language Shiki doesn't know. It uses Shiki's engine written in JavaScript, so there's no WebAssembly to serve.

While code is still arriving, what has been colored stays colored and what's new is added after it in one color until it's colored too. Nothing flickers, and the code on the screen is never behind.

### The colors are the theme's

A token's color is a CSS variable, so the code follows the theme and dark mode with nothing to switch. Without the variables set, each kind takes one of the theme's colors that's checked as text against the box's background, in every preset:

| Variable | What it colors | Default |
| --- | --- | --- |
| `--nuv-code-block-token-keyword` | Keywords and operators | `--color-danger` |
| `--nuv-code-block-token-string`, `--nuv-code-block-token-string-expression` | Text in quotes | `--color-success` |
| `--nuv-code-block-token-constant` | Numbers, constants and names that are defined | `--color-warning` |
| `--nuv-code-block-token-comment` | Comments | `--color-muted-foreground` |
| `--nuv-code-block-token-punctuation` | Brackets and commas | `--color-muted-foreground` |
| `--nuv-code-block-token-function`, `--nuv-code-block-token-parameter`, `--nuv-code-block-token-link` | Function names, parameters, links | The box's text color |
| `--nuv-code-block-token-inserted`, `--nuv-code-block-token-deleted`, `--nuv-code-block-token-changed` | Lines of a diff | `--color-success`, `--color-danger`, `--color-warning` |
| `--nuv-code-block-foreground` | Everything else | The box's text color |

Set them on the block or on anything around it. Keep each at 4.5:1 against the box's background.

```css
.chat {
  --nuv-code-block-token-function: var(--color-chart-1);
}
```

### One of your own

A highlighter is a function, so any library fits behind it:

```tsx
import type { CodeHighlighter } from "@nuvui/chat";

const highlighter: CodeHighlighter = (code, language) => {
  if (language !== "json") return null;
  return code.split("\n").map((line) => [{ content: line, color: "var(--color-success)" }]);
};
```

It returns the lines, each a list of tokens, or a promise of them. The tokens' text, put back together, has to be the code it was given. `null` says the language isn't one it knows.

## Typing

With `typing`, the code types itself out, a character at a time, with a cursor after the last one. It's for code that's being shown off, on a page that introduces a product or a step in a guide, and not for code in a conversation.

```tsx
"use client";

import { CodeBlock } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useState } from "react";

const code = `import { Button } from "@nuvui/react";

export function Save() {
  return <Button>Save changes</Button>;
}`;

export default function Example() {
  const [run, setRun] = useState(0);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <CodeBlock key={run} code={code} language="tsx" typing />
      <Button
        intent="secondary"
        style={{ justifySelf: "start" }}
        onClick={() => setRun((now) => now + 1)}
      >
        Type again
      </Button>
    </div>
  );
}
```

`typingDuration` is how long the whole code takes, in milliseconds. Left out, it's 25 a character, and no more than three seconds, so a long block doesn't keep anyone waiting. `typingDelay` waits before it starts. `onTyped` is called once all the code is there.

With `typingTrigger="view"`, it starts the first time the block is scrolled into view, as soon as any of it is.

```tsx
<CodeBlock
  code={install}
  language="sh"
  typing
  typingTrigger="view"
  typingDuration={1200}
/>
```

The box has its full size from the start: what isn't typed yet is in the page and isn't drawn, so nothing under the block moves, a screen reader reads the whole code, and the button copies all of it. Colors from a highlighter are kept as it types. A line longer than the box, or code taller than `--nuv-code-block-max-height`, scrolls the box to keep the cursor in view, and leaves the page where it is.

For a visitor who asked for less motion, and where the browser forces its own colors, the code is all there at once, and `onTyped` is still called. In the page from the server, the code is there and hidden until the script starts the typing. If the script never runs, it's shown after three seconds.

To type it again, give it a new `key`.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `code` (required) | `string` |  | The code. |
| `language` | `string` |  | The language it's in, as it's written after the fence in markdown: `"ts"`, `"python"`. It's shown over the code and handed to the highlighter. |
| `title` | `ReactNode` |  | In place of the language over the code: a file's name, most often. |
| `highlighter` | `CodeHighlighter` |  | Colors the code. Without one it's in one color. A ready one for Shiki is at `@nuvui/chat/shiki`. |
| `copyable` | `boolean` | `true` | Whether there's a button that copies the code. |
| `copyLabel` | `string` | `"Copy code"` | The copy button's name for a screen reader. |
| `copiedLabel` | `string` | `"Copied"` | Its name for the two seconds after it has copied. |
| `onCopy` | `((code: string) => void)` |  | Called once the code is on the clipboard. |
| `onCopyError` | `((error: unknown) => void)` |  | Called if the browser wouldn't copy: the page isn't served over HTTPS, or permission was refused. |
| `label` | `string` | `"Code"` | The name of the box the code scrolls in, for a screen reader. |
| `typing` | `boolean` | `false` | Whether the code types itself out, a character at a time, with a cursor at the end. The box has its full size from the start, and a screen reader and a copy get the whole code. For less motion it's all there at once. |
| `typingTrigger` | `"mount" \| "view"` | `"mount"` | When the typing starts: `"mount"` is as soon as it's drawn, and `"view"` the first time it's scrolled into view. |
| `typingDuration` | `number` |  | How long the typing takes, in milliseconds. Left out, it's 25 a character, and no more than 3,000. |
| `typingDelay` | `number` | `0` | How long to wait before the typing starts, in milliseconds. |
| `onTyped` | `(() => void)` |  | Called once the whole code is there, typed or shown at once. |

It also takes the attributes of a `div`, and passes `ref` to it.

### A token

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `content` (required) | `string` |  | The text. |
| `color` | `string` |  | Any CSS color. Left out, it's the block's own text color. |
| `fontStyle` | `"italic"` |  |  |
| `fontWeight` | `"bold"` |  |  |
| `textDecoration` | `"line-through" \| "underline"` |  |  |

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Goes to the button that copies, and then to the code. |
| Arrow keys | Scroll the code, when it has focus. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the button, copies the code. |

### What the component handles

- The box the code scrolls in can take focus, and is named "Code", so it can be scrolled with the keys.
- The button is named "Copy code". When it has copied, its name changes and "Copied" is announced.
- The colors are decoration. The code is the same text with them and without.
- The default colors are the theme's, which are checked as text against the box's background.
- The button is 44 pixels on a touch screen and 28 with a mouse.
- While code types itself out, all of it is in the page for a screen reader, and the cursor is hidden from it. For less motion, the code is there at once.

### What you need to handle

- Translate `copyLabel`, `copiedLabel` and `label`.
- If you set the token colors yourself, keep each at 4.5:1 against the box's background, in light and in dark.

Copying needs a page served over HTTPS, or `localhost`. Where the browser refuses, `onCopyError` is called and nothing is shown as copied.

## CSS variables

Set any of these on a `CodeBlock`, or on anything around it. The token colors are in the table above.

```css
.chat {
  --nuv-code-block-max-height: 24rem;
  --nuv-code-block-radius: var(--radius-md);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-code-block-border` | `var(--color-border)` | Color of the box's edge and of the line under its top row. |
| `--nuv-code-block-radius` | `var(--radius-lg)` | Corner radius of the box. |
| `--nuv-code-block-bg` | `var(--color-surface)` | Background of the box. The default token colors are checked against the default. |
| `--nuv-code-block-fg` | `var(--color-surface-foreground)` | Color of code that has no color of its own. |
| `--nuv-code-block-title-fg` | `var(--color-muted-foreground)` | Color of the language or the title. Keep it at 4.5:1. |
| `--nuv-code-block-copy-fg` | `var(--color-muted-foreground)` | Color of the copy button's icon. Keep it at 3:1. |
| `--nuv-code-block-copy-hover-bg` | `var(--color-muted)` | Background of the button under the pointer. |
| `--nuv-code-block-copy-hover-fg` | `var(--color-foreground)` | Color of its icon under the pointer. |
| `--nuv-code-block-max-height` | `none` | How tall the code gets before it scrolls down. Left out, it's as tall as its lines. |
| `--nuv-code-block-font-size` | `var(--text-sm)` | Size of the code. |
| `--nuv-code-block-typing-fallback` | `3s` | How long code that types itself out stays hidden in the page from the server, if the script never runs. |
| `--nuv-code-block-caret-width` | `2px` | How wide the cursor is. |
| `--nuv-code-block-caret` | `var(--nuv-code-block-fg, var(--color-surface-foreground))` | Color of the cursor while the code types itself out. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-code-block` | CodeBlock |
| `.nuv-code-block__caret` | The cursor, while the code types itself out. |
| `.nuv-code-block__code` | The code. |
| `.nuv-code-block__copy` | The button that copies. |
| `.nuv-code-block__head` | The row over the code. |
| `.nuv-code-block__pre` | The pre inside it. |
| `.nuv-code-block__scroller` | The box the code scrolls in. |
| `.nuv-code-block__status` | That the code was copied. Read out and drawn for nobody. |
| `.nuv-code-block__title` | The language, or the title. |
| `.nuv-code-block__untyped` | What isn't typed yet: in the page, and not drawn. |

The block has `data-language`, and `data-highlighted` once its code is colored. With `typing`, it has `data-typing`: `pending` in the page from the server, `waiting` before it starts, `typing`, and `done`. The button has `data-copied` for the two seconds after it has copied.

## Server components

CodeBlock starts with `"use client"`, for the button and for the coloring, which happens in the browser. A server component can render it with `code` and `language`, without the functions: `highlighter`, `onCopy`, `onCopyError`, `onTyped`.

## Do and don't

**Do**

- Say which language the code is in. It's shown, and it's what the highlighter goes by.
- Make the highlighter once for the whole app.

**Don't**

- Don't use it for a word of code in a sentence. That's a `code` element.
- Don't wrap long lines by restyling it. Let them scroll.
