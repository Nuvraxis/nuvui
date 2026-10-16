<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/compare.mdx. Don't edit it here: run `pnpm skill`. -->

# Compare

Two pictures of the same thing, before and after, in one box. A divider dragged by its handle shows part of each, or a switch shows one at a time.

Use a compare to show what changed: a room before and after it was redone, a photo before and after it was edited, a screen of your app before and after a redesign. Both pictures are drawn in the same box. A divider shows before on one side of it and after on the other, and it's dragged by its handle.

```tsx
import { Compare } from "@nuvui/react";
import { kitchenAfter, kitchenBefore } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Compare
        before={
          <img src={kitchenBefore} alt="The kitchen with its old cabinets" />
        }
        after={
          <img src={kitchenAfter} alt="The kitchen with new wooden cabinets" />
        }
      />
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Compare } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `before` (required) | `ReactNode` |  | What it looked like before, such as an `img` with its own `alt`. |
| `after` (required) | `ReactNode` |  | What it looks like after. Both are drawn in the same box. |
| `mode` | `"slider" \| "toggle"` | `"slider"` | `"slider"` shows both, split by a divider that's dragged by its handle. `"toggle"` shows one at a time, with a switch under it. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Which way the divider moves. `"horizontal"` puts before at the start of the line and after at the end. `"vertical"` puts before on top. |
| `position` | `number` |  | How much of before shows, from 0 to 100, when you control it. In `"slider"` mode only. |
| `defaultPosition` | `number` | `50` | How much of before shows at first, when you don't control it. |
| `onPositionChange` | `((position: number) => void)` |  | Called with the new position while the divider moves. |
| `step` | `number` | `1` | How far one arrow key moves the divider. Page Up and Page Down move it ten times as far. |
| `shown` | `"after" \| "before"` |  | Which one shows, when you control it. In `"toggle"` mode only. |
| `defaultShown` | `"after" \| "before"` | `"before"` | Which one shows at first, when you don't control it. |
| `onShownChange` | `((shown: CompareSide) => void)` |  | Called with the one that was chosen. |
| `beforeLabel` | `string` | `"Before"` | The name of before, on the picture and on its switch. Translate it with the rest of your interface. |
| `afterLabel` | `string` | `"After"` | The name of after, on the picture and on its switch. |
| `labels` | `boolean` | `true` | Shows the two names on the picture. The switch in `"toggle"` mode shows them either way. |
| `dividerLabel` | `string` | `"Before and after"` | Accessible name of the divider, which a screen reader reads as a slider. |
| `valueLabel` | `((position: number, before: string, after: string) => string)` | `(position, before, after) => '${position}% ${before}, ${100 - position}% ${after}'` | What a screen reader says the position is. |
| `switchLabel` | `string` | `"Show"` | Accessible name of the switch in `"toggle"` mode. |

It's a `div`, and takes what a `div` takes, including `ref` and `className`.

## The pictures

`before` and `after` take anything: an `img`, a `picture`, a `video`, or markup of your own. An `img` or a `video` fills the box and is cropped to it, as with `object-fit: cover`. Give each its own `alt`, which says what it shows, since the two are read one after the other.

The box is as tall as `after` is. For a shape of your own, set `--nuv-compare-ratio`, and both pictures are cropped to it:

```css
.kitchen {
  --nuv-compare-ratio: 16 / 9;
}
```

Use two pictures of the same size, taken from the same place. The divider only reads as a change if what doesn't change lines up.

## The divider

The divider moves only when it's dragged: by its handle, or by the line anywhere along its length. A drag anywhere else on the picture is the page's, so on a phone a finger on the picture scrolls the page as it does everywhere else. The line is as wide as a finger to take hold of, though it's drawn thinner. A picture in the box can't be picked up and dragged out of it, as a browser lets an image be, since a press on it was most likely meant for the divider.

`position` is how much of before shows, from 0 to 100. Leave it out and the divider starts at `defaultPosition`, which is 50. Set it, with `onPositionChange`, to move the divider from your own controls:

```tsx
"use client";

