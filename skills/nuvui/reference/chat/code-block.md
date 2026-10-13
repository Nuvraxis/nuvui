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

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-code-block` | CodeBlock |
| `.nuv-code-block__code` | The code. |
| `.nuv-code-block__copy` | The button that copies. |
| `.nuv-code-block__head` | The row over the code. |
| `.nuv-code-block__pre` | The pre inside it. |
| `.nuv-code-block__scroller` | The box the code scrolls in. |
| `.nuv-code-block__status` | That the code was copied. Read out and drawn for nobody. |
| `.nuv-code-block__title` | The language, or the title. |

The block has `data-language`, and `data-highlighted` once its code is colored. The button has `data-copied` for the two seconds after it has copied.

## Server components

CodeBlock starts with `"use client"`, for the button and for the coloring, which happens in the browser. A server component can render it with `code` and `language`, without the functions: `highlighter`, `onCopy`, `onCopyError`.

## Do and don't

**Do**

- Say which language the code is in. It's shown, and it's what the highlighter goes by.
- Make the highlighter once for the whole app.

**Don't**

- Don't use it for a word of code in a sentence. That's a `code` element.
- Don't wrap long lines by restyling it. Let them scroll.
