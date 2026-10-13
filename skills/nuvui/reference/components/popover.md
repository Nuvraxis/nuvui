<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/popover.mdx. Don't edit it here: run `pnpm skill`. -->

# Popover

A small panel that opens next to a button and stays until it's dismissed.

Use a popover for a few controls or a bit of detail that belongs to one button: sharing options, a short form, a filter. It doesn't block the page, so it suits things people are free to ignore. For something they have to answer, use a [dialog](dialog.md). For a hint on hover, use a [tooltip](tooltip.md).

```tsx
import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Share</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Share this page">
        <p style={{ margin: 0 }}>Anyone with the link can view this page.</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBlockStart: 12,
          }}
        >
          <PopoverClose asChild>
            <Button size="sm">Done</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
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
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Popover` | Holds the open state. Renders nothing itself. |
| `PopoverTrigger` | The button that opens the popover. |
| `PopoverContent` | The panel. It places itself next to the trigger, and can draw an arrow that points at it. |
| `PopoverClose` | Closes the popover when pressed. Wrap your own button with `asChild`. |
| `PopoverAnchor` | Optional. Wrap another element in it to place the panel against that instead of the trigger. |

These are separate exports, not properties of `Popover`. `Popover.Content` isn't available, because property access on a client component doesn't work from a server component.

## Props

### PopoverContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `showArrow` | `boolean` | `false` | Whether to draw an arrow that points at the trigger. |
| `sideOffset` | `number` | `8` | The gap between the trigger and the popover, in pixels. With the arrow shown, it's measured from the arrow's tip. |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the popover may get to the edge of the screen, in pixels. It moves or flips to keep this much room. |
| `arrowPadding` | `number` | `12` | How far the arrow keeps from the panel's corners, in pixels. It stops the arrow sitting on the rounded part when the trigger is near a corner. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the popover is rendered into. Set this when the popover should pick up a `data-theme` from a section of the page. |

These come from Radix and are the ones you're most likely to set:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `side` | `"bottom" \| "left" \| "right" \| "top"` |  | The side of the trigger the panel opens on. It's `"bottom"` unless you say otherwise, and it flips to the opposite side when there isn't room. |
| `align` | `"center" \| "end" \| "start"` |  | How the panel lines up with the trigger along that side. It's `"center"` unless you say otherwise. |
| `avoidCollisions` | `boolean` |  | Pass `false` to keep the panel on the side you chose even when it doesn't fit there. |
| `onOpenAutoFocus` | `((event: Event) => void)` |  | Called when focus is about to move into the panel. Call `event.preventDefault()` to move it somewhere yourself. |

### Popover

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Whether it's open, when you control it yourself. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` |  | Whether it starts open, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when it opens or closes. |
| `modal` | `boolean` |  | With `true`, the rest of the page can't be clicked, and screen readers can't reach it, while the popover is open. |

