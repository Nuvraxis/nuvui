<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/slider.mdx. Don't edit it here: run `pnpm skill`. -->

# Slider

A handle on a track for picking a number from a range, or two handles for picking both ends of one.

Use a slider when the exact number matters less than where it sits in a range: a volume, a brightness, a price filter. When people need to enter an exact value, give them a number [input](input.md), alone or next to the slider.

```tsx
"use client";

import { Label, Slider } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [volume, setVolume] = useState([40]);

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Label asChild>
          <span id="slider-volume">Volume</span>
        </Label>
        <output>{volume[0]}%</output>
      </div>
      <Slider
        aria-labelledby="slider-volume"
        value={volume}
        onValueChange={setVolume}
      />
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
import { Slider } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `thumbLabels` | `string[]` |  | Accessible name of each handle, in order. A slider with two handles needs them told apart. Left out, Radix names them "Minimum" and "Maximum", so set this when your interface isn't in English. |
| `getValueLabel` | `((value: number, index: number) => string)` |  | What a screen reader says for a handle's value, in place of the bare number: "40 percent", or the name of a step. It's given the value and the handle's position, counted from 0. |

These come from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `number[]` |  | The values, one for each handle, when you control them yourself. Use it with `onValueChange`. |
| `defaultValue` | `number[]` |  | The values it starts with, when you don't control them. How many there are decides how many handles are drawn. |
| `onValueChange` | `((value: number[]) => void)` |  | Called with the values while a handle moves. |
| `onValueCommit` | `((value: number[]) => void)` |  | Called with the values when a handle is let go of, or a key changes it. The place to save. |
| `min` | `number` |  | The lowest value. It's 0 by default. |
| `max` | `number` |  | The highest value. It's 100 by default. |
| `step` | `number` |  | How far the value moves at a time. It's 1 by default. |
| `minStepsBetweenThumbs` | `number` |  | The fewest steps two handles may be apart. |
| `orientation` | `"horizontal" \| "vertical"` |  | `"vertical"` stands the slider on end. |
| `inverted` | `boolean` |  | Fills from the far end, and turns the arrow keys around to match. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. In `"rtl"` the slider fills from the right. |
| `disabled` | `boolean` |  | Stops the handles from being focused or moved. |
| `name` | `string` |  | The name the values are submitted under in a form. |

Everything else is passed to the `<span>` Radix renders around the track, including `ref`, `id` and `className`.

The value is always an array, with one handle too. There's a handle for each number in it.

## A range

Two values draw two handles, and the part between them is filled. `minStepsBetweenThumbs` keeps one from landing on the other.

```tsx
"use client";

import { Label, Slider } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [price, setPrice] = useState([200, 600]);

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Label asChild>
          <span id="slider-price">Price</span>
        </Label>
        <output>
          ${price[0]} to ${price[1]}
        </output>
      </div>
      <Slider
        aria-labelledby="slider-price"
        thumbLabels={["Lowest price", "Highest price"]}
        min={0}
        max={1000}
        step={50}
        minStepsBetweenThumbs={1}
        value={price}
        onValueChange={setPrice}
      />
    </div>
  );
}
```

With two handles, the slider's name goes to the group and each handle needs one of its own. Radix calls them "Minimum" and "Maximum". Set `thumbLabels` to say something more exact, or to translate them.

## Vertical

```tsx
import { Slider } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "flex", gap: 32 }}>
      <Slider aria-label="Bass" orientation="vertical" defaultValue={[60]} />
      <Slider aria-label="Mid" orientation="vertical" defaultValue={[45]} />
      <Slider aria-label="Treble" orientation="vertical" defaultValue={[70]} />
    </div>
  );
}
```

A vertical slider is 10rem tall. Set `--nuv-slider-length` to change that.

## Right to left

A slider doesn't read its direction from the page. Pass `dir="rtl"` and it fills from the right, and the left and right arrow keys swap.

## In a form

Give it a `name` and each handle's value is submitted, from a hidden input. With one handle the field is called `name`. With several, each is submitted as `name[]`.

## On small screens

The handle is 20 pixels, which is too small for a finger. On a touch screen the area that responds to a touch is 44 by 44 pixels, centered on the handle. A touch anywhere on the track moves the nearest handle there, and dragging along the track doesn't scroll the page.

Leave room above and below it. A slider right at the edge of a scrolling list is hard to grab without scrolling.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to a handle. Each handle is a tab stop. |
| <kbd>→</kbd> or <kbd>↑</kbd> | Raises the value by one step. |
| <kbd>←</kbd> or <kbd>↓</kbd> | Lowers the value by one step. |
| <kbd>Page Up</kbd> and <kbd>Page Down</kbd> | Change the value by ten steps. |
| <kbd>Shift</kbd> with an arrow | The same, ten steps. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Go to the lowest or highest value. With two handles, it's the handle at that end that moves. |

### What the component handles

- Each handle has `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-orientation`. This part is Radix.
- `aria-label`, `aria-labelledby` and `aria-describedby` on the slider are moved to where they mean something: the handle when there's one, and a group around the handles when there are several.
- The track uses `--color-border-strong` and the filled part and the handle's edge use `--color-primary`. Each has at least 3:1 contrast with the page in every theme.
- Where the browser forces its own colors, as Windows high contrast does, backgrounds aren't drawn. The track gets an outline there, and the filled part the system's color for something selected.
- Keyboard focus shows a 2 pixel ring around the handle.

### What you need to handle

- Give it a name: `aria-label`, or `aria-labelledby` pointing at visible text. A `<label>` can't point at a slider. A [Field](field.md) does it for you.
- Show the value in text somewhere near it. The handle's position alone is only a rough reading, and a screen reader's "40" means little without a unit.
- If the bare number isn't what people think in, pass `getValueLabel`. A screen reader then says "40 percent" or "Medium" where it would have said "40".

## CSS variables

Set any of these on the slider, or on anything around it.

```css
.mixer {
  --nuv-slider-range: var(--color-success);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-slider-width` | `100%` | Width of a horizontal slider. It fills its container by default. |
| `--nuv-slider-thumb-size` | `1.25rem` | Width and height of a handle. |
| `--nuv-slider-length` | `10rem` | Height of a vertical slider. |
| `--nuv-slider-track-size` | `0.375rem` | Thickness of the track. |
| `--nuv-slider-track` | `var(--color-border-strong)` | Color of the empty part of the track. Keep it at 3:1 against the page. |
| `--nuv-slider-range` | `var(--color-primary)` | Color of the filled part. |
| `--nuv-slider-thumb-border` | `var(--color-primary)` | Color of a handle's edge. |
| `--nuv-slider-thumb-bg` | `var(--color-surface)` | Fill color of a handle. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-slider` | The slider. |
| `.nuv-slider__range` | The filled part of the track. |
| `.nuv-slider__thumb` | A handle. |
| `.nuv-slider__track` | The track. |

Radix sets `data-orientation` on every part, and `data-disabled` when the slider is disabled.

## Server components

Slider is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the vertical example on this page does.

## Do and don't

**Do**

- Show the current value next to the slider.
- Pick a `step` that matches how exact the setting needs to be. A hundred steps on a phone is hard to land on.

**Don't**

- Don't use a slider for a value people know as a number, such as a quantity or an age.
- Don't use one for a range so wide that a single pixel jumps the value by a lot.