import { Button, ButtonGroup, Compare } from "@nuvui/react";
import { useState } from "react";
import { kitchenAfter, kitchenBefore } from "./pictures";

export default function Example() {
  const [position, setPosition] = useState(50);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 560 }}>
      <Compare
        position={position}
        onPositionChange={setPosition}
        before={
          <img src={kitchenBefore} alt="The kitchen with its old cabinets" />
        }
        after={
          <img src={kitchenAfter} alt="The kitchen with new wooden cabinets" />
        }
      />
      <ButtonGroup aria-label="Move the divider">
        <Button intent="secondary" onClick={() => setPosition(100)}>
          All before
        </Button>
        <Button intent="secondary" onClick={() => setPosition(50)}>
          Half
        </Button>
        <Button intent="secondary" onClick={() => setPosition(0)}>
          All after
        </Button>
      </ButtonGroup>
      <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
        {Math.round(position)}% before
      </p>
    </div>
  );
}
```

## Vertical

With `orientation="vertical"`, before is on top and after below, and the divider moves up and down.

```tsx
import { Compare } from "@nuvui/react";
import { dashboardAfter, dashboardBefore } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Compare
        orientation="vertical"
        beforeLabel="Old"
        afterLabel="New"
        dividerLabel="Old and new dashboard"
        before={<img src={dashboardBefore} alt="The old dashboard, a table" />}
        after={
          <img
            src={dashboardAfter}
            alt="The new dashboard, with three figures and a bar chart"
          />
        }
      />
    </div>
  );
}
```

## A switch

With `mode="toggle"`, there's no divider. One picture shows at a time, with a switch under it to choose the other, and the change wipes across from one to the other. It's for pictures where a half of each says little, and for anyone who finds dragging hard. `shown`, `defaultShown` and `onShownChange` work as `position` does.

```tsx
import { Compare } from "@nuvui/react";
import { kitchenAfter, kitchenBefore } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Compare
        mode="toggle"
        switchLabel="Show the kitchen"
        before={
          <img src={kitchenBefore} alt="The kitchen with its old cabinets" />
        }
        after={
          <img src={kitchenAfter} alt="The kitchen with new wooden cabinets" />
        }
      />
    </div>
  );
}
```

The picture a switch hides is hidden from screen readers too, and nothing in it can take focus.

## Right to left

On a right-to-left page, before is on the right and after on the left, the start and end of the line there. The left arrow key moves the divider left, as it points, which shows more of before.

## Names

"Before" and "After" are drawn on the picture, and are the names on the switch. Change them with `beforeLabel` and `afterLabel`, to translate them or to say something closer to what's shown, such as "Old" and "New". `labels={false}` takes them off the picture. The switch keeps them.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the divider. |
| <kbd>←</kbd> and <kbd>→</kbd> | Move a divider that goes across by one step, the way the arrow points. Move a divider that goes up and down by one step, right for more of before. |
| <kbd>↑</kbd> and <kbd>↓</kbd> | Move a divider that goes up and down by one step, the way the arrow points. Move a divider that goes across by one step, up for more of before. |
| <kbd>Page Up</kbd> and <kbd>Page Down</kbd> | Move it by ten steps, more of before and less. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Show all of after, or all of before. |

In `mode="toggle"`, the switch is a group of two radio buttons: <kbd>Tab</kbd> reaches the chosen one, and the arrow keys choose the other.

### What the component handles

- The divider has `role="slider"`, a name, `aria-valuenow` from 0 to 100, and `aria-orientation`. A screen reader says how much of each shows, such as "40% Before, 60% After".
- Both pictures are in the page and in the order a screen reader reads them, with their names on them.
- The handle is 44 by 44 pixels, and the line can be taken anywhere along its length at the same width. Only the divider takes a drag, so the rest of the picture scrolls the page.
- Keyboard focus shows a 2 pixel ring around the handle.
- The names are white on a dark backing that reaches 4.5:1 over any picture.
- Where the browser forces its own colors, the line is drawn in the text color, the handle gets an edge, and the names a backing in the page's colors.
- For a visitor who asked for less motion, the switch changes the picture at once, without the wipe.

### What you need to handle

- Write an `alt` for each picture that says what it shows, so the two can be told apart without seeing them.
- Say in words what changed, near the pictures, if the change is the point. A screen reader user can't see a difference that's only in the picture.
- Translate the names, `dividerLabel` and `valueLabel` with the rest of your interface.

## CSS variables

Set any of these on the `Compare`, or on anything around it.

```css
.kitchen {
  --nuv-compare-radius: 0;
  --nuv-compare-ratio: 4 / 3;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-compare-gap` | `0.75rem` | Space between the picture and the switch. |
| `--nuv-compare-radius` | `var(--radius-lg)` | How round the picture's corners are. |
| `--nuv-compare-ratio` | `auto` | The shape of the box, such as 16 / 9. By default it's as tall as after. |
| `--nuv-compare-fit` | `cover` | How an img or video fills the box: cover, the default, crops it; contain shows all of it. |
| `--nuv-compare-position` | `50%` | Where the divider is, as a percentage. The component writes this. Don't set it. |
| `--nuv-compare-label-inset` | `0.75rem` | How far a name is from the edges. |
| `--nuv-compare-label-bg` | `color-mix(in oklab, var(--color-black) 65%, transparent)` | The backing behind a name on the picture. |
| `--nuv-compare-label-fg` | `var(--color-white)` | The color of a name on the picture. |
| `--nuv-compare-line-width` | `2px` | How thick the divider's line is drawn. |
| `--nuv-compare-line` | `var(--color-white)` | The color of the divider's line. |
| `--nuv-compare-handle-radius` | `var(--radius-md)` | How round the handle's corners are. |
| `--nuv-compare-handle-bg` | `var(--color-surface)` | The handle's background. |
| `--nuv-compare-handle-fg` | `var(--color-surface-foreground)` | The color of the arrows on the handle. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-compare` | Compare. |
| `.nuv-compare--toggle` | One picture at a time, with a switch. |
| `.nuv-compare--vertical` | A divider that moves up and down. |
| `.nuv-compare__divider` | The divider, as wide as a finger. Its line is drawn by `::before`. |
| `.nuv-compare__frame` | The box the pictures are drawn in. |
| `.nuv-compare__handle` | The handle in the middle of the divider. |
| `.nuv-compare__icon` | The arrows on the handle. |
| `.nuv-compare__label` | A name on the picture. |
| `.nuv-compare__label--after` | After's name. |
| `.nuv-compare__label--before` | Before's name. |
| `.nuv-compare__layer` | Around one picture. |
| `.nuv-compare__layer--before` | Around before, which lies over after and is cut off at the divider. |

Three more have no styles of their own, and are there for yours: `nuv-compare--horizontal` on the root, `nuv-compare__layer--after` around after, and `nuv-compare__switch` on the switch, a [ToggleGroup](toggle-group.md). The mode and the direction are also in `data-mode` and `data-orientation` attributes on the root.

## Content Security Policy

Where the divider is, is a `style` attribute in the page from the server. Under a policy without `style-src-attr 'unsafe-inline'`, the divider is in the middle until the page's script runs, whatever `defaultPosition` says, and where it should be from then on. The [Content Security Policy](../content-security-policy.md) page has the details.

## Server components

Compare starts with `"use client"`: it follows the pointer and the keys. A server component can render it with pictures it wrote, as long as it passes no functions, such as `onPositionChange` or `valueLabel`.

## Do and don't

**Do**

- Use two pictures taken from the same place, the same size.
- Say what changed in words as well.

**Don't**

- Don't compare two different things. It's for one thing that changed.
- Don't put text that has to be read across the divider. Half of it is in each picture.
