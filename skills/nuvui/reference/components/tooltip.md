<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/tooltip.mdx. Don't edit it here: run `pnpm skill`. -->

# Tooltip

A short line of text that appears when a control is hovered or focused. It doesn't appear on touch screens.

Use a tooltip to add a few words to a control that already makes sense without them: what a button will do, or its keyboard shortcut.

Tooltips don't show on touch screens, where there's no hover. Never put anything in one that people need.

```tsx
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button intent="secondary">Archive</Button>
      </TooltipTrigger>
      <TooltipContent>
        Takes the project out of your list. You can bring it back later.
      </TooltipContent>
    </Tooltip>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Tooltip` | Holds the open state for one tooltip. Renders nothing itself. |
| `TooltipTrigger` | The control the tooltip belongs to. Wrap your own button or link with `asChild`. |
| `TooltipContent` | The bubble with the text. |
| `TooltipProvider` | Optional. Put it around a group of tooltips so they share their timing. |

These are separate exports, not properties of `Tooltip`. `Tooltip.Content` isn't available, because property access on a client component doesn't work from a server component.

## Props

### TooltipContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `showArrow` | `boolean` | `true` | Whether to draw the small arrow that points at the trigger. |
| `sideOffset` | `number` | `4` | The gap between the trigger and the tooltip, in pixels. With the arrow shown, it's measured from the arrow's tip. |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the tooltip may get to the edge of the screen, in pixels. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the tooltip is rendered into. Set this when the tooltip should pick up a `data-theme` from a section of the page. |

These come from Radix and are the ones you're most likely to set:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `side` | `"bottom" \| "left" \| "right" \| "top"` |  | The side of the trigger the tooltip opens on. It's `"top"` unless you say otherwise, and it flips to the opposite side when there isn't room. |
| `align` | `"center" \| "end" \| "start"` |  | How the tooltip lines up with the trigger along that side. It's `"center"` unless you say otherwise. |

### Tooltip

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `delayDuration` | `number` |  | How long the pointer has to rest on the trigger before the tooltip shows, in milliseconds. Keyboard focus doesn't wait. |
| `open` | `boolean` |  | Whether it's showing, when you control it yourself. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` |  | Whether it starts out showing, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when it shows or hides. |
| `disableHoverableContent` | `boolean` |  | With `true`, the tooltip hides as soon as the pointer leaves the trigger, even if it's heading for the tooltip. |

### TooltipProvider

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `delayDuration` | `number` |  | The delay for every tooltip inside, in milliseconds, unless one sets its own. |
| `skipDelayDuration` | `number` |  | After one tooltip hides, how long the next one can show without waiting, in milliseconds. |
| `disableHoverableContent` | `boolean` |  | The same as on `Tooltip`, for every tooltip inside. |

## Several tooltips

On its own, each tooltip waits out its delay. Put a group inside one `TooltipProvider` and only the first one waits. Moving on to the next within a moment shows it at once, which is what you want in a toolbar.

```tsx
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nuvui/react";

const tools = [
  { name: "Bold", keys: "Ctrl+B", glyph: "B", weight: 700 },
  { name: "Italic", keys: "Ctrl+I", glyph: "I", weight: 400 },
  { name: "Underline", keys: "Ctrl+U", glyph: "U", weight: 400 },
];

export default function Example() {
  return (
    <TooltipProvider>
      {tools.map((tool) => (
        <Tooltip key={tool.name}>
          <TooltipTrigger asChild>
            <Button
              intent="secondary"
              aria-label={tool.name}
              style={{ fontWeight: tool.weight }}
            >
              {tool.glyph}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tool.keys}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
```

Outside a provider, a tooltip still works. It brings its own.

## Sides

```tsx
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nuvui/react";

const sides = ["top", "right", "bottom", "left"] as const;

export default function Example() {
  return (
    <TooltipProvider>
      {sides.map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button intent="secondary">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Opens on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
```

## On touch screens

A tap on the trigger doesn't open the tooltip. The trigger just does what it does. That's how Radix handles touch, and this library doesn't change it.

So treat a tooltip as extra. The control needs a visible label or an `aria-label` that makes sense alone, and anything people need to know has to be on the page.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the trigger, which shows the tooltip at once. Moving on hides it. |
| <kbd>Esc</kbd> | Hides the tooltip. Focus stays on the trigger. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Presses the trigger, and hides the tooltip. |

### What the component handles

- While it's showing, the tooltip's text is tied to the trigger with `aria-describedby`, so a screen reader reads it after the control's name. This part is Radix.
- It shows on keyboard focus as well as on hover.
- It stays while the pointer moves from the trigger onto the tooltip itself, and <kbd>Esc</kbd> hides it without moving the pointer. WCAG 1.4.13 asks for both.
- Its colors are the page's text and background colors swapped, so the contrast is the same as the page's body text in light and dark.
- It never runs off the screen. Long text wraps at 16rem.
- Where the browser forces its own colors, as Windows high contrast does, the bubble loses its background. It has an outline there so it still reads as separate from the page.
- It only fades in when the visitor hasn't asked for reduced motion.

### What you need to handle

- Put it on something that can take focus, such as a button or a link. With `asChild`, that's the element you pass in. A tooltip on plain text can't be reached by keyboard.
- A disabled `Button` ignores the pointer and can't take focus, so a tooltip on it never shows. If you need to explain why something is unavailable, say so on the page.
- An icon-only button still needs its own name through `aria-label`. The tooltip is a description, read after the name. When both would say the same words, use the tooltip for something extra, as the toolbar example does with shortcuts.
- Keep links and buttons out of the tooltip. People can't get to them.

## CSS variables

Tooltips render at the end of `<body>`, so set these on `:root` or `body`, or straight on `TooltipContent` with `style` or a class.

```css
:root {
  --nuv-tooltip-radius: var(--radius-sm);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-tooltip-width` | `16rem` | The widest the tooltip gets before its text wraps. |
| `--nuv-tooltip-radius` | `var(--radius-md)` | Corner radius. |
| `--nuv-tooltip-bg` | `var(--color-foreground)` | Background color of the bubble and the arrow. The page's text color unless you set it. |
| `--nuv-tooltip-fg` | `var(--color-background)` | Text color. The page's background color unless you set it. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-tooltip` | TooltipContent. |
| `.nuv-tooltip__arrow` | The arrow that points at the trigger. |

Radix sets `data-state` on the bubble to `delayed-open` after a hover, `instant-open` after keyboard focus or when the delay was skipped, and `closed` on the way out. Only `delayed-open` is animated. It also sets `data-side` for where the bubble ended up.

## Server components

The tooltip parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a tooltip together inside a server component, as the examples on this page do.

## Do and don't

**Do**

- Keep it to a few words. If it needs a second sentence, it belongs on the page.
- Use it for keyboard shortcuts, and for naming what an icon button does.
- Wrap a toolbar's tooltips in one `TooltipProvider`.

**Don't**

- Don't put anything essential in a tooltip. On a phone nobody will see it.
- Don't repeat the button's visible label in it.
- Don't put a tooltip on something that already opens a menu or a popover on click. The two fight for the same spot.
