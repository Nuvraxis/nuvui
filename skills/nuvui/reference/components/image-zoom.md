<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/image-zoom.mdx. Don't edit it here: run `pnpm skill`. -->

# ImageZoom

A picture that's drawn larger where it's pointed at. A mouse zooms in by resting on it or with a click, a tap zooms in where the finger is, and a button in its corner does the same from the keyboard.

Use an image zoom for a picture with detail that's too small to see at the size it's shown: a product photo, a scanned receipt, a floor plan, a drawing of a part. The picture stays in its place on the page, and grows inside its own box.

```tsx
import { ImageZoom } from "@nuvui/react";
import { floorPlan } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <ImageZoom>
        <img
          src={floorPlan}
          alt="Floor plan of flat 4B: a living room, kitchen, dining area, bathroom, hall and bedroom"
        />
      </ImageZoom>
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
import { ImageZoom } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  | The picture, such as an `img` with its own `alt`. |
| `scale` | `number` | `2` | How many times larger the picture is drawn when it's zoomed in. |
| `zoomed` | `boolean` |  | Whether it's zoomed in, when you control it. |
| `defaultZoomed` | `boolean` | `false` | Whether it's zoomed in at first, when you don't control it. |
| `onZoomedChange` | `((zoomed: boolean) => void)` |  | Called with whether it's zoomed in, when that changes. |
| `hover` | `boolean` | `true` | Zooms in while a mouse is over the picture, and out when it leaves. A click zooms in or out either way. |
| `step` | `number` | `10` | How far one arrow key moves what's in view while it's zoomed in, as a percentage of the picture. |
| `disabled` | `boolean` | `false` | It doesn't zoom, and has no button. |
| `zoomLabel` | `string` | `"Zoom"` | Accessible name of the button that zooms in and out. Translate it with the rest of your interface. |

It's a `div`, and takes what a `div` takes, including `ref` and `className`.

## The picture

The picture is the children: an `img`, your framework's image component, or markup of your own, such as an `svg`. An `img` fills the box and is cropped to it, as with `object-fit: cover`. Give it an `alt` that says what it shows.

The box is as tall as the picture. For a shape of your own, set `--nuv-image-zoom-ratio`, and the picture is cropped to it:

```css
.product-photo {
  --nuv-image-zoom-ratio: 1;
}
```

Zoomed in, the picture is drawn `scale` times larger, twice by default. It's the same picture made larger, so give it enough pixels for the size it's drawn at zoomed in, or it looks soft. For an `img`, `srcSet` and `sizes` can do that.

## How it zooms

- **A mouse** zooms in while it rests on the picture, and out when it leaves. What's in view follows it: the point under the mouse stays under it. A click zooms out, and it stays zoomed out until the mouse has left and come back, or the next click. The cursor shows which a click does. Resting on the button in the corner doesn't zoom, so a mouse can use the button as well.
- **A finger** zooms in with a tap, where it tapped. Zoomed in, a drag moves around the picture, and another tap zooms out. Until it's zoomed in, a finger on the picture scrolls the page as it does anywhere else.
- **The keyboard** reaches the button in the corner. <kbd>Enter</kbd> or <kbd>Space</kbd> zooms in and out, the arrow keys move what's in view, and <kbd>Escape</kbd> zooms out.

With `hover={false}`, resting the mouse on the picture doesn't zoom it. A click zooms in where it was, and it stays zoomed in until the next click, wherever the mouse goes. Use it where a picture zooming under a passing mouse would get in the way, such as in a list someone scrolls through.

```tsx
import { ImageZoom } from "@nuvui/react";
import { floorPlan } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <ImageZoom hover={false} scale={3}>
        <img
          src={floorPlan}
          alt="Floor plan of flat 4B: a living room, kitchen, dining area, bathroom, hall and bedroom"
        />
      </ImageZoom>
    </div>
  );
}
```

## Controlled

`zoomed` says whether it's zoomed in. Set it, with `onZoomedChange`, to zoom from your own controls:

```tsx
"use client";

import { ImageZoom, Switch } from "@nuvui/react";
import { useState } from "react";
import { floorPlan } from "./pictures";

