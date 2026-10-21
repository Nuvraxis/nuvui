<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/fireworks-background.mdx. Don't edit it here: run `pnpm skill`. -->

# FireworksBackground

Rockets that rise from the bottom and burst into sparks in the theme's chart colors, which fall and fade. A press bursts one where it lands.

```tsx
import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <FireworksBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Your store is live</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Share the link, and the first orders will show here.
        </p>
        <Button>Copy the link</Button>
      </div>
    </FireworksBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
```

It's a client component. It can be rendered from a server component, which sends what's laid on it, and the background is drawn once the page's script has run.

## What it draws

A rocket rises from the bottom every second or so and bursts into sparks, which fall and fade with a short tail. Each burst is one of five colors, the theme's chart colors unless you set your own.

A press bursts one where it lands. The pointer's moves do nothing. A press on a button, a link or a field laid on it is the control's alone.

## Only once something's done

```tsx
"use client";

import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
import { Button } from "@nuvui/react";
import { useState } from "react";

// Fireworks for a moment worth it, and not before.
export default function Example() {
  const [published, setPublished] = useState(false);
  const content = (
    <div className="grid justify-items-center gap-4 text-center">
      <h2 className="m-0 text-2xl font-semibold">
        {published ? "Published" : "Ready to publish"}
      </h2>
      <Button
        intent={published ? "secondary" : "primary"}
        onClick={() => setPublished((now) => !now)}
      >
        {published ? "Start again" : "Publish"}
      </Button>
    </div>
  );
  const frame = "grid min-h-64 w-full place-items-center rounded-lg p-8";

  return published ? (
    <FireworksBackground className={frame}>{content}</FireworksBackground>
  ) : (
    <div className={frame}>{content}</div>
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
| `density` | `number` |  | How many sparks a burst has: 1 as designed, 2 twice as dense. |

It also takes the attributes of a `div`, which is what it's drawn as. Give it a size, such as `min-height`, and lay out what's on it with `className`: it's the box its children are in.

## Accessibility

### What the component handles

- **It's hidden from screen readers,** and never in the Tab order. What's laid on it is read as it would be anywhere else.
- **For anyone who asked for less motion,** it's one finished frame that holds still, and the pointer moves nothing.
- **Where the browser forces its colors,** nothing is drawn, and the box is the system's background.
- **It stops when it can't be seen:** while it's scrolled out of view, and while the tab is in the background.
- **Nothing flashes.** The sparks are small and fade, and no large area changes its brightness, so it stays well inside the limit of three flashes a second.

### What you need to handle

- **A way to stop it.** Anything that moves for more than five seconds beside other content needs one. A button that sets `paused` will do, as in [the example on the start page](index.md#a-way-to-stop-it).
- **Text that reads.** `scrim="strong"` keeps body text at 4.5:1 or more over any part of it in its own colors. With colors of your own, check them.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-fireworks-background-bg` | `var(--color-background)` | The color under the fireworks, and the scrim's color. |
| `--nuv-fireworks-background-color-1` | `var(--color-chart-1)` | The first of the five colors a burst can be. |
| `--nuv-fireworks-background-color-2` | `var(--color-chart-2)` | The second. |
| `--nuv-fireworks-background-color-3` | `var(--color-chart-3)` | The third. |
| `--nuv-fireworks-background-color-4` | `var(--color-chart-5)` | The fourth. |
| `--nuv-fireworks-background-color-5` | `var(--color-chart-6)` | The fifth. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-fireworks-background` | FireworksBackground |

Every background also has the classes on [the start page](index.md#classes).
