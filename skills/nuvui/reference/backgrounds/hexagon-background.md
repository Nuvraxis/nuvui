<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/hexagon-background.mdx. Don't edit it here: run `pnpm skill`. -->

# HexagonBackground

A grid of hexagons. The ones under the pointer light up in the accent color and fade after it, and now and then one lights on its own.

```tsx
import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";
import { Button } from "@nuvui/react";

// An empty state, quiet enough to sit inside an app.
export default function Example() {
  return (
    <HexagonBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-sm justify-items-center gap-4">
        <h2 className="m-0 text-2xl font-semibold">No projects yet</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          A project holds its tasks, files and the people working on it.
        </p>
        <Button>New project</Button>
      </div>
    </HexagonBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";
```

It's a client component. It can be rendered from a server component, which sends what's laid on it, and the background is drawn once the page's script has run.

## What it draws

A grid of hexagon outlines covers it. Now and then one lights up in the accent color on its own and fades again.

The hexagons under the pointer light up and fade after it, so a move leaves a trail. A press lights the ones around where it lands. A press on a button, a link or a field laid on it is the control's alone.

## Smaller, in another color

```tsx
import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";

// Smaller hexagons, lit in the success color.
export default function Example() {
  return (
    <HexagonBackground
      density={3}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-hexagon-background-glow:var(--color-success)]"
    >
      <p className="m-0 text-2xl font-semibold">All systems running</p>
    </HexagonBackground>
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
| `density` | `number` |  | How small the hexagons are: 1 as designed, 2 twice as dense. |

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
| `--nuv-hexagon-background-bg` | `var(--color-background)` | The color under the hexagons, and the scrim's color. |
| `--nuv-hexagon-background-color` | `var(--color-border)` | Color of their outlines. |
| `--nuv-hexagon-background-glow` | `var(--color-primary)` | Color of one that's lit. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-hexagon-background` | HexagonBackground |

Every background also has the classes on [the start page](index.md#classes).