export default function Example() {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Switch
          id="plan-close-up"
          checked={zoomed}
          onCheckedChange={setZoomed}
        />
        <label htmlFor="plan-close-up">Show the plan close up</label>
      </div>
      <ImageZoom hover={false} zoomed={zoomed} onZoomedChange={setZoomed}>
        <img
          src={floorPlan}
          alt="Floor plan of flat 4B: a living room, kitchen, dining area, bathroom, hall and bedroom"
        />
      </ImageZoom>
    </div>
  );
}
```

`disabled` turns it off: no zoom, no button, and the picture is an ordinary picture.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the button in the corner. |
| <kbd>Enter</kbd> and <kbd>Space</kbd> | Zoom in, or out. |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | Zoomed in, move what's in view by `step`, a tenth of the picture by default, the way the arrow points. |
| <kbd>Escape</kbd> | Zooms out. |

Zoomed out, the arrow keys and <kbd>Escape</kbd> are left to the page.

### What the component handles

- The button is a toggle button, with a name, "Zoom", and `aria-pressed` saying whether it's zoomed in.
- The picture is not inside the button, so a screen reader reads its `alt` as it would anywhere.
- The button is 44 by 44 pixels on a touch screen. With a mouse it's as large as a small button, 32 pixels at the default density, and follows `data-density`. Keyboard focus shows a 2 pixel ring around it.
- Where the browser forces its own colors, the button keeps its edge and its magnifier in the page's colors.
- For a visitor who asked for less motion, it zooms in and out at once, without growing.

### What you need to handle

- Write an `alt` that says what the picture shows. Zooming in only makes it larger: whatever detail matters in it, say it in words too, near the picture, for anyone who can't see it.
- Translate `zoomLabel` with the rest of your interface.

## Right to left

On a right-to-left page, the button is in the bottom left corner, at the end of the line there. The arrow keys move the view the way they point either way: it's a picture, and left in it is left.

## CSS variables

Set any of these on the `ImageZoom`, or on anything around it.

```css
.receipt {
  --nuv-image-zoom-radius: 0;
  --nuv-image-zoom-fit: contain;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-image-zoom-radius` | `var(--radius-lg)` | How round the picture's corners are. |
| `--nuv-image-zoom-ratio` | `auto` | The shape of the box, such as 4 / 3. By default it's as tall as the picture. |
| `--nuv-image-zoom-x` | `50%` | Where the zoom is centred across the picture, as a percentage. The component writes this. Don't set it. |
| `--nuv-image-zoom-y` | `50%` | Where the zoom is centred down the picture, as a percentage. The component writes this. Don't set it. |
| `--nuv-image-zoom-scale` | `2` | How many times larger the picture is drawn zoomed in. The component writes this from `scale`. Don't set it. |
| `--nuv-image-zoom-fit` | `cover` | How an img fills the box: cover, the default, crops it; contain shows all of it. |
| `--nuv-image-zoom-button-inset` | `0.5rem` | How far the button is from the edges. |
| `--nuv-image-zoom-button-radius` | `var(--radius-md)` | How round the button's corners are. |
| `--nuv-image-zoom-button-bg` | `var(--color-surface)` | The button's background. |
| `--nuv-image-zoom-button-fg` | `var(--color-surface-foreground)` | The color of the magnifier on the button. |
| `--nuv-image-zoom-button-hover-bg` | `var(--color-muted)` | The button's background under a mouse. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-image-zoom` | ImageZoom. The box the picture is drawn in. |
| `.nuv-image-zoom--disabled` | With `disabled`. |
| `.nuv-image-zoom--zoomed` | Zoomed in. |
| `.nuv-image-zoom__button` | The button in the corner. |
| `.nuv-image-zoom__content` | Around the picture. It's what grows. |
| `.nuv-image-zoom__icon` | The magnifier on the button. |

The root also has a `data-state` attribute, `"zoomed"` or `"idle"`, and a `data-disabled` one with `disabled`.

## Server components

ImageZoom starts with `"use client"`: it follows the pointer and the keys. A server component can render it with a picture it wrote, as long as it passes no functions, such as `onZoomedChange`. Nothing about it is in a `style` attribute, so a [Content Security Policy](../content-security-policy.md) changes nothing.

## Do and don't

**Do**

- Use a picture with more pixels than the box shows, so there's detail to zoom in to.
- Say what matters in the picture in words as well.

**Don't**

- Don't put links or buttons inside the picture. Zoomed in, they move and grow under the pointer, and a click on the picture zooms.
- Don't use it for a gallery that opens a picture full screen. That's a [dialog](dialog.md) with the picture in it.
