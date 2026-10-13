<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/trend.mdx. Don't edit it here: run `pnpm skill`. -->

# Trend

Which way a number moved and by how much, as an arrow, an amount and a color, with the direction in words for a screen reader.

Use a trend next to a figure to say how it compares with the one before: revenue against last month, open tickets against last week. It's text, not a control.

```tsx
import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Trend value={0.125} />
      <Trend value={-0.04} />
      <Trend value={0} />
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
import { Trend } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `number` |  | The change, as a ratio: 0.12 is a rise of 12%. Its sign says which way the arrow points, and zero is no change. |
| `good` | `"down" \| "up"` | `"up"` | Which way is the good news. A rise is, for revenue. A fall is, for costs and for errors: pass `"down"`. It only chooses the color. |
| `variant` | `"outline" \| "plain"` | `"plain"` | `"outline"` puts an edge around it, in the same color, for a trend that stands by itself. |
| `format` | `FormatNumberOptions` |  | How the amount is written, when you don't write it yourself as children. A percentage with at most one decimal unless you say otherwise. |
| `upLabel` | `string` | `"Up"` | What a screen reader says before the amount of a rise. The arrow is a picture, and the color can't be heard. Translate it with the rest of your interface. |
| `downLabel` | `string` | `"Down"` | What a screen reader says before the amount of a fall. Translate it with the rest of your interface. |
| `flatLabel` | `string` | `"No change"` | What a screen reader says when the value is zero, in place of the amount. Translate it with the rest of your interface. |

Everything else is passed to the `<span>`, including `ref` and `className`.

## The value

`value` is a ratio, so `0.125` is written as 12.5%. Its sign chooses the arrow: above zero points up, below zero points down, and zero is a level line.

The amount is written without its sign. The arrow shows the direction, and a screen reader hears it in words, so "Down 4%" isn't followed by a minus that would be read as well.

## When down is good

Green for a rise and red for a fall is right for revenue and wrong for costs. `good="down"` swaps the two colors and leaves the arrows as they are.

```tsx
import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "0.5rem 2rem",
        margin: 0,
      }}
    >
      <dt>Revenue</dt>
      <dd style={{ margin: 0 }}>
        <Trend value={0.082} />
      </dd>
      <dt>Failed payments</dt>
      <dd style={{ margin: 0 }}>
        <Trend value={-0.31} good="down" />
      </dd>
      <dt>Time to first reply</dt>
      <dd style={{ margin: 0 }}>
        <Trend value={0.15} good="down" />
      </dd>
    </dl>
  );
}
```

## Outline

`variant="outline"` puts an edge around the trend, in its own color. Use it for a trend that stands alone, away from the number it belongs to.

```tsx
import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Trend variant="outline" value={0.125} />
      <Trend variant="outline" value={-0.04} />
      <Trend variant="outline" value={0} />
    </>
  );
}
```

## Your own text

Children replace the amount. The value still chooses the arrow and the color, so it can be any number with the right sign. To keep the number and write it another way, pass `format`, which takes what [`FormattedNumber`](formatted-number.md) does.

```tsx
import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Trend value={12}>12 more seats</Trend>
      <Trend value={-3} good="down">
        3 fewer open tickets
      </Trend>
      <Trend value={1.8} format={{ format: "decimal" }} />
    </>
  );
}
```

## Accessibility

A trend has no keyboard behavior. It isn't a control and can't take focus.

### What the component handles

- The direction is in the page as words: "Up", "Down" or "No change". Nobody sees them, and a screen reader reads them before the amount. The arrow is hidden from it.
- With no change, the words are read in place of "0%".
- The colors are the theme's success and danger colors, which have at least 4.5:1 as text on the page and on a surface in every theme.
- The arrow is drawn in the text's color, so it's still there where the browser forces its own colors.

### What you need to handle

- Translate the three labels. [Translation](../translation.md) lists them with every other piece of text the library writes.
- Say what the change is measured against. "Up 12.5%" needs "against last month" beside it.
- Color isn't the message. The arrow and the words carry it, so a trend still works for someone who can't tell green from red. Don't hide the arrow.

## CSS variables

Set any of these on the trend, or on anything around it.

```css
.quiet-trend {
  --nuv-trend-fg: var(--color-muted-foreground);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-trend-gap` | `calc(var(--spacing) * 0.5)` | Space between the arrow and the amount. |
| `--nuv-trend-font-size` | `var(--text-sm)`, `var(--text-xs)` | Font size. Smaller by default on an outlined trend. |
| `--nuv-trend-fg` | `var(--color-success)`, `var(--color-danger)`, `var(--color-muted-foreground)` | Color of the text and the arrow. Differs by direction. Keep it at 4.5:1 against what's behind it. |
| `--nuv-trend-padding-block` | `calc(var(--spacing) * 0.5)` | Padding above and below, on an outlined trend. |
| `--nuv-trend-padding-inline` | `calc(var(--spacing) * 2)` | Padding left and right, on an outlined trend. |
| `--nuv-trend-border` | `currentcolor` | Border color of an outlined trend. The text's color by default. |
| `--nuv-trend-radius` | `var(--radius-full)` | Corner radius of an outlined trend. A pill by default. |
| `--nuv-trend-bg` | `var(--color-surface)` | Background color of an outlined trend. |
| `--nuv-trend-icon-size` | `0.875em` | Width and height of the arrow. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-trend` | Every trend. |
| `.nuv-trend--bad` | The value moved the other way. |
| `.nuv-trend--good` | The value moved the good way: up, or down with good="down". |
| `.nuv-trend--neutral` | The value is zero. |
| `.nuv-trend--outline` | variant="outline", next to the direction's class. |
| `.nuv-trend__icon` | The arrow. |
| `.nuv-trend__label` | The direction in words, drawn for nobody. |

The direction itself is in a `data-direction` attribute: `up`, `down` or `flat`.

## Server components

Trend has no `"use client"` directive and uses no state, so it renders in a server component as it is.

## Do and don't

**Do**

- Put it right after the figure it's about, or in a [stat](stat.md)'s description.
- Use `good="down"` for anything where less is better.

**Don't**

- Don't pass a percentage as the value. 12.5 is a rise of 1,250%.
- Don't use it as a badge for a state. A state that isn't a change is a [badge](badge.md).
