<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/gradient-background.mdx. Don't edit it here: run `pnpm skill`. -->

# GradientBackground

Soft fields of the theme's colors that drift and change places slowly. Drawn in CSS alone, so it works in a server component and looks the same before any script has run.

```tsx
import { GradientBackground } from "@nuvui/backgrounds/gradient-background";
import { Button } from "@nuvui/react";

// No "use client": it's drawn in CSS, so a server component can render it.
export default function Example() {
  return (
    <GradientBackground className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Close the books in a day</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Reconcile every account before the month is out.
        </p>
        <Button>See how</Button>
      </div>
    </GradientBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { GradientBackground } from "@nuvui/backgrounds/gradient-background";
```

It needs no script. A server component can render it, and the page from the server already shows it moving.

## What it draws

Three soft fields of color, the theme's chart colors unless you set your own, drift toward the end of the line and back, grow and shrink, each at its own pace, so the three never line up into a pattern. A cycle takes 30 seconds, and `--nuv-gradient-background-duration` changes it.

It doesn't answer the pointer.

## Colors of your own

```tsx
import { GradientBackground } from "@nuvui/backgrounds/gradient-background";

// Three colors of your own, more of them, and slower.
export default function Example() {
  return (
    <GradientBackground className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-gradient-background-color-1:var(--color-primary)] [--nuv-gradient-background-color-2:var(--color-chart-6)] [--nuv-gradient-background-color-3:var(--color-chart-5)] [--nuv-gradient-background-duration:60s] [--nuv-gradient-background-opacity:0.5]">
      <p className="m-0 text-2xl font-semibold">Welcome back, Ana</p>
    </GradientBackground>
  );
}
```

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` |  | What's laid on the background, such as a headline or a form. |
| `scrim` | `"none" \| "soft" \| "strong"` |  | Lays the background's own color over it, so what's on it reads. |
| `paused` | `boolean` |  | Stops the colors where they are. |

It also takes the attributes of a `div`, which is what it's drawn as. Give it a size, such as `min-height`, and lay out what's on it with `className`: it's the box its children are in.

## Accessibility

### What the component handles

- **It's hidden from screen readers,** and never in the Tab order.
- **For anyone who asked for less motion,** the colors hold still.
- **Where the browser forces its colors,** nothing is drawn, and the box is the system's background.

### What you need to handle

- **A way to stop it.** Anything that moves for more than five seconds beside other content needs one. A button that sets `paused` will do, as in [the example on the start page](index.md#a-way-to-stop-it).
- **Text that reads.** The fields are a third as strong as the colors they're made of, but the middle of one can still be too strong for body text, in dark mode most of all. `scrim="strong"` keeps body text at 4.5:1 or more over any part of it in its own colors. With colors or an opacity of your own, check them.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-gradient-background-bg` | `var(--color-background)` | The color under the fields, and the scrim's color. |
| `--nuv-gradient-background-opacity` | `0.35` | How strong the fields are, from 0 to 1. |
| `--nuv-gradient-background-color-1` | `var(--color-chart-1)` | Color of the first field, at the start of the top. |
| `--nuv-gradient-background-color-2` | `var(--color-chart-4)` | Color of the second, at the end. |
| `--nuv-gradient-background-color-3` | `var(--color-chart-3)` | Color of the third, at the bottom. |
| `--nuv-gradient-background-duration` | `30s` | How long one field takes to drift there and back. The other two take a little longer and a little less. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-gradient-background` | GradientBackground |
| `.nuv-gradient-background__field` | One of the three fields of color. |

Every background also has the classes on [the start page](index.md#classes).
