<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/glyph-background.mdx. Don't edit it here: run `pnpm skill`. -->

# GlyphBackground

A field of characters lit by glows that wander over it. The pointer leaves a trail of light, a press sends a ring of it outward, and now and then a character changes.

```tsx
import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <GlyphBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Webhooks for every event</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Signed, retried, and logged where you can read them.
        </p>
        <Button>Add an endpoint</Button>
      </div>
    </GlyphBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";
```

It's a client component. It can be rendered from a server component, which sends what's laid on it, and the background is drawn once the page's script has run.

## What it draws

Characters in rows fill it, faint, in the theme's monospaced font, and now and then some change. Three glows wander over them, lighting the ones they pass in the accent color.

The pointer leaves a trail of light that fades. A press sends a ring of it outward from where it lands. A press on a button, a link or a field laid on it is the control's alone.

## Characters of your own

```tsx
import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";

// Characters of your own, larger, lit in another color.
export default function Example() {
  return (
    <GlyphBackground
      glyphs="+-×÷="
      density={0.6}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-glyph-background-glow:var(--color-chart-3)]"
    >
      <p className="m-0 text-2xl font-semibold">Budget calculator</p>
    </GlyphBackground>
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
| `density` | `number` |  | How small the characters are: 1 as designed, 2 twice as dense. |
| `glyphs` | `string` |  | The characters it's made of, picked at random. Each is one character, so `"01"` is two of them. |

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
| `--nuv-glyph-background-bg` | `var(--color-background)` | The color under the characters, and the scrim's color. |
| `--nuv-glyph-background-color` | `var(--color-muted-foreground)` | Color of the characters. |
| `--nuv-glyph-background-glow` | `var(--color-primary)` | Color of the light on them. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-glyph-background` | GlyphBackground |

Every background also has the classes on [the start page](index.md#classes).
