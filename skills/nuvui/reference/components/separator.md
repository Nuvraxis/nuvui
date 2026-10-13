<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/separator.mdx. Don't edit it here: run `pnpm skill`. -->

# Separator

A thin line between two pieces of content, across or upright.

Use a separator to set two things apart where space alone doesn't do it: sections of a panel, groups in a row of links. Menus and toolbars have a separator part of their own.

```tsx
import { Separator } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320, fontSize: 14 }}>
      <p style={{ margin: 0 }}>Signed in as ada@example.com</p>
      <Separator style={{ marginBlock: 12 }} />
      <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
        Last sign-in on 4 July, from Oslo.
      </p>
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
import { Separator } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` |  |
| `decorative` | `boolean` | `true` | Whether the line is only there to look at. A decorative line is hidden from screen readers. Pass `false` where the line is the only thing that says one group has ended and another begun. |

Everything else is passed to the `<div>` Radix renders, including `ref`, `className` and `style`.

## Vertical

An upright separator is as tall as the row it's in, when that row is a flex or grid container. Anywhere else it's as tall as a letter.

```tsx
import { Separator } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}
    >
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Components</span>
      <Separator orientation="vertical" />
      <span>Changelog</span>
    </div>
  );
}
```

## Space around it

A separator has no margin. Give it one with `style` or a class, or let the `gap` of the container it's in do the spacing. That way the same component works in a tight toolbar and between two page sections.

## Decorative, or not

By default a separator is decoration. It has `role="none"`, and a screen reader says nothing for it. That's right for nearly every line on a page: the headings and lists around it already say where one thing ends and the next begins.

Pass `decorative={false}` where the line is the only thing that marks a change, such as a break between two parts of a text with no heading for the second. It then has `role="separator"`, and a screen reader announces it.

```tsx
import { Separator } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320, fontSize: 14 }}>
      <p style={{ margin: 0 }}>The order was packed on Monday.</p>
      <Separator decorative={false} style={{ marginBlock: 12 }} />
      <p style={{ margin: 0 }}>A week later, nothing had arrived.</p>
    </div>
  );
}
```

Radix's own default is the other way round. This library flips it, because a line that's announced when it means nothing adds a stop to every pass through the page.

## Accessibility

A separator has no keyboard behavior. It can't take focus.

### What the component handles

- `role="none"` when it's decorative, and `role="separator"` when it isn't, with `aria-orientation` on an upright one. This part is Radix.
- The line is a border, so it's still drawn where the browser forces its own colors, as Windows high contrast does.
- An upright line is drawn with a logical property, so it works the same in a right-to-left layout.

### What you need to handle

- Decide whether the line means something. If taking it away would lose information for someone who can see it, a screen reader user needs it too.
- The default color is `--color-border`, which is pale on purpose and not meant to reach 3:1. That's fine for decoration. A line that carries meaning should use `--color-border-strong`, through `--nuv-separator-color`.

## CSS variables

Set either of these on the separator, or on anything around it.

```css
.section-break {
  --nuv-separator-color: var(--color-border-strong);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-separator-color` | `var(--color-border)` | Color of the line. |
| `--nuv-separator-size` | `var(--nuv-border-width)` | Thickness of the line. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-separator` | Every separator. |

Radix sets `data-orientation` to `horizontal` or `vertical`, which is what the styles go by.

## Server components

Separator carries `"use client"`, because the Radix primitive it wraps does. It has no state and renders the same on the server as in the browser. You can render it from a server component, as the examples on this page do.

## Do and don't

**Do**

- Try more space first. Fewer lines make a calmer page.
- Use one inside a [card](card.md) in place of a second card.

**Don't**

- Don't use a separator between the items of a list. Put a border on the items.
- Don't use it as a heading's underline. Style the heading.
