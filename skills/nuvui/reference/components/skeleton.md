<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/skeleton.mdx. Don't edit it here: run `pnpm skill`. -->

# Skeleton

A gray box in the shape of content that's still loading.

Use skeletons where content is on its way and you know roughly what shape it will have: a card, a row, a line of text. They hold the layout still, so nothing jumps when the content arrives. Where you don't know the shape, or the wait is for an action and not for content, use a [spinner](spinner.md).

```tsx
import { Skeleton } from "@nuvui/react";

export default function Example() {
  return (
    <div
      aria-busy="true"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        width: "100%",
        maxWidth: 320,
      }}
    >
      <Skeleton shape="circle" />
      <div style={{ flex: 1 }}>
        <Skeleton shape="text" style={{ width: "60%" }} />
        <Skeleton shape="text" />
      </div>
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
import { Skeleton } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `shape` | `"block" \| "circle" \| "text"` | `"block"` | `"block"` is a rounded box you give a size. `"text"` is as tall as a line of the text around it. `"circle"` is round, for an avatar. |

Everything else is passed to the `<div>`, including `ref`, `className` and `style`.

## Shapes

| Shape | What it's for | Its size |
| --- | --- | --- |
| `block` | A picture, a chart, a button, a whole card. | As wide as its container and 16 pixels tall. Give it the size of what it stands for. |
| `text` | A line of text. | One line of the text around it, with a bar as tall as the letters. It follows the font size and the line height. |
| `circle` | An [avatar](avatar.md). | 40 pixels each way, the same as a medium avatar. |

Set a size with `style`, with a class of your own, or with `--nuv-skeleton-width` and `--nuv-skeleton-height`.

Two `text` skeletons one after the other are spaced like two lines of a paragraph, because each takes up exactly one line. Make the last one shorter and the block reads as text.

## In place of real content

Render the skeletons in the same parts the content will use, and swap one for the other when the data arrives.

```tsx
"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  VisuallyHidden,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [loading, setLoading] = useState(true);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        justifyItems: "start",
        width: "100%",
        maxWidth: 360,
      }}
    >
      <Button intent="secondary" onClick={() => setLoading((value) => !value)}>
        {loading ? "Finish loading" : "Load again"}
      </Button>
      <Card aria-busy={loading} style={{ width: "100%" }}>
        {loading ? (
          <>
            <CardHeader>
              <Skeleton shape="text" style={{ width: "45%" }} />
              <Skeleton shape="text" style={{ width: "70%" }} />
            </CardHeader>
            <CardContent>
              <Skeleton style={{ height: 64 }} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Northwind Traders</CardTitle>
              <CardDescription>Customer since March 2021</CardDescription>
            </CardHeader>
            <CardContent>
              Fourteen orders this year, the last one on 4 July. Nothing is
              overdue.
            </CardContent>
          </>
        )}
      </Card>
      {/* Says when the content has arrived. The skeletons themselves are
          hidden from screen readers. */}
      <VisuallyHidden role="status">
        {loading ? "Loading the customer" : "The customer has loaded"}
      </VisuallyHidden>
    </div>
  );
}
```

## Accessibility

A skeleton has no keyboard behavior, and it's hidden from screen readers with `aria-hidden`. A dozen gray boxes would otherwise be a dozen things with nothing to say.

### What the component handles

- `aria-hidden="true"` on every skeleton.
- The pulse only runs when the visitor hasn't asked for reduced motion. With reduced motion, the boxes stand still.
- Where the browser forces its own colors, a skeleton is an outline. Its fill isn't drawn there.

### What you need to handle

- **Say that something is loading.** Put `aria-busy="true"` on the region the skeletons are in, and take it off when the content is there.
- **Say when it has loaded,** if the wait was long enough to notice. `aria-busy` isn't announced by itself. A visually hidden element with `role="status"` that changes from "Loading the customer" to "The customer has loaded" is, as in the example above.
- Don't leave skeletons up when loading fails. Show an [alert](alert.md) that says what went wrong.

## CSS variables

Set any of these on the skeleton, or on anything around it.

```css
.sidebar {
  --nuv-skeleton-bg: var(--color-border);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-skeleton-width` | `100%`, `2.5rem` | Width. Differs by shape. |
| `--nuv-skeleton-height` | `1rem`, `1em`, `2.5rem` | Height. Differs by shape. On the text shape it's the height of the bar, not of the line. |
| `--nuv-skeleton-radius` | `var(--radius-md)`, `var(--radius-sm)`, `var(--radius-full)` | Corner radius. Differs by shape. |
| `--nuv-skeleton-bg` | `var(--color-muted)` | Fill color. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-skeleton` | Every skeleton. |
| `.nuv-skeleton--circle` | shape="circle" |
| `.nuv-skeleton--text` | shape="text" |

A block also has the class `nuv-skeleton--block`. It has no rules of its own, because a block is how every skeleton starts.

## Server components

Skeleton has no `"use client"` directive and uses no state, so it renders in a server component as it is. That makes it a good fit for the `fallback` of a React `Suspense` boundary, or a `loading.tsx` file in Next.js.

## Do and don't

**Do**

- Match the shape and size of the real content closely enough that nothing moves when it arrives.
- Show them only for a wait people would notice. Content that takes a tenth of a second doesn't need one.

**Don't**

- Don't draw a skeleton for every small detail. A few boxes that give the layout are enough.
- Don't use a skeleton for something that may turn out to be empty. Decide between content and an [empty state](empty.md) once you know.
