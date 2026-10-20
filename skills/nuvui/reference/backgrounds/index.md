<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Backgrounds

The @nuvui/backgrounds package. Moving backgrounds for a hero, a sign-in page or an empty state, in the theme's colors, quiet enough to put text over, still for anyone who asked for less motion, and with no dependencies.

Backgrounds are a package of their own, `@nuvui/backgrounds`. Each is a box that draws something under what's laid on it: a headline, a form, an empty state. Two are drawn in CSS, and six on a canvas, with no dependency of any kind.

| Component | What it draws |
| --- | --- |
| [GradientBackground](gradient-background.md) | Soft fields of color that drift slowly. CSS alone, so it works in a server component. |
| [GridBackground](grid-background.md) | Lines or dots that fade out from the middle, lit under the pointer. |
| [StarsBackground](stars-background.md) | A starfield drifting the way the page reads. |
| [TopographyBackground](topography-background.md) | Contour lines of a land that shifts slowly. The pointer raises a hill, and a press sends a wave. |
| [HexagonBackground](hexagon-background.md) | A grid of hexagons that light up under the pointer. |
| [FireworksBackground](fireworks-background.md) | Rockets that burst into sparks. A press bursts one. |
| [HoleBackground](hole-background.md) | A tunnel of rings with motes rising through it. |
| [GlyphBackground](glyph-background.md) | A field of characters lit by wandering glows. The pointer leaves a trail. |

```tsx
import { TopographyBackground } from "@nuvui/backgrounds/topography-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <TopographyBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Know every route</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Plan deliveries around the ground they cross.
        </p>
        <Button>Plan a route</Button>
      </div>
    </TopographyBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

`@nuvui/react` is a peer dependency: the backgrounds are drawn in the core's tokens, and take its theme, its dark mode and its presets.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/backgrounds/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. Each background's styles are also on their own, such as `@nuvui/backgrounds/css/stars-background.css`, each with what every background shares.

## Imports

Each background has an entry of its own, so a page with one loads one:

```tsx
import { StarsBackground } from "@nuvui/backgrounds/stars-background";
```

## Laying things on one

A background is a `div` with what you pass as children on top of it. Give it a size and a layout with `className`, as you would any box:

```tsx
<StarsBackground scrim="soft" className="hero">
  <h1>Every report your team asks for</h1>
  <a href="/trial">Start a free trial</a>
</StarsBackground>
```

What it draws sits under the children and never takes a press meant for them. The pointer is followed over the children too, so a background that answers the pointer does so wherever it is in the box.

## A scrim

`scrim` lays the background's own color over what it draws, so what's on it reads: `soft` is half of it, and `strong` four fifths. With `strong`, body text in the theme's colors reads at 4.5:1 or more over any part of any background drawn in its own colors, in light and dark and in every preset.

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-background-scrim-soft` | `50%` | How much of the background's color `scrim="soft"` lays over it. |
| `--nuv-background-scrim-strong` | `80%` | How much `scrim="strong"` lays over it. |

## A way to stop it

Anything that moves by itself for more than five seconds, beside other content, needs a way to stop it, which is a rule of WCAG. Every background that moves takes `paused`, and a button that sets it will do:

```tsx
"use client";

import { StarsBackground } from "@nuvui/backgrounds/stars-background";
import { Button } from "@nuvui/react";
import { useState } from "react";

// Anything that moves for more than five seconds needs a way to stop it.
// The button keeps its name, and says whether it's pressed.
export default function Example() {
  const [paused, setPaused] = useState(false);

  return (
    <StarsBackground
      paused={paused}
      scrim="soft"
      className="grid min-h-64 w-full content-between justify-items-start gap-6 rounded-lg p-6"
    >
      <h2 className="m-0 text-2xl font-semibold">Quarterly review</h2>
      <Button
        intent="secondary"
        size="sm"
        aria-pressed={paused}
        onClick={() => setPaused((now) => !now)}
      >
        Pause the background
      </Button>
    </StarsBackground>
  );
}
```

## Less motion, forced colors and a hidden tab

- **For anyone who asked for less motion,** a background is one finished frame that holds still, and the pointer moves nothing in it.
- **Where the browser forces its colors,** nothing is drawn, and the box is the system's background.
- **A background stops** while it's scrolled out of view and while the tab is in the background, and starts where it was when it's back. Every background on a page shares one animation frame.

## What it costs

A canvas is drawn at the screen's own resolution, up to twice the CSS pixels, so a large one on a phone isn't drawn at three times. Each background's own entry is 3 kB or less, minified and compressed, and the stylesheet 1.2 kB. `density` and `speed` turn down how much there is and how fast it moves, for a page that has to be lighter still.

## Server rendering and a strict policy

A server component can render any of them. The page from the server has what's laid on the background, and the background's color under it, so nothing moves when the script arrives: a background on a canvas is drawn once it has. `GradientBackground` needs no script at all, and `GridBackground` only for the light under the pointer.

Nothing needs a `style` attribute, so a Content Security Policy without `style-src-attr 'unsafe-inline'` changes nothing. What changes as the pointer moves is set from script, which such a policy allows.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-background` | Every background, as well as its own class. |
| `.nuv-background__canvas` | The canvas, in the layer, of a background drawn on one. |
| `.nuv-background__layer` | What's drawn, under the children. |
| `.nuv-background__scrim` | The layer of the background's own color laid over what's drawn. |
