<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/hole-background.mdx. Don't edit it here: run `pnpm skill`. -->

# HoleBackground

A tunnel of rings receding into the distance, with motes rising through it toward the viewer. The far end leans toward the pointer, and a press speeds it up for a moment.

```tsx
import { HoleBackground } from "@nuvui/backgrounds/hole-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <HoleBackground
      scrim="soft"
      className="grid min-h-96 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Something new is coming</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Join the waiting list and be the first to try it.
        </p>
        <Button>Join the list</Button>
      </div>
    </HoleBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { HoleBackground } from "@nuvui/backgrounds/hole-background";
```

It's a client component. It can be rendered from a server component, which sends what's laid on it, and the background is drawn once the page's script has run.

## What it draws

Rings recede into the distance, seen from a little above, with lines along the walls, and they move toward the viewer, so it's like looking down a tunnel while moving through it. Motes in the accent color rise through it.

The far end leans toward the pointer. A press speeds it all up for a moment. A press on a button, a link or a field laid on it is the control's alone.

## More motes, in another color

```tsx
import { HoleBackground } from "@nuvui/backgrounds/hole-background";

// More motes, in the warning color, around a slower tunnel.
export default function Example() {
  return (
    <HoleBackground
      density={2}
      speed={0.5}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-hole-background-glow:var(--color-warning)]"
    >
      <p className="m-0 text-2xl font-semibold">Launch in 3 days</p>
    </HoleBackground>
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
| `density` | `number` |  | How many motes there are: 1 as designed, 2 twice as dense. |

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
| `--nuv-hole-background-bg` | `var(--color-background)` | The color under the tunnel, and the scrim's color. |
| `--nuv-hole-background-color` | `var(--color-muted-foreground)` | Color of the rings and the lines along the walls. |
| `--nuv-hole-background-glow` | `var(--color-primary)` | Color of the motes. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-hole-background` | HoleBackground |

Every background also has the classes on [the start page](index.md#classes).
