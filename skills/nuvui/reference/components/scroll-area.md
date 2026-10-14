<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/scroll-area.mdx. Don't edit it here: run `pnpm skill`. -->

# ScrollArea

A box that scrolls, with a scrollbar that looks the same in every browser and on every system.

Use a scroll area for a part of the page that scrolls by itself: a long list in a panel, a row of cards that runs off the side. Scrolling is still the browser's own, so the wheel, a trackpad, a finger and the keyboard all work as they do anywhere. Only the scrollbar is drawn by the component.

The page itself should scroll the ordinary way. Don't wrap a whole page in this.

```tsx
import { ScrollArea } from "@nuvui/react";

const releases = Array.from(
  { length: 30 },
  (_, index) => `Release 2.${30 - index}`,
);

export default function Example() {
  return (
    <ScrollArea
      aria-label="Releases"
      style={{
        width: "100%",
        maxWidth: 260,
        height: 200,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <ul
        style={{
          margin: 0,
          padding: "8px 16px",
          listStyle: "none",
          fontSize: 14,
        }}
      >
        {releases.map((release) => (
          <li key={release} style={{ paddingBlock: 6 }}>
            {release}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { ScrollArea } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"both" \| "horizontal" \| "vertical"` | `"vertical"` | Which way the content scrolls. |
| `type` | `"always" \| "auto" \| "hover" \| "scroll"` | `"auto"` | When the scrollbar shows. `"auto"` shows it whenever there's more content than fits, `"always"` even when there isn't, `"scroll"` only while scrolling, and `"hover"` while scrolling or under the pointer. |
| `viewportRef` | `Ref<HTMLDivElement>` |  | A ref to the element that scrolls, for reading or setting its scroll position. The component's own `ref` is the box around it. |
| `nonce` | `string` |  | Hiding the browser's own scrollbar takes a `style` element. A page with a content security policy that asks for a nonce passes it here. |

These come from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `scrollHideDelay` | `number` |  | With `type` set to `"scroll"` or `"hover"`, how long the scrollbar stays after scrolling stops or the pointer leaves, in milliseconds. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction, which decides the side the scrollbar is on. It's taken from `DirectionProvider` when not set. |

