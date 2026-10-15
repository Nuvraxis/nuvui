<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/toggle-group.mdx. Don't edit it here: run `pnpm skill`. -->

# ToggleGroup

A strip of toggles that share one value. One can be pressed at a time, or several.

Use a toggle group to switch between a few views or modes, or to turn several related options on and off, where the choice takes effect at once. In a form that's saved with a button, a [radio group](radio-group.md) or [checkboxes](checkbox.md) say that better.

```tsx
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";

export default function Example() {
  return (
    <ToggleGroup type="single" aria-label="View" defaultValue="list">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
      <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS. Loaded one by one, a group needs `toggle.css` as well as `toggle-group.css`, because each of its buttons is a [toggle](toggle.md).

## Parts

| Part | What it is |
| --- | --- |
| `ToggleGroup` | Holds the value and lays the buttons out. |
| `ToggleGroupItem` | One button. It takes its variant and size from the group. |

## Props

### ToggleGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `variant` | `"ghost" \| "outline"` | `"outline"` | `"outline"` joins the buttons into one strip. `"ghost"` leaves a small gap between them and gives none an edge until it's pressed. |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` | The size of every button in the group. |

These come from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `type` (required) | `"multiple" \| "single"` |  | `"single"` lets one button be pressed at a time. `"multiple"` lets any number be. It's required, and it decides what kind of value the group has. |
| `value` | `string \| string[]` |  | The pressed button, or buttons, when you control it yourself: a string for `"single"` and an array of strings for `"multiple"`. |
| `defaultValue` | `string \| string[]` |  | The same, for what's pressed at first when you don't control it. |
| `onValueChange` | `((value: string) => void) \| ((value: string[]) => void)` |  | Called with the new value. With `"single"`, it's an empty string when the pressed button is pressed again. |
| `orientation` | `"horizontal" \| "vertical"` |  | `"vertical"` stacks the buttons. It also decides which arrow keys move between them. |
| `disabled` | `boolean` |  | Disables every button. |
| `rovingFocus` | `boolean` |  | Whether the group is one tab stop that the arrow keys move inside. It's `true` by default. |
| `loop` | `boolean` |  | Whether the arrow keys wrap around from the last button to the first. It's `true` by default. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. In `"rtl"` the left and right arrow keys swap. |

### ToggleGroupItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the group's value holds while this button is pressed. |
| `disabled` | `boolean` |  | Stops this button from being pressed. The arrow keys skip it. |

## Several at once

```tsx
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";

export default function Example() {
  return (
    <ToggleGroup
      type="multiple"
      variant="ghost"
      aria-label="Text style"
      defaultValue={["bold"]}
    >
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

`variant="ghost"` leaves a small gap between the buttons and gives none of them an edge. The default, `"outline"`, joins them into one strip.

## Always one pressed

With `type="single"`, pressing the pressed button again lets go of it, and the group has no value. For a view switcher that should always have one, ignore the empty value.

```tsx
"use client";

import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [align, setAlign] = useState("left");

  return (
    <ToggleGroup
      type="single"
      aria-label="Alignment"
      value={align}
      // Radix sends an empty string when the pressed button is pressed
      // again. Ignoring it keeps one of them always picked.
      onValueChange={(value) => {
        if (value) setAlign(value);
      }}
    >
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus into the group, to the pressed button or the first one, and out again. The group is one tab stop. |
| <kbd>→</kbd> and <kbd>←</kbd> | Move to the next or previous button, without pressing it. In a vertical group it's <kbd>↓</kbd> and <kbd>↑</kbd>. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last button. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | Presses or releases the button that has focus. |

In a right-to-left group, <kbd>←</kbd> and <kbd>→</kbd> swap.

### What the component handles

Most of this is Radix. The library doesn't change it.

- With `type="single"`, the group has `role="radiogroup"` and each button `role="radio"` with `aria-checked`. With `type="multiple"`, the group has `role="toolbar"` and each button `aria-pressed`.
- The pressed button is filled with the primary color, which has at least 3:1 contrast with the page in every theme. [Toggle](toggle.md#why-pressed-is-a-solid-fill) has the reasoning.
- In a joined strip, the pressed button's edge is drawn over its neighbours', and the button with focus is drawn over both, so its ring isn't cut off.
- The joined corners follow the reading direction and the orientation.

### What you need to handle

- Name the group with `aria-label` or `aria-labelledby`.
- Give each icon-only button an `aria-label`.
- Unlike a radio group, the arrow keys only move focus here. A press is needed to change the value.

## CSS variables

The buttons read the [toggle's variables](toggle.md#css-variables). Set them on the group and every button in it follows. The group adds one of its own.

```css
.toolbar {
  --nuv-toggle-on-bg: var(--color-foreground);
  --nuv-toggle-on-fg: var(--color-background);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-toggle-group-gap` | `var(--spacing)` | Space between buttons in the ghost variant. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-toggle-group` | ToggleGroup. |
| `.nuv-toggle-group--ghost` | variant="ghost" |
| `.nuv-toggle-group--horizontal` | orientation="horizontal", which is the default. |
| `.nuv-toggle-group--outline` | variant="outline" |
| `.nuv-toggle-group--vertical` | orientation="vertical" |
| `.nuv-toggle-group__item` | ToggleGroupItem. It has the toggle's classes too: `nuv-toggle` and the two for its variant and size. |

## Server components

The toggle group parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a group together inside a server component, as the first example on this page does. It needs a client component of your own once you pass `onValueChange`, which is most real uses.

## Do and don't

**Do**

- Keep it to a handful of buttons with short labels. On a phone a long strip runs off the screen.
- Use it where the change shows straight away.

**Don't**

- Don't mix it up with [tabs](tabs.md). Tabs switch between panels of content, each with its own heading. A toggle group changes how one thing is shown.
- Don't use a toggle group for navigation between pages.