The other parts take the same props as the Radix parts they wrap, including `asChild`. The [Radix Popover reference](https://www.radix-ui.com/primitives/docs/components/popover#api-reference) lists them.

## Placement

```tsx
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";

const sides = ["top", "right", "bottom", "left"] as const;

export default function Example() {
  return (
    <>
      {sides.map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button intent="secondary">{side}</Button>
          </PopoverTrigger>
          <PopoverContent
            side={side}
            aria-label={`Opens on the ${side}`}
            style={{ inlineSize: "auto" }}
          >
            Opens on the {side}, if there's room.
          </PopoverContent>
        </Popover>
      ))}
    </>
  );
}
```

`side` is a preference, not a promise. On a phone there's rarely room to the left or right of a button, so those two usually end up above or below it.

## With an arrow

Pass `showArrow` to draw an arrow from the panel to the trigger. It helps when a page has several buttons close together and it isn't obvious which one the panel belongs to.

```tsx
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Storage</Button>
      </PopoverTrigger>
      <PopoverContent showArrow aria-label="Storage used">
        7.2 GB of 10 GB used. Files in the trash count until it's emptied.
      </PopoverContent>
    </Popover>
  );
}
```

The arrow takes the panel's background and border, so it follows `--nuv-popover-bg` and `--nuv-popover-border`. The gap set by `sideOffset` is then measured from the arrow's tip.

It points at the middle of the trigger. When the trigger is near a corner of the panel, the arrow stops 12 pixels short of the corner so it stays off the rounded part, and the panel moves over to keep it pointing at the trigger. `arrowPadding` changes that distance.

## With a form

Opening a popover moves focus to the first control inside it, so a field is ready to type in.

```tsx
import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";

const field = {
  inlineSize: "100%",
  minBlockSize: 44,
  paddingInline: 12,
  border: "1px solid var(--color-border-strong)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
  color: "inherit",
  // 16px keeps iOS from zooming in when the field takes focus.
  fontSize: 16,
};

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Rename</Button>
      </PopoverTrigger>
      <PopoverContent aria-labelledby="rename-title" align="start">
        <div style={{ display: "grid", gap: 12 }}>
          <label id="rename-title" htmlFor="rename-name">
            Project name
          </label>
          <input id="rename-name" defaultValue="Website" style={field} />
          <PopoverClose asChild>
            <Button size="sm">Save</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

## On small screens

The panel is 18rem wide. It's never wider or taller than the room Radix finds around the trigger, so on a narrow screen it shrinks to fit, and content that's too tall scrolls inside it. The page itself never scrolls sideways because of a popover.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the trigger, opens the popover and moves focus into it. |
| <kbd>Tab</kbd> | Moves to the next control inside the popover. From the last one it goes back to the first. |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Moves to the previous control, and from the first to the last. |
| <kbd>Esc</kbd> | Closes the popover and returns focus to the trigger. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The panel has `role="dialog"`. The trigger gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.
- Opening moves focus to the first control in the panel, or to the panel itself if it has none. Closing returns focus to the trigger.
- A click or tap outside the panel closes it.
- The panel stays inside the screen, with 8 pixels to spare, and flips to the other side of the trigger when it has to.
- The open and close animations only run when the visitor hasn't asked for reduced motion.
- When the content scrolls and has nothing inside that takes focus, the part that scrolls becomes a tab stop itself, with the popover's name. Without that, someone who doesn't use a mouse would have no way to scroll it.
- The arrow is hidden from screen readers and takes no clicks.

### What you need to handle

- Give `PopoverContent` a name with `aria-label`, or `aria-labelledby` pointing at a heading inside it. Without one, a screen reader only says "dialog".
- <kbd>Tab</kbd> goes round inside an open popover and doesn't carry on down the page. People leave with <kbd>Esc</kbd> or a click outside. If the panel holds more than a line or two, add a visible way out with `PopoverClose`.

## CSS variables

Popovers render at the end of `<body>`, so set these on `:root` or `body`, or straight on `PopoverContent` with `style` or a class. Setting them on the element around the trigger has no effect.

```css
:root {
  --nuv-popover-width: 22rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-popover-width` | `18rem` | Width of the panel. It still shrinks to fit a narrow screen. |
| `--nuv-popover-border` | `var(--color-border)` | Border color. The arrow's edge uses it too. |
| `--nuv-popover-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-popover-bg` | `var(--color-surface)` | Background color. The arrow is filled with it too. |
| `--nuv-popover-shadow` | `var(--shadow-lg)` | Shadow under the panel. |
| `--nuv-popover-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-popover-padding` | `calc(var(--spacing) * 4)` | Padding inside the panel. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-popover` | PopoverContent, which is the panel. |
| `.nuv-popover__arrow` | The arrow. |
| `.nuv-popover__arrow-frame` | An invisible box the arrow is placed against. It's only there with showArrow. |
| `.nuv-popover__body` | The element inside the panel that holds your content. It has the padding, and it's the part that scrolls. |

A `className` or `style` on `PopoverContent` goes to the panel. Your content sits one level down, in the body, so to lay it out as a grid or a row, wrap it in an element of your own.

The trigger is your own element, so it has no class from this component.

Radix sets `data-state="open"` or `data-state="closed"` on the panel, along with `data-side` and `data-align` for where it ended up. The animation hangs off `data-state`.

## Server components

The popover parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a popover together inside a server component, as the examples on this page do. It only needs a client component of your own when you control `open` or add handlers.

## Themed sections

A popover opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` and it will be.

## Do and don't

**Do**

- Keep it small. A popover that needs scrolling on a desktop should probably be a dialog.
- Open it from a button that says what's inside.
- Put the control people came for first, since that's where focus lands.

**Don't**

- Don't open a popover on hover. Touch screens have no hover, and it's easy to trigger by accident with a mouse.
- Don't put the only copy of important information in one. It's gone once it's closed.
- Don't open a popover from inside a popover.
