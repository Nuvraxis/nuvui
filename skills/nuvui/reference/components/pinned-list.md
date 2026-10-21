<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/pinned-list.mdx. Don't edit it here: run `pnpm skill`. -->

# PinnedList

A list in two groups, what's pinned at the top and the rest under it. Each item has a pin, and pressing it slides the item to the other group while the others make room.

Use a pinned list where people come back to a few things out of many: saved reports, projects, channels, customers. What they pin stays at the top, in the order of the list, and goes back to its place when it's unpinned.

```tsx
"use client";

import { PinnedList, PinnedListItem } from "@nuvui/react";

const reports: Record<string, { name: string; owner: string }> = {
  revenue: { name: "Revenue by month", owner: "Finance" },
  churn: { name: "Churn by plan", owner: "Customer success" },
  pipeline: { name: "Sales pipeline", owner: "Sales" },
  hiring: { name: "Hiring plan", owner: "People" },
  usage: { name: "Seats in use", owner: "Product" },
};

export default function Example() {
  return (
    <PinnedList
      items={Object.keys(reports)}
      defaultPinned={["pipeline"]}
      style={{ inlineSize: "100%", maxInlineSize: 400 }}
    >
      {(id) => {
        const report = reports[id];
        return (
          <PinnedListItem value={id} label={report?.name ?? id}>
            <div style={{ fontWeight: 500 }}>{report?.name}</div>
            <div style={{ color: "var(--color-muted-foreground)" }}>
              {report?.owner}
            </div>
          </PinnedListItem>
        );
      }}
    </PinnedList>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { PinnedList, PinnedListItem } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

### PinnedList

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `items` (required) | `string[]` |  | The items' ids, in their order. Both groups keep this order. |
| `pinned` | `string[]` |  | The ids that are pinned, when you keep them yourself. |
| `defaultPinned` | `string[]` | `[]` | The ids pinned to begin with, when the list keeps them. |
| `onPinnedChange` | `((pinned: string[], change: PinnedListChange) => void)` |  | Called when a pin is pressed, with the ids that are pinned now. |
| `children` (required) | `(value: string, pinned: boolean) => ReactNode` |  | Draws one item: a `PinnedListItem`, given its id and whether it's pinned. |
| `disabled` | `boolean` |  | Whether the pins can't be pressed. |
| `pinnedLabel` | `string` | `"Pinned"` | The name over the pinned items. Translate it with the rest of your interface. |
| `restLabel` | `string` | `"Everything else"` | The name over the rest. |
| `pinLabel` | `((label: string) => string)` | `(label) => 'Pin ${label}'` | The name of an item's pin, given the item's label. Whether it's pressed is said apart from the name. |
| `pinnedMessage` | `((label: string) => string)` | `(label) => 'Pinned ${label}'` | What a screen reader is told when an item is pinned. |
| `unpinnedMessage` | `((label: string) => string)` | `(label) => 'Unpinned ${label}'` | What a screen reader is told when an item is unpinned. |

It's a `div`, and takes what a `div` takes, including `ref` and `className`.

### PinnedListItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | The item's id, one of the list's `items`. |
| `label` (required) | `string` |  | The item's name, for its pin and for what a screen reader is told when it moves. |
| `children` | `ReactNode` |  | What's in the item, beside its pin. |

It's an `li`, with what you put in it and the pin after that.

## Items

`items` is the ids of everything in the list, in order. The function you give as children draws one item for an id: a `PinnedListItem` with that `value`, and a `label` that names it. The list calls it for each id in each group.

```tsx
<PinnedList items={["revenue", "churn", "pipeline"]}>
  {(id) => (
    <PinnedListItem value={id} label={reports[id].name}>
      {reports[id].name}
    </PinnedListItem>
  )}
</PinnedList>
```

Both groups keep the order of `items`, so an item that's unpinned goes back to where it was. A group with nothing in it isn't drawn, name and all.

What's in an item is yours, and can hold a link and buttons of its own. The pin is a button of its own, after them.

## Keeping what's pinned

The list keeps what's pinned by itself, starting from `defaultPinned`. To keep it yourself, so it can be saved for the next visit, pass `pinned` and `onPinnedChange`:

```tsx
"use client";

import { PinnedList, PinnedListItem } from "@nuvui/react";
import { useState } from "react";

const projects: Record<string, string> = {
  atlas: "Atlas",
  beacon: "Beacon",
  cobalt: "Cobalt",
  delta: "Delta",
};

