<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/scroll-progress.mdx. Don't edit it here: run `pnpm skill`. -->

# ScrollProgress

A bar that fills as the page, or a box, is scrolled, to show how far through it the reader is. It's drawn for the eye only, and still for anyone who asked for less motion.

Use scroll progress over a long read, such as release notes, a policy or an article, where it helps to see how much is left. It follows the page, or one box that scrolls.

```tsx
"use client";

import { ScrollProgress } from "@nuvui/react";
import { useRef } from "react";

const sections = [
  {
    title: "What changed",
    text: "Invoices can now be sent in the customer's own currency. The rate is fixed on the day the invoice is raised, and shown on it.",
  },
  {
    title: "Who it's for",
    text: "Any team that bills customers abroad. Nothing changes for invoices in your own currency.",
  },
  {
    title: "How to turn it on",
    text: "Open Billing, then Currencies, and choose the ones you bill in. Each customer can then be given one of them.",
  },
  {
    title: "What it costs",
    text: "Nothing more on any plan. The bank's own fees for a payment in another currency still apply.",
  },
  {
    title: "What's next",
    text: "Rates that follow the market until an invoice is paid, for teams that would rather the customer took the risk.",
  },
];

export default function Example() {
  const article = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        position: "relative",
        inlineSize: "100%",
        maxInlineSize: 480,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <ScrollProgress
        target={article}
        style={{ position: "absolute", insetBlockStart: 0, zIndex: 1 }}
      />
      <section
        ref={article}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable with the keyboard
        tabIndex={0}
        aria-label="Release notes"
        style={{ blockSize: 260, overflowY: "auto", padding: 20 }}
      >
        <h2 style={{ marginBlock: "0 12px", fontSize: "var(--text-lg)" }}>
          Invoices in your customer's currency
        </h2>
        {sections.map((section) => (
          <div key={section.title}>
            <h3
              style={{ marginBlock: "16px 4px", fontSize: "var(--text-base)" }}
            >
              {section.title}
            </h3>
            <p style={{ margin: 0 }}>{section.text}</p>
          </div>
        ))}
      </section>
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
import { ScrollProgress } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `target` | `RefObject<HTMLElement \| null>` |  | The box whose scrolling it follows. Left out, it follows the page. |
| `axis` | `"block" \| "inline"` | `"block"` | Which scrolling it follows: `"block"` is down the page, `"inline"` along the line, counted from where a line starts, in a box that reads right to left too. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Which way the bar runs: `"horizontal"` fills from where a line starts, and `"vertical"` from the top. |

It's a `div`, and takes what a `div` takes, including `ref`, `className` and `style`.

## What it follows

Give it a ref to a box that scrolls as `target`, and it follows that box. Without one, it follows the page.

Where the bar sits is yours to say. It takes the width of where it's put, and no more room than its own thickness. Over the top of a box, it can be placed on the box's edge:

```tsx
const notes = useRef<HTMLDivElement>(null);

<div style={{ position: "relative" }}>
  <ScrollProgress
    target={notes}
    style={{ position: "absolute", insetBlockStart: 0 }}
  />
  <div ref={notes} style={{ blockSize: 400, overflowY: "auto" }}>
    …
  </div>
</div>
```

For the page, fix it to the top of the window, or put it in a header that stays there:

```tsx
<ScrollProgress
  style={{ position: "fixed", insetBlockStart: 0, insetInline: 0, zIndex: 10 }}
/>
```

A box with nothing to scroll leaves the bar empty. When what's in the box grows or shrinks with no scroll, as when an image loads, the bar keeps up.

## Along the line

With `axis="inline"`, it follows scrolling along the line, for a row of cards or a wide table. It counts from where a line starts, so in a box that reads right to left it fills as the row is scrolled to the left.

```tsx
"use client";

import { ScrollProgress } from "@nuvui/react";
import { type CSSProperties, useRef } from "react";

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
  const row = useRef<HTMLUListElement>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 480,
      }}
    >
      <ul
        ref={row}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable with the keyboard
        tabIndex={0}
        aria-label="Months"
        style={{
          display: "flex",
          gap: 8,
          margin: 0,
          padding: "0 0 8px",
          overflowX: "auto",
          listStyle: "none",
        }}
      >
        {months.map((month) => (
          <li
            key={month}
            style={{
              flex: "none",
              inlineSize: 120,
              padding: 12,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {month}
          </li>
        ))}
      </ul>
      <ScrollProgress
        target={row}
        axis="inline"
        style={
          {
            "--nuv-scroll-progress-track": "var(--color-muted)",
            "--nuv-scroll-progress-radius": "var(--radius-full)",
          } as CSSProperties
        }
      />
    </div>
  );
}
```

With `orientation="vertical"`, the bar stands up beside the box and fills from the top. Its height is the height of where it's put.

## Accessibility

Scroll progress is `aria-hidden`, and can't take focus. A screen reader already knows where it is on the page, and a bar that changed with every scroll would only get in the way.

### What the component handles

- It's hidden from screen readers, and a pointer goes through it.
- The bar fills with a transform, so a scroll lays nothing out again, and React renders nothing when the page is scrolled.
- Where motion is fine, the bar glides to where the scroll is, which smooths the steps of a mouse wheel. For a visitor who asked for less motion, it follows the scroll exactly.
- In a right-to-left layout, the bar fills from the right.
- Where the browser forces its own colors, the bar is drawn in the highlight color, on the page's own.

### What you need to handle

- A box that scrolls has to be reachable with the keyboard: give it `tabIndex={0}`, a role such as `region` or `section`, and a name, unless something in it can take focus already.
- Keep it thin, and out of the way of what's being read.

## CSS variables

Set any of these on the `ScrollProgress`, or on anything around it.

```css
.reading {
  --nuv-scroll-progress-size: 2px;
  --nuv-scroll-progress-color: var(--color-chart-2);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-scroll-progress-size` | `0.25rem` | How thick the bar is. |
| `--nuv-scroll-progress-radius` | `0` | How round the bar's ends are. |
| `--nuv-scroll-progress-track` | `transparent` | The color behind the bar, where it hasn't filled. None by default. |
| `--nuv-scroll-progress-color` | `var(--color-primary)` | The bar's color. |
| `--nuv-scroll-progress-value` | `0` | How far through the scroll is, from 0 to 1. The component writes this. Don't set it. |
| `--nuv-scroll-progress-duration` | `var(--nuv-duration-base)` | How long the bar takes to catch up with the scroll, where motion is fine. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-scroll-progress` | ScrollProgress: the track. |
| `.nuv-scroll-progress__bar` | The bar that fills. |

Which way it runs is in a `data-orientation` attribute: `horizontal` or `vertical`.

## Server components

ScrollProgress starts with `"use client"`: it listens for scrolling. On the server it's an empty bar. Its `target` is a ref, so the component that renders it is a client component too.

## Do and don't

**Do**

- Use it for one long read, where knowing what's left helps.
- Put it where the eye already is: the top of the page, or the top of the box.

**Don't**

- Don't use it to show a task's progress. That's [Progress](progress.md).
- Don't put several on one screen.