Everything else is passed to the outer `<div>`, including `ref`, `className` and `style`. `aria-label` and `aria-labelledby` are the exception: [they go to the element that scrolls](#from-the-keyboard).

## Give it a height

A scroll area scrolls once its content is taller than it is, so it needs a height, or a maximum. Set either with `style`, with a class, or with `--nuv-scroll-area-height` and `--nuv-scroll-area-max-height`.

With only a maximum, a short list stays short and a long one stops growing and starts to scroll.

```tsx
"use client";

import { Button, ScrollArea } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [count, setCount] = useState(3);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 260 }}>
      <Button intent="secondary" size="sm" onClick={() => setCount(count + 3)}>
        Add three rows
      </Button>
      <ScrollArea
        aria-label="Rows"
        style={{
          maxHeight: "10rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <ul
          style={{
            margin: 0,
            padding: "8px 16px",
            listStyle: "none",
            fontSize: 14,
          }}
        >
          {Array.from({ length: count }, (_, index) => `Row ${index + 1}`).map(
            (row) => (
              <li key={row} style={{ paddingBlock: 6 }}>
                {row}
              </li>
            ),
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
```

## Sideways

`orientation="horizontal"` scrolls sideways and puts the scrollbar along the bottom. `"both"` scrolls each way.

```tsx
import { ScrollArea } from "@nuvui/react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Example() {
  return (
    <ScrollArea
      orientation="horizontal"
      aria-label="Months"
      style={{ width: "100%", maxWidth: 360 }}
    >
      <div style={{ display: "flex", gap: 12, paddingBlockEnd: 16 }}>
        {months.map((month) => (
          <div
            key={month}
            style={{
              flex: "none",
              width: 120,
              padding: 16,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              fontSize: 14,
            }}
          >
            {month}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

With `"vertical"`, long lines wrap and the area never scrolls sideways. With the other two, content is laid out at its full width, which is what makes it scroll.

Leave room for the bar. It's drawn over the content's edge, 10 pixels thick, so content that runs right up to that edge sits under it. The example above has padding at the bottom for that.

## When the scrollbar shows

The default, `type="auto"`, shows the scrollbar whenever there's more content than fits. A bar that only appears on hover hides the one sign that there's more to see, and there's no hover on a touch screen.

Use `"hover"` or `"scroll"` where the content makes it plain that it goes on, such as a row of cards with one cut off at the edge.

## From the keyboard

Someone who doesn't use a mouse scrolls a box by moving focus into it and pressing the arrow keys. When the content holds a link or a button, focus gets there by itself. When it's only text, nothing inside can take focus, so the box has to.

The scroll area handles that. While its content scrolls and holds nothing that takes focus, the element that scrolls becomes a stop for the <kbd>Tab</kbd> key, with `role="group"` and the `aria-label` or `aria-labelledby` you gave the scroll area. Otherwise it's not a tab stop, and the name isn't used.

So always pass a name. It's what a screen reader says when focus lands on the box. The one case where it can be left out is inside a dialog: with no name of its own, the box takes the dialog's.

Chrome and Firefox make a scrolling box a tab stop on their own. Safari doesn't, which is why this is done here.

## A content security policy

Hiding the browser's own scrollbar takes a `<style>` element, which Radix adds next to the scroll area. A policy that doesn't allow inline styles blocks it, and both scrollbars then show. Pass the page's nonce as `nonce` and it's set on that element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the first control inside, or to the box itself when there's none and it scrolls. |
| Arrow keys, <kbd>Page Up</kbd>, <kbd>Page Down</kbd>, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>Space</kbd> | Scroll the box, once focus is in it. This is the browser's own behavior. |

The scrollbar itself can't take focus. It's a pointer's way to scroll, and the keys above are the keyboard's.

### What the component handles

- Scrolling is native, so screen readers, touch, and "find in page" work as usual.
- The tab stop, role and name described above.
- The focus ring is drawn inside the box, where it isn't cut off.
- The thumb has at least 3:1 against the page in every theme, and it's drawn where the browser forces its own colors.
- The scrollbar is on the left in a right-to-left layout.

### What you need to handle

- Pass `aria-label` or `aria-labelledby`.
- Don't put a scroll area inside another that scrolls the same way. Whichever is under the pointer scrolls, and people get stuck in the inner one.
- Keep it tall enough to read in. A box that shows two lines of a long text is harder to use than a link to the text.

## CSS variables

Set any of these on the scroll area, or on anything around it.

```css
.side-panel {
  --nuv-scroll-area-max-height: 24rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-scroll-area-height` | `auto` | Height of the area. |
| `--nuv-scroll-area-max-height` | `none` | The tallest the area gets before it scrolls. |
| `--nuv-scroll-area-radius` | `0` | Corner radius. The content and the focus ring follow it. |
| `--nuv-scroll-area-scrollbar-padding` | `2px` | Space around the thumb. |
| `--nuv-scroll-area-scrollbar-size` | `0.625rem` | Thickness of the scrollbar, padding included. |
| `--nuv-scroll-area-thumb` | `var(--color-border-strong)` | Color of the thumb. Keep it at 3:1 against what's behind it. |
| `--nuv-scroll-area-thumb-hover` | `var(--color-muted-foreground)` | Color of the thumb under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-scroll-area` | The outer element, which you size. |
| `.nuv-scroll-area__corner` | The square where two scrollbars meet. |
| `.nuv-scroll-area__scrollbar` | A scrollbar. `data-orientation` says which. |
| `.nuv-scroll-area__thumb` | The part of a scrollbar that's dragged. |
| `.nuv-scroll-area__viewport` | The element that scrolls. |

## Server components

ScrollArea is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the first example on this page does.

Before the scripts have run, the content is there and scrolls, with no scrollbar drawn.

## Do and don't

**Do**

- Use it where the look of the scrollbar matters: a panel in a designed interface, a dark sidebar.
- Use plain `overflow: auto` where it doesn't. The browser's scrollbar is free and familiar.

**Don't**

- Don't hide the scrollbar to make a design look cleaner.
- Don't use a scroll area to fit a long form into a small box. Let the page scroll.
