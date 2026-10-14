<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/aspect-ratio.mdx. Don't edit it here: run `pnpm skill`. -->

# AspectRatio

A box that keeps its shape at any width, for pictures, videos, maps and anything else that loads late.

Use `AspectRatio` around something whose height should follow its width: a picture in a card, an embedded video, a map. The box has its shape before the content has loaded, so nothing below it moves when the content arrives.

```tsx
import { AspectRatio } from "@nuvui/react";

// A picture kept in the file, so the example doesn't depend on another site.
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23bfdbfe'/%3E%3Ccircle cx='300' cy='80' r='36' fill='%23fde68a'/%3E%3Cpath d='M0 300l120-150 80 90 60-60 140 120z' fill='%231e3a8a'/%3E%3C/svg%3E";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <AspectRatio ratio={16 / 9} style={{ borderRadius: "var(--radius-lg)" }}>
        <img src={picture} alt="Mountains under a low sun" />
      </AspectRatio>
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
import { AspectRatio } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `ratio` | `number` |  | Width divided by height: `16 / 9`, `4 / 3`, `1`. Leave it out to set `--nuv-aspect-ratio-value` in CSS instead, where it can change at a breakpoint. |

Everything else is passed to the `<div>`, including `ref`, `className` and `style`.

## Ratios

`ratio` is the width divided by the height. Write it as the division, so it reads the way people say it: `16 / 9`, `4 / 3`.

```tsx
import { AspectRatio } from "@nuvui/react";

const ratios = [
  ["1 / 1", 1],
  ["4 / 3", 4 / 3],
  ["16 / 9", 16 / 9],
] as const;

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
        alignItems: "start",
        width: "100%",
        maxWidth: 420,
      }}
    >
      {ratios.map(([name, ratio]) => (
        <AspectRatio key={name} ratio={ratio}>
          <div
            style={{
              display: "grid",
              placeItems: "center",
              backgroundColor: "var(--color-muted)",
              fontSize: 14,
            }}
          >
            {name}
          </div>
        </AspectRatio>
      ))}
    </div>
  );
}
```

The box is as wide as its container. Put it inside something that sets the width.

## What goes inside

Give it one child. The child fills the box.

- A picture or a video keeps its own proportions and is cropped to fit, from the center. Set `--nuv-aspect-ratio-fit` to `contain` to show all of it with empty bands instead.
- Anything else, such as an `iframe` or a `div`, is stretched to the box.

Content that's taller than the box is cut off. This is a frame for media, not a container for text.

## A different ratio on a larger screen

Leave `ratio` out and set `--nuv-aspect-ratio-value` in your CSS, where a media query can change it. The prop writes the same variable as an inline style, which a stylesheet can't override. So use one or the other.

```css title="responsive.css"
.hero-media {
  --nuv-aspect-ratio-value: 1;
}

@media (width >= 40rem) {
  .hero-media {
    --nuv-aspect-ratio-value: 21 / 9;
  }
}
```

```tsx
import { AspectRatio } from "@nuvui/react";
import "./responsive.css";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <AspectRatio className="hero-media">
        <div
          style={{
            display: "grid",
            placeItems: "center",
            backgroundColor: "var(--color-muted)",
            fontSize: 14,
          }}
        >
          Square on a phone, wide from 640 pixels
        </div>
      </AspectRatio>
    </div>
  );
}
```

## Accessibility

The box has no role and no keyboard behavior. What's inside it carries the meaning.

### What you need to handle

- Give a picture an `alt` that says what it shows, or `alt=""` if it's decoration.
- Cropping can cut off the part of a picture that matters. Check the picture at the widths the layout uses, or set `object-position` on it.
- Give an `iframe` a `title`.

## CSS variables

Set any of these on the box, or on anything around it.

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-aspect-ratio-radius` | `0` | Corner radius. The content is clipped to it. |
| `--nuv-aspect-ratio-value` | `1` | The ratio, as CSS writes it: 16 / 9. The ratio prop sets this on the element. |
| `--nuv-aspect-ratio-fit` | `cover` | How a picture or a video fits the box: cover crops it, contain shows all of it. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-aspect-ratio` | The box. |

## Server components

AspectRatio has no `"use client"` directive and uses no state, so it renders in a server component as it is.

It's built on the CSS `aspect-ratio` property and not on Radix's primitive. That gives one element in place of two, and a ratio that CSS can change at a breakpoint.

## Do and don't

**Do**

- Use the same ratio for every picture in a grid.
- Pick a ratio close to the pictures you have, so little is cropped.

**Don't**

- Don't use it to square off a box of text. Text needs the height it needs.
- Don't set a height on it. The width and the ratio decide the height.
