<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/rating.mdx. Don't edit it here: run `pnpm skill`. -->

# Rating

Stars to rate something with, or to show how it was rated, down to part of a star.

Use a rating to ask how good something was, or to show the answer. To choose from, it's a radio group drawn as stars. To show, it's a picture with a name.

```tsx
"use client";

import { Rating } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [stars, setStars] = useState(3);

  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
      <span id="rating-basic-label">How was the delivery?</span>
      <Rating
        aria-labelledby="rating-basic-label"
        value={stars}
        onValueChange={setStars}
      />
      <span aria-live="polite">{stars} of 5</span>
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
import { Rating } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `number` |  | How many stars are chosen, when you control it. 0 is none. |
| `defaultValue` | `number` | `0` | How many stars are chosen at first, when you don't control it. |
| `onValueChange` | `((value: number) => void)` |  | Called with the number of the star that was chosen. |
| `max` | `number` | `5` | How many stars there are. |
| `readOnly` | `boolean` | `false` | Shows a rating that can't be changed, such as an average. It's then a picture with a name, not a set of controls, and the value can have a fraction: 3.5 fills half of the fourth star. |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` |  |
| `itemLabel` | `((value: number, max: number) => string)` | `(value) => (value === 1 ? "1 star" : '${value} stars')` | Accessible name of one star, from its number and the number of stars. Translate it with the rest of your interface. |
| `valueLabel` | `((value: number, max: number) => string)` | `(value, max) => '${value} out of ${max}'` | Accessible name of a rating that can't be changed, from its value and the number of stars. Translate it with the rest of your interface. |

Everything else is passed to the group, including `ref`, `className`, `name`, `required` and `disabled`. With a `name`, the number of the chosen star is submitted with a form.

## Showing a rating

`readOnly` is for a rating nobody changes here: an average, or someone else's review. The value can have a fraction, and the star it falls in is filled that far.

```tsx
import { Rating } from "@nuvui/react";

const products = [
  { name: "Standing desk", average: 4.5, reviews: 128 },
  { name: "Monitor arm", average: 3.7, reviews: 64 },
  { name: "Cable tray", average: 2, reviews: 9 },
];

export default function Example() {
  return (
    <ul
      style={{
        display: "grid",
        gap: 12,
        margin: 0,
        padding: 0,
        listStyle: "none",
      }}
    >
      {products.map((product) => (
        <li
          key={product.name}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <span style={{ inlineSize: "8rem" }}>{product.name}</span>
          <Rating readOnly size="sm" value={product.average} />
          <span>
            {product.average} ({product.reviews})
          </span>
        </li>
      ))}
    </ul>
  );
}
```

A read-only rating is one picture to a screen reader, named "4.5 out of 5". It isn't a set of disabled controls, which would be read one star at a time and say nothing of the half. Put the number beside it as text when it matters: part of a star is hard to judge by eye.

## Sizes, and more stars

`size` changes the stars, and `max` how many there are.

```tsx
import { Rating } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Rating size="sm" defaultValue={4} aria-label="Small" />
      <Rating size="md" defaultValue={4} aria-label="Medium" />
      <Rating size="lg" defaultValue={4} aria-label="Large" />
      <Rating max={10} defaultValue={7} aria-label="Out of ten" />
    </div>
  );
}
```

## Taking a rating back

A radio group has no way to choose nothing once something is chosen. When a rating is optional, put a button beside it that sets the value to 0, which is no stars.

## Accessibility

| Key | What it does |
| --- | --- |
| Tab | Moves to the chosen star, or to the first when none is. |
| Arrow right, Arrow down | Chooses the next star. |
| Arrow left, Arrow up | Chooses the one before. |
| Space | Chooses the star that has focus. |

In a right-to-left page the left and right arrows swap, as the stars do.

### What the component handles

- To choose from, it's a `radiogroup`, and each star is a radio button named "1 star", "2 stars" and so on.
- A star is 44 pixels to a finger on a touch screen. With a mouse the stars close up.
- A chosen star is filled and the others are outlines. That's a difference of shape, so it's still there where the browser forces its own colors, and for someone who can't tell the two colors apart.
- The outline of an empty star has at least 3:1 against the page in every theme.
- Under the pointer, the stars up to it fill, to show what a click would choose. A finger doesn't do this, since it would leave them filled after it lifts.
- Read-only, it has `role="img"` and a name made from the value.

### What you need to handle

- Name the group with `aria-label` or `aria-labelledby`, such as "How was the delivery?".
- Translate the two labels. Both are functions, since the words change with the number. [Translation](../translation.md) lists them.
- When the page shows the average as stars, show it as a number too.

## CSS variables

Set any of these on the rating, or on anything around it.

```css
.reviews {
  --nuv-rating-on: var(--color-warning);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-rating-gap` | `calc(var(--spacing) * 0.5)` | Space around each star. Twice this is the space between two. |
| `--nuv-rating-size` | `1.5rem`, `1rem`, `2rem` | Width and height of a star. Differs by size. |
| `--nuv-rating-off` | `var(--color-border-strong)` | Color of an empty star's outline. Keep it at 3:1 against the background. |
| `--nuv-rating-on` | `var(--color-primary)` | Color of a filled star. The primary color by default. Keep it at 3:1 against the background. |
| `--nuv-rating-part` | `1` | How much of a star is filled, from 0 to 1. The component sets it on each star of a read-only rating. It's not one to set yourself. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-rating` | Every rating. |
| `.nuv-rating--lg` | size="lg" |
| `.nuv-rating--read-only` | A rating with readOnly. |
| `.nuv-rating--sm` | size="sm" |
| `.nuv-rating__fill` | The filled star over the empty one in a read-only rating, cut off at the part the value covers. |
| `.nuv-rating__item` | One star and the room around it. A radio button, or a span when read-only. |
| `.nuv-rating__star` | The star itself, an outline. |
| `.nuv-rating__star--on` | A filled star. |

## Server components

Rating starts with `"use client"`. A read-only one can still be rendered from a server component: it takes plain props. `itemLabel`, `valueLabel` and `onValueChange` are functions, and need a client component.

## Do and don't

**Do**

- Use five stars unless you have a reason. It's what people expect.
- Say what one star and five stars mean when it isn't obvious, in the text beside it.

**Don't**

- Don't use stars for a count or a level, such as a password's strength. That's a [progress bar](progress.md).
- Don't make people rate to get past a form. Leave it optional, or say why it's needed.
