<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/holo-card.mdx. Don't edit it here: run `pnpm skill`. -->

# HoloCard

A 3D tilting card with a pointer-tracked holographic glare and texture overlay, built for membership cards, passes, and collectibles.

Use a holo card for the one thing on a screen that's meant to feel like an object: a membership card, an event pass, a badge someone earned. It's decoration. For content in a box, use a [card](card.md).

```tsx
import { HoloCard } from "@nuvui/react";
import type { CSSProperties } from "react";

// The face's colors are the card's, so the glare and the texture lie on
// the face and the words float over them.
const face = {
  "--nuv-holo-card-bg": "var(--color-primary)",
  "--nuv-holo-card-fg": "var(--color-primary-foreground)",
  inlineSize: "100%",
  maxInlineSize: 340,
} as CSSProperties;

export default function Example() {
  return (
    <HoloCard style={face}>
      <div style={{ display: "grid", gap: 24, padding: 24 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: "var(--text-sm)" }}>Northwind Rewards</span>
          <strong style={{ fontSize: "var(--text-xl)" }}>Gold member</strong>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span>Sajan</span>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            4821 0093 5567
          </span>
        </div>
      </div>
    </HoloCard>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { HoloCard } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `shine` | `boolean` | `true` | Whether a shine is drawn across it under the pointer. |
| `texture` | `boolean` | `true` | Whether an embossed texture is drawn on its face: fine lines pressed into the card, which catch the light under the pointer. |
| `lift` | `boolean` | `true` | Whether what's on it rises off its face while the pointer is on the card, so that it floats over the face as the card tilts. |
| `disabled` | `boolean` | `false` | It lies flat and doesn't follow the pointer. |

It's a `div`, and takes what a `div` takes, including `ref` and `className`.

## The face and what's on it

The card has a face, and what you put in it lies on that face. Give the face its color with `--nuv-holo-card-bg`, which takes anything `background` does, a picture included, and the text its color with `--nuv-holo-card-fg`.

```tsx
<HoloCard
  style={{
    "--nuv-holo-card-bg": "var(--color-primary)",
    "--nuv-holo-card-fg": "var(--color-primary-foreground)",
  }}
>
  <MemberCard />
</HoloCard>
```

The glare and the texture are drawn on the face, under the content. So don't give what you put in the card a background of its own: it would cover them.

## Floating content

While the pointer is on the card, what's on it rises off the face toward you, and throws a shadow on the face away from the pointer. As the card tilts, the words move against the face behind them, which is what makes them look as if they float. At rest they lie on the face, at the size you gave them.

`lift={false}` keeps them on the face. `--nuv-holo-card-lift` says how far they rise.

Nothing is cut off at the card's edges, since cutting would press everything flat again. Keep what's in the card inside its padding.

## How it moves

A mouse or a pen over the card tilts it, with the side under the pointer going down as if pressed, and draws a shine where the pointer is. When the pointer leaves, the card goes flat again.

A finger doesn't move it. A finger on a card is usually on its way to scroll the page, and a card that turned under it would get in the way. The keyboard doesn't move it either. So nothing the card says may depend on the tilt or the shine.

## Your own look

How far it tilts, its corners and the shine are CSS variables. The shine's colored band is the theme's primary, success, warning and danger colors unless you give it a gradient of your own.

```tsx
import { HoloCard } from "@nuvui/react";
import type { CSSProperties } from "react";

// A steeper tilt, square corners, words that rise further, and a foil
// of one color where the default has the theme's four.
const look = {
  "--nuv-holo-card-bg": "var(--color-surface)",
  "--nuv-holo-card-fg": "var(--color-surface-foreground)",
  "--nuv-holo-card-lift": "2.5rem",
  "--nuv-holo-card-tilt": "14deg",
  "--nuv-holo-card-radius": "var(--radius-sm)",
  "--nuv-holo-card-foil":
    "linear-gradient(115deg, transparent 30%, var(--color-warning) 50%, transparent 70%)",
  inlineSize: "100%",
  maxInlineSize: 340,
} as CSSProperties;

export default function Example() {
  return (
    <HoloCard style={{ ...look, boxShadow: "0 0 0 1px var(--color-border)" }}>
      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 24,
        }}
      >
        <span
          style={{
            color: "var(--color-muted-foreground)",
            fontSize: "var(--text-sm)",
          }}
        >
          Sales kickoff 2027
        </span>
        <strong style={{ fontSize: "var(--text-xl)" }}>Speaker</strong>
        <span>Tom Becker, Finance</span>
      </div>
    </HoloCard>
  );
}
```

## The texture

On the card's face is an embossed texture: fine lines pressed into it both ways, each a line of light beside a line of shade. It's faint while the card is at rest, and shows more under the pointer, where it catches the light. `texture={false}` leaves it out.

```tsx
<HoloCard texture={false}>
  <MemberCard />
