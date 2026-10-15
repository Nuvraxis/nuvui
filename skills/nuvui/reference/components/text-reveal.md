<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/text-reveal.mdx. Don't edit it here: run `pnpm skill`. -->

# TextReveal

Lines of text that rise into place one after another, for a heading that opens a page. It's still for anyone who asked for less motion, and the text is in the page from the server.

Use a text reveal for the one heading a page opens with, such as the headline of a home page or the title of a launch. Each line rises from under its own edge, a moment after the one before. It's for a few short lines, once.

```tsx
"use client";

import { Button, TextReveal } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  // A new key draws it again, so the rise can be seen again here.
  const [run, setRun] = useState(0);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "var(--text-4xl)",
          fontWeight: 600,
          lineHeight: 1.1,
        }}
      >
        <TextReveal key={run} lines={["Every report", "your team asks for"]} />
      </h2>
      <Button intent="secondary" onClick={() => setRun((now) => now + 1)}>
        Play again
      </Button>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { TextReveal } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `lines` (required) | `ReactNode[]` |  | The lines, in order. Each one rises into place a moment after the one before it. A line can hold markup, such as a link or an `em`. |
| `trigger` | `"mount" \| "view"` | `"mount"` | When the lines rise. `"mount"` is as soon as it's drawn, for text at the top of a page. `"view"` is the first time it's scrolled into view, for text further down. Text that's already in view when the page opens is shown as it is. |

It's a `span`, and takes what a `span` takes, including `ref` and `className`. Put it inside the heading or the paragraph it's for, which keeps its own level, size and font:

```tsx
<h1>
  <TextReveal lines={["Every report", "your team asks for"]} />
</h1>
```

## Lines

You say where the lines break: each item in `lines` is a line. A line can hold markup, such as a link or an `em`, and a line that's too long for its box wraps like any other text, and rises as one.

A screen reader reads the lines as one text, with a space between them, and a copy and paste gets them the same way.

## When it rises

With `trigger="mount"`, the default, the lines rise as soon as the page is drawn. The rise is in the stylesheet, so it runs before the page's script has loaded, and ends with the text in place if the script never does.

With `trigger="view"`, the lines rise the first time they're scrolled into view. Text that's already in view when the page opens is shown as it is: hiding it then would make it flash. Out of view, the text waits under its edge until it's scrolled to, and it's hidden only once the script knows it's out of view. So the page from the server, and a page whose script fails, show every word.

```tsx
import { TextReveal } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0, fontSize: "var(--text-2xl)", lineHeight: 1.3 }}>
      <TextReveal
        trigger="view"
        lines={[
          "Rises the first time",
          <>
            it's <em>scrolled</em> into view.
          </>,
        ]}
      />
    </p>
  );
}
```

To play it again, give it a new `key`.

## Accessibility

A text reveal has no role and no keyboard behavior. It can't take focus.

### What the component handles

- The text is ordinary text, in the page from the server, read and found and selected like any other.
- For a visitor who asked for less motion, every line is in place from the start.
- Only position moves. Nothing around the text is laid out again, and the lines are spaced as they would be without it.
- Where the browser forces its own colors, the text is drawn in the browser's text color.

### What you need to handle

- Use it once on a page, for the text that opens it. Text that moves each time it's scrolled past is hard to read.
- Keep it to a few lines.

## CSS variables

Set any of these on the `TextReveal`, or on anything around it.

```css
.headline {
  --nuv-text-reveal-stagger: 200ms;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-text-reveal-distance` | `calc(100% + 0.2em)` | How far below its edge a line starts. Far enough that none of it shows. |
| `--nuv-text-reveal-duration` | `700ms` | How long one line takes to rise. |
| `--nuv-text-reveal-easing` | `var(--ease-out)` | How a line speeds up and slows down. |
| `--nuv-text-reveal-index` | `0` | Which line this is, from 0. The component writes this. Don't set it. |
| `--nuv-text-reveal-stagger` | `120ms` | How long each line waits after the one before it. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-text-reveal` | TextReveal. |
| `.nuv-text-reveal__line` | A line, cut to its own height. |
| `.nuv-text-reveal__text` | What's in a line. It's what rises. |

Where it is is in a `data-state` attribute: `rising`, `waiting` while it's out of view and waiting to be scrolled to, or `shown` when it was in view from the start.

## Server components

TextReveal starts with `"use client"`: with `trigger="view"` it watches for the text to be scrolled to. It takes no functions, so a server component can render it, with lines it wrote.

## Do and don't

**Do**

- Break the lines where they read well: "Every report" and "your team asks for", not one word on its own.
- Keep it for the opening of a page.

**Don't**

- Don't use it for body text, a list or a form.
- Don't put several on one screen.
