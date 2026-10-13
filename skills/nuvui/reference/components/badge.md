<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/badge.mdx. Don't edit it here: run `pnpm skill`. -->

# Badge

A short label that says what state something is in, or how many of something there are.

Use a badge for a word or a number next to the thing it describes: the status of an invoice, the plan a customer is on, a count of unread messages. A badge is text, not a control. For something people press, use a [button](button.md) or a [toggle](toggle.md).

```tsx
import { Badge } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Badge>Draft</Badge>
      <Badge intent="primary">New</Badge>
      <Badge intent="success">Paid</Badge>
      <Badge intent="warning">Due soon</Badge>
      <Badge intent="danger">Overdue</Badge>
    </>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Badge } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `intent` | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` | What the badge says about the thing it's on. The color is extra: the text has to carry the meaning by itself. |
| `variant` | `"outline" \| "solid"` | `"solid"` | `"solid"` is filled with the intent's color. `"outline"` has an edge in that color on a plain background, for a row where many filled badges would be too loud. |

Everything else is passed to the `<span>`, including `ref` and `className`.

## Outline

`variant="outline"` gives a plain background with an edge in the intent's color. Use it where a column of filled badges would pull the eye away from everything else, as in a long table.

```tsx
import { Badge } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Badge variant="outline">Draft</Badge>
      <Badge variant="outline" intent="primary">
        New
      </Badge>
      <Badge variant="outline" intent="success">
        Paid
      </Badge>
      <Badge variant="outline" intent="warning">
        Due soon
      </Badge>
      <Badge variant="outline" intent="danger">
        Overdue
      </Badge>
    </>
  );
}
```

An outlined success, warning or danger badge has its text in that color too. An outlined primary badge keeps the ordinary text color: a theme's primary color only has to stand out as an edge, at 3:1, and that isn't enough for text.

## With an icon or a number

An icon goes inside, before the text. A badge that only shows a number needs words for a screen reader, since "12" by itself says nothing. Put them in [`VisuallyHidden`](visually-hidden.md).

```tsx
import { Badge, VisuallyHidden } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Badge intent="success">
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5l2.25 2.25L9.5 3.5" />
        </svg>
        Verified
      </Badge>
      <Badge intent="danger">
        12
        <VisuallyHidden> failed jobs</VisuallyHidden>
      </Badge>
    </>
  );
}
```

## The colors

A filled badge takes its colors from the theme's tokens, so it follows every preset and both modes.

| Intent | Fill | Text |
| --- | --- | --- |
| `neutral` | `--color-muted` | `--color-foreground` |
| `primary` | `--color-primary` | `--color-primary-foreground` |
| `success` | `--color-success` | `--color-background` |
| `warning` | `--color-warning` | `--color-background` |
| `danger` | `--color-danger` | `--color-danger-foreground` |

The success and warning colors are chosen to be readable as text on the page's background. Contrast is the same both ways round, so the background color is readable as text on them. Every pair in the table has at least 4.5:1 in every theme, and the tests measure each one.

## Accessibility

A badge has no keyboard behavior. It isn't a control and can't take focus.

### What the component handles

- It's a `<span>`, read in place with the text around it.
- Text has at least 4.5:1 against the badge in every intent, variant and theme.
- A filled badge has a border that only shows where the browser forces its own colors, as Windows high contrast does. The fill isn't drawn there, and the border is what keeps the badge a badge.

### What you need to handle

- Say the state in words. Color is extra: plenty of people can't tell red from green, and a badge that says "Overdue" works for them where a red dot doesn't.
- Give a count its unit, in `VisuallyHidden` if there's no room for it.
- A badge that changes while the page is open isn't announced. If the change matters, such as a job that just failed, say it in a [toast](toast.md) or an element with `role="status"`.

## CSS variables

Set any of these on the badge, or on anything around it. A variable set this way applies whatever the intent.

```css
.plan-badge {
  --nuv-badge-radius: var(--radius-sm);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-badge-gap` | `var(--spacing)` | Space between an icon and the text. |
| `--nuv-badge-padding-block` | `calc(var(--spacing) * 0.5)` | Padding above and below the text. |
| `--nuv-badge-padding-inline` | `calc(var(--spacing) * 2)` | Padding left and right. |
| `--nuv-badge-border` | `transparent`, `var(--color-border-strong)`, `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)` | Border color. Transparent on a filled badge, and the intent's color on an outlined one. |
| `--nuv-badge-radius` | `var(--radius-full)` | Corner radius. A pill by default. |
| `--nuv-badge-font-size` | `var(--text-xs)` | Font size. |
| `--nuv-badge-bg` | `var(--color-muted)`, `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)`, `var(--color-surface)` | Background color. Differs by intent. |
| `--nuv-badge-fg` | `var(--color-foreground)`, `var(--color-primary-foreground)`, `var(--color-background)`, `var(--color-danger-foreground)`, `var(--color-surface-foreground)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)` | Text color. Differs by intent. Keep it at 4.5:1 against the background. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-badge` | Every badge. |
| `.nuv-badge--danger` | intent="danger" |
| `.nuv-badge--neutral` | intent="neutral" |
| `.nuv-badge--outline` | variant="outline", next to the intent's class. |
| `.nuv-badge--primary` | intent="primary" |
| `.nuv-badge--success` | intent="success" |
| `.nuv-badge--warning` | intent="warning" |

## Server components

Badge has no `"use client"` directive and uses no state, so it renders in a server component as it is.

## Do and don't

**Do**

- Keep it to one or two words.
- Use the same intent for the same state everywhere in the app.

**Don't**

- Don't use a badge as a button. It has no focus ring and no keyboard behavior.
- Don't put a sentence in one. A badge stays on one line and doesn't wrap.