</HoloCard>
```

The pattern is a CSS variable, `--nuv-holo-card-texture`, which takes any background image: gradients of your own, or a picture of a pattern.

## Accessibility

A holo card has no role and no keyboard behavior. It can't take focus. What's in it can, and is read, pressed and selected as it would be anywhere.

### What the component handles

- The shine and the texture are hidden from screen readers and let presses through to what's under them.
- For a visitor who asked for less motion, the card doesn't tilt, has no shine, and its content stays on the face. The texture stays, and doesn't change.
- Where the browser forces its own colors, there's no shine and no texture.
- The shine and the texture are on the face, under the content. Neither is ever over the text.

### What you need to handle

- The texture and the shine change the face's color behind the text a little, the shine only while the pointer is on the card. Keep text on the card well above 4.5:1 against the face, or lower `--nuv-holo-card-texture-opacity` and `--nuv-holo-card-shine-opacity`. An automatic check can't measure text over a pattern, so look at it yourself.
- Don't put anything on a card that needs careful aim, such as a small link. The card moves a little under the pointer.
- Use one on a screen, not a grid of them.

## CSS variables

Set any of these on the `HoloCard`, or on anything around it.

```css
.pass {
  --nuv-holo-card-tilt: 12deg;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-holo-card-radius` | `var(--radius-xl)` | Corner radius of the card and its face. |
| `--nuv-holo-card-perspective` | `50rem` | How far away the card is looked at from. A smaller distance makes the tilt look deeper. |
| `--nuv-holo-card-bg` | `transparent` | The face: a color, a gradient or a picture. Anything background takes. |
| `--nuv-holo-card-fg` | `inherit` | Color of the text on the card. |
| `--nuv-holo-card-pointer-y` | `0.5` | Where the pointer is down the card, from 0 to 1. The component writes this. Don't set it. |
| `--nuv-holo-card-tilt` | `8deg` | How far it turns when the pointer is at an edge. |
| `--nuv-holo-card-pointer-x` | `0.5` | Where the pointer is across the card, from 0 to 1. The component writes this. Don't set it. |
| `--nuv-holo-card-duration` | `400ms` | How long it takes to go flat again, and the shine to fade. |
| `--nuv-holo-card-lift` | `1.5rem` | How far the content rises off the face under the pointer. |
| `--nuv-holo-card-shadow` | `var(--color-black)` | Color of the shadow the risen content throws on the face. |
| `--nuv-holo-card-texture` | `repeating-linear-gradient(45deg, color-mix(in oklab, var(--color-white) 70%, transparent) 0 1px, color-mix(in oklab, var(--color-black) 55%, transparent) 1px 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, color-mix(in oklab, var(--color-white) 70%, transparent) 0 1px, color-mix(in oklab, var(--color-black) 55%, transparent) 1px 2px, transparent 2px 7px)` | The texture, as a background image. Lines both ways unless you give it another. |
| `--nuv-holo-card-texture-opacity` | `0.2` | How strong the texture is at rest. Under the pointer it's two and a half times this. |
| `--nuv-holo-card-glare` | `var(--color-white)` | Color of the soft light under the pointer. |
| `--nuv-holo-card-foil` | `linear-gradient(115deg, transparent 25%, var(--color-primary) 38%, var(--color-success) 46%, var(--color-warning) 54%, var(--color-danger) 62%, transparent 75%)` | The colored band, as a gradient. It's drawn two and a half times the card's size and slides with the pointer. |
| `--nuv-holo-card-shine-opacity` | `0.7` | How strong the shine is while the pointer is on the card. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-holo-card` | HoloCard. The box the pointer is measured in, which doesn't turn. |
| `.nuv-holo-card--lift` | With lift. The content rises off the face under the pointer. |
| `.nuv-holo-card__content` | What you put in, over the face. |
| `.nuv-holo-card__shine` | The shine, on the face. |
| `.nuv-holo-card__surface` | The face. It's what turns. |
| `.nuv-holo-card__texture` | The embossed texture, on the face. |

While a pointer is on it the card has a `data-active` attribute, and with `disabled` a `data-disabled` one.

## Server components

HoloCard starts with `"use client"`: it follows the pointer. It takes no functions, so a server component can render it and put server-rendered content in it.

## Do and don't

**Do**

- Give it a face with `--nuv-holo-card-bg`: a color, a gradient or a picture.
- Keep it to things that stand for an object someone holds.

**Don't**

- Don't use it for ordinary content, a form or a row in a list. Movement under the pointer makes those harder to use.
- Don't make it the only way to see anything.
