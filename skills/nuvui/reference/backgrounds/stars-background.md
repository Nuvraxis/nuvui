<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/stars-background.mdx. Don't edit it here: run `pnpm skill`. -->

# StarsBackground

A starfield: dots of several sizes drifting the way the page reads, the nearer ones larger and faster, leaning away from the pointer a little.

```tsx
import { StarsBackground } from "@nuvui/backgrounds/stars-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <StarsBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">
          Every report your team asks for
        </h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Built from the data you already have, and kept up to date.
        </p>
        <Button>Start a free trial</Button>
      </div>
    </StarsBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { StarsBackground } from "@nuvui/backgrounds/stars-background";
```

It's a client component. It can be rendered from a server component, which sends what's laid on it, and the background is drawn once the page's script has run.

## What it draws

Dots of several sizes drift across it, the nearer ones larger, brighter and faster, and each twinkles a little. They drift toward the end of the line, so to the right on a page that reads left to right and to the left on one that reads right to left.

The nearer stars lean away from the pointer a little, which reads as depth. A press does nothing. A press on a button, a link or a field laid on it is the control's alone.

## A button that stops it

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

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` |  | What's laid on the background, such as a headline or a form. |
| `scrim` | `"none" \| "soft" \| "strong"` |  | Lays the background's own color over it, so what's on it reads. `strong` keeps body text at 4.5:1. |
| `paused` | `boolean` |  | Stops it on the frame it's at. |
| `interactive` | `boolean` |  | Whether it answers the pointer: a move, and a press on it. |
| `speed` | `number` |  | How fast it moves: 1 as designed, 0.5 half as fast. |
| `density` | `number` |  | How many stars there are: 1 as designed, 2 twice as dense. |

It also takes the attributes of a `div`, which is what it's drawn as. Give it a size, such as `min-height`, and lay out what's on it with `className`: it's the box its children are in.

## Accessibility

### What the component handles

- **It's hidden from screen readers,** and never in the Tab order. What's laid on it is read as it would be anywhere else.
- **For anyone who asked for less motion,** it's one finished frame that holds still, and the pointer moves nothing.
- **Where the browser forces its colors,** nothing is drawn, and the box is the system's background.
- **It stops when it can't be seen:** while it's scrolled out of view, and while the tab is in the background.

### What you need to handle

- **A way to stop it.** Anything that moves for more than five seconds beside other content needs one. A button that sets `paused` will do, as in [the example on the start page](index.md#a-way-to-stop-it).
- **Text that reads.** `scrim="strong"` keeps body text at 4.5:1 or more over any part of it in its own colors. With colors of your own, check them.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-stars-background-bg` | `var(--color-background)` | The color under the stars, and the scrim's color. |
| `--nuv-stars-background-color` | `var(--color-foreground)` | Color of the stars. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-stars-background` | StarsBackground |

Every background also has the classes on [the start page](index.md#classes).