export default function Example() {
  // Kept here, where it would be saved for the next visit.
  const [pinned, setPinned] = useState(["cobalt"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <PinnedList
        items={Object.keys(projects)}
        pinned={pinned}
        onPinnedChange={setPinned}
        pinnedLabel="Pinned projects"
        restLabel="All projects"
      >
        {(id) => (
          <PinnedListItem value={id} label={projects[id] ?? id}>
            <a href={`#${id}`}>{projects[id]}</a>
          </PinnedListItem>
        )}
      </PinnedList>
      <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
        {pinned.length} pinned
      </p>
    </div>
  );
}
```

`onPinnedChange` is given the ids that are pinned now, and what changed: the item's `value` and whether it's `pinned`. Ids in `pinned` that aren't in `items` are kept and not drawn, which suits a list that's been filtered.

## Motion

When an item moves, the list measures where everything was and where it is now, and each one slides from the first to the second. The item that moved goes over the others while they make room, and a group's name fades in when the group appears. Nothing moves for a visitor who asked for less motion.

The slide takes `--nuv-duration-slow`, with the `--ease-out` curve. Set `--nuv-pinned-list-duration` and `--nuv-pinned-list-easing` on the list, or anything around it, to change them. They're read when an item moves.

## Accessibility

Each group is a list, named by the words over it. Each pin is a button that's pressed or not.

### Keyboard

| Key | What it does |
| --- | --- |
| Tab | Moves to the next pin, or to the next link or button in an item. |
| Enter or Space | On a pin, pins or unpins its item. |

### What the component handles

- Each pin has one name, "Pin" and the item's label, and says whether it's pressed with `aria-pressed`. A pinned pin is filled as well as colored, so its state isn't shown by color alone.
- When an item moves to the other group, the focus stays on its pin.
- A status region says what happened: "Pinned Churn by plan", or "Unpinned Churn by plan".
- Each pin is 44 pixels square on a touch screen, and smaller with a mouse.
- Where the browser forces its own colors, a pin is drawn in the button color, and a pressed one in the highlight color.

### What you need to handle

- Give each item a `label` that names it the way people know it. It's read with the pin and in the status region.
- Translate the text the list writes: `pinnedLabel`, `restLabel`, `pinLabel`, `pinnedMessage` and `unpinnedMessage`. [Translation](../translation.md) lists them.

## CSS variables

Set any of these on the `PinnedList`, or on anything around it.

```css
.reports {
  --nuv-pinned-list-pin-active-fg: var(--color-warning);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-pinned-list-gap` | `calc(var(--spacing) * 4)` | The space between the two groups. |
| `--nuv-pinned-list-fg` | `var(--color-foreground)` | The color of the text. |
| `--nuv-pinned-list-padding-inline` | `calc(var(--spacing) * 3)` | The space before what's in an item, and before a group's name. |
| `--nuv-pinned-list-label-fg` | `var(--color-muted-foreground)` | The color of a group's name. |
| `--nuv-pinned-list-padding-block` | `calc(var(--spacing) * 1)` | The space above and below what's in an item. |
| `--nuv-pinned-list-radius` | `var(--radius-md)` | How round an item's corners are. |
| `--nuv-pinned-list-item-bg` | `transparent` | An item's background. None by default. |
| `--nuv-pinned-list-moving-bg` | `var(--color-background)` | The background of the item that's moving, so it covers the ones it passes. |
| `--nuv-pinned-list-moving-shadow` | `var(--shadow-md)` | The shadow under the item that's moving. |
| `--nuv-pinned-list-divider` | `var(--color-border)` | The line between two items. |
| `--nuv-pinned-list-pin-fg` | `var(--color-muted-foreground)` | The color of a pin that isn't pressed. |
| `--nuv-pinned-list-pin-hover-bg` | `var(--color-muted)` | A pin's background under the pointer. |
| `--nuv-pinned-list-pin-active-fg` | `var(--color-primary)` | The color of a pressed pin. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-pinned-list` | PinnedList. |
| `.nuv-pinned-list__content` | What you put in an item. |
| `.nuv-pinned-list__group` | A group: its name and its list. |
| `.nuv-pinned-list__item` | PinnedListItem. |
| `.nuv-pinned-list__items` | A group's list. |
| `.nuv-pinned-list__label` | A group's name. |
| `.nuv-pinned-list__pin` | An item's pin. |
| `.nuv-pinned-list__status` | The status region, out of sight. |

Which group a group is is in a `data-group` attribute, `pinned` or `rest`. An item has `data-state`, `pinned` or `unpinned`, and `data-moving` while it slides to the other group.

## Server components

PinnedList starts with `"use client"`. Its children are a function, so the component that renders it is a client component too.

## Do and don't

**Do**

- Keep what's pinned for the next visit, with `pinned` and `onPinnedChange`.
- Name items the way people know them.

**Don't**

- Don't use it to order a list by hand. That's what [Kanban](../kanban/kanban.md) and a sortable list are for.
- Don't put a pin on everything that can be chosen: a pinned list is for coming back to things, not selecting them.
