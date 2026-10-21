<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/backgrounds/grid-background.mdx. Don't edit it here: run `pnpm skill`. -->

# GridBackground

A grid of lines or dots that fades out from the middle, with a soft light under the pointer that lights the lines near it.

```tsx
import { GridBackground } from "@nuvui/backgrounds/grid-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <GridBackground className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">An API for every invoice</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Create, send and settle them from your own code.
        </p>
        <Button>Read the reference</Button>
      </div>
    </GridBackground>
  );
}
```

## Install

```sh
pnpm add @nuvui/backgrounds @nuvui/react
```

## Import

```tsx
import { GridBackground } from "@nuvui/backgrounds/grid-background";
```

The grid is drawn in CSS, so the page from the server shows it whole. Only the light under the pointer needs the page's script.

## What it draws

Lines between square cells, or with `variant="dots"` a dot where they cross. The grid is strongest in the middle, where what's laid on it usually is, and fades out toward the edges, so the box has no hard border of lines. `fade={false}` draws it evenly over the whole box.

It doesn't move by itself. Under the pointer, or a finger, the lines near it light in the accent color, and go dark again when it leaves.

## Dots

```tsx
import { GridBackground } from "@nuvui/backgrounds/grid-background";

// Dots where the lines would cross, in smaller cells, over the whole box.
export default function Example() {
  return (
    <GridBackground
      variant="dots"
      fade={false}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-grid-background-cell:1.25rem]"
    >
      <p className="m-0 text-2xl font-semibold">Drop files to upload</p>
    </GridBackground>
  );
}
```

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` |  | What's laid on the background, such as a headline or a form. |
| `scrim` | `"none" \| "soft" \| "strong"` |  | Lays the background's own color over it, so what's on it reads. |
| `variant` | `"dots" \| "lines"` |  | Lines between the cells, or a dot where they cross. |
| `interactive` | `boolean` |  | Whether it lights up under the pointer. |
| `fade` | `boolean` |  | Whether the grid fades out toward the edges. |

It also takes the attributes of a `div`, which is what it's drawn as. Give it a size, such as `min-height`, and lay out what's on it with `className`: it's the box its children are in.

## Accessibility

### What the component handles

- **It's hidden from screen readers,** and never in the Tab order.
- **Nothing moves by itself,** so there's nothing to stop. The light follows the pointer and goes as soon as it leaves.
- **Where the browser forces its colors,** nothing is drawn, and the box is the system's background.

### What you need to handle

- **Text that reads.** The lines are in the border color, which body text reads over. The lit ones are in the accent color, under the pointer only. `scrim="strong"` keeps body text at 4.5:1 or more over both. With colors of your own, check them.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-grid-background-bg` | `var(--color-background)` | The color under the grid, and the scrim's color. |
| `--nuv-grid-background-cell` | `2.5rem` | The size of a cell. |
| `--nuv-grid-background-color` | `var(--color-border)` | Color of the lines or dots. |
| `--nuv-grid-background-glow` | `var(--color-primary)` | Color of the lines near the pointer. |
| `--nuv-grid-background-glow-size` | `10rem` | How far from the pointer the lines light. |

The scrim's strengths are shared by every background, and listed on [the start page](index.md#a-scrim).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-grid-background` | GridBackground |
| `.nuv-grid-background__pattern` | The grid. |
| `.nuv-grid-background__pattern--lit` | The same grid in the accent color, shown only around the pointer. |

Every background also has the classes on [the start page](index.md#classes).
