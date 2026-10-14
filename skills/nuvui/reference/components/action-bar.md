<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/action-bar.mdx. Don't edit it here: run `pnpm skill`. -->

# ActionBar

A bar that appears while something is selected, with what can be done to it, and tells a screen reader how much is selected.

Use an action bar for what can be done to a selection: messages ticked in a list, files in a grid, cards on a board. It's there while something is selected and gone when nothing is. A [data table](../table/index.md) has a bar of its own for selected rows.

```tsx
"use client";

import {
  ActionBar,
  ActionBarSelection,
  Button,
  Checkbox,
  Label,
} from "@nuvui/react";
import { useState } from "react";

const messages = [
  { id: "invoice", subject: "Invoice for March" },
  { id: "renewal", subject: "Your plan renews soon" },
  { id: "welcome", subject: "Welcome to the team" },
  { id: "export", subject: "Your export is ready" },
];

export default function Example() {
  const [selected, setSelected] = useState<string[]>(["invoice"]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <ul
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {messages.map((message) => (
          <li
            key={message.id}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <Checkbox
              id={`action-bar-${message.id}`}
              checked={selected.includes(message.id)}
              onCheckedChange={() => toggle(message.id)}
            />
            <Label htmlFor={`action-bar-${message.id}`}>
              {message.subject}
            </Label>
          </li>
        ))}
      </ul>
      <ActionBar
        open={selected.length > 0}
        position="static"
        aria-label="Selected messages"
      >
        <ActionBarSelection>{selected.length} selected</ActionBarSelection>
        <Button intent="secondary" size="sm" onClick={() => setSelected([])}>
          Archive
        </Button>
        <Button intent="ghost" size="sm" onClick={() => setSelected([])}>
          Clear
        </Button>
      </ActionBar>
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
import { ActionBar, ActionBarSelection } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `ActionBar` | The bar: a named group. It's told whether it's open. |
| `ActionBarSelection` | How much is selected, in words. |

The rest is yours: [buttons](button.md), a [separator](separator.md), a [menu](dropdown-menu.md) for what doesn't fit.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` (required) | `boolean` |  | Whether the bar is shown. Usually: whether anything is selected. |
| `position` | `"fixed" \| "static" \| "sticky"` | `"fixed"` | Where the bar is. `"fixed"` is the bottom of the window. `"sticky"` is the bottom of whatever scrolls around it, and it takes room in the page. `"static"` is where you put it, with nothing else done. |

`ActionBar` also takes what a `div` takes. `ref`, `className` and the rest go on the bar itself, which is in the page only while it's open. `ActionBarSelection` adds no props of its own.

## Where the bar is

`position` has three values.

- `"fixed"`, the default, puts the bar along the bottom of the window, over the page. Leave room at the end of the page so the bar doesn't cover the last row.
- `"sticky"` keeps it at the bottom of whatever scrolls around it, and it takes room there.
- `"static"` leaves it where you put it.

```tsx
"use client";

import {
  ActionBar,
  ActionBarSelection,
  Button,
  Checkbox,
  Label,
} from "@nuvui/react";
import { useState } from "react";

const files = Array.from({ length: 12 }, (_, index) => ({
  id: `file-${index + 1}`,
  name: `Report ${index + 1}.pdf`,
}));

export default function Example() {
  const [selected, setSelected] = useState<string[]>(["file-2", "file-3"]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );

  return (
    <section
      aria-label="Files"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable by keyboard
      tabIndex={0}
      style={{
        inlineSize: "100%",
        maxInlineSize: 360,
        blockSize: 260,
        overflow: "auto",
        paddingInline: 12,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      <ul
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          paddingBlock: 12,
          paddingInline: 0,
          listStyle: "none",
        }}
      >
        {files.map((file) => (
          <li
            key={file.id}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <Checkbox
              id={`action-bar-${file.id}`}
              checked={selected.includes(file.id)}
              onCheckedChange={() => toggle(file.id)}
            />
            <Label htmlFor={`action-bar-${file.id}`}>{file.name}</Label>
          </li>
        ))}
      </ul>
      <ActionBar
        open={selected.length > 0}
        position="sticky"
        aria-label="Selected files"
      >
        <ActionBarSelection>{selected.length} selected</ActionBarSelection>
        <Button intent="secondary" size="sm" onClick={() => setSelected([])}>
          Download
        </Button>
        <Button intent="danger" size="sm" onClick={() => setSelected([])}>
          Delete
        </Button>
      </ActionBar>
    </section>
  );
}
```

A closed bar takes no room in any of the three.

## What's selected is yours

The bar keeps no state. `open` is usually whether your selection has anything in it, and the buttons call your own functions. Clear the selection when an action is done, and the bar closes.

## Accessibility

An action bar has no keyboard behavior of its own. Its buttons are reached with Tab, in the order they're written.

### What the component handles

- The bar is a group with the name you give it.
- What `ActionBarSelection` says is read out when the bar appears, and again whenever it changes. The element a screen reader listens to is in the page all the time, open or not, because a change is only read out from something that was already there.
- The same words describe the group, so someone who tabs into the bar hears its name and how much is selected.
- The words that are drawn are hidden from screen readers, so they aren't read twice.
- The bar slides in. For a visitor who asked for less motion it appears.

### What you need to handle

- Name the bar with `aria-label`, such as "Selected messages".
- Put the bar in the page right after what it acts on. Tab goes from the list to the bar, wherever the bar is drawn.
- Give it a way to clear the selection: a button in the bar, and Escape in your list.
- Keep `ActionBarSelection` to text. It's in the page twice, so an `id` inside it would be too.
- When an action removes what was selected, move focus back to the list.

## On small screens

The bar is as wide as its content and no wider than the screen, and its buttons wrap onto a second row when they don't fit. Three actions is about what fits beside the count on a phone. Put the rest in a menu.

A fixed bar keeps clear of the home indicator on a phone.

## CSS variables

Set any of these on anything around the `ActionBar`. Some are read by the bar and some by what holds it, so a wrapper is the place.

```css
.inbox {
  --nuv-action-bar-offset: 1.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-action-bar-z` | `calc(var(--nuv-z-overlay) - 1)` | Stacking order of a fixed bar. Under a dialog by default. |
| `--nuv-action-bar-offset` | `calc(var(--spacing) * 4)` | Space between a fixed or sticky bar and the edges it's against. |
| `--nuv-action-bar-gap` | `calc(var(--spacing) * 2)` | Space between the things in the bar. |
| `--nuv-action-bar-padding` | `calc(var(--spacing) * 2)` | Space inside the bar. |
| `--nuv-action-bar-border` | `var(--color-border)` | Border color. |
| `--nuv-action-bar-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-action-bar-bg` | `var(--color-surface)` | Background color. |
| `--nuv-action-bar-shadow` | `var(--shadow-lg)`, `none` | Shadow. None by default with position="static". |
| `--nuv-action-bar-fg` | `var(--color-surface-foreground)` | Text color. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-action-bar` | What holds the bar, and is in the page whether it's open or not. |
| `.nuv-action-bar--fixed` | position="fixed" |
| `.nuv-action-bar--static` | position="static" |
| `.nuv-action-bar--sticky` | position="sticky" |
| `.nuv-action-bar__content` | The bar. `className` is added here. |
| `.nuv-action-bar__selection` | ActionBarSelection |
| `.nuv-action-bar__status` | What a screen reader listens to, drawn for nobody. |

Whether the bar is open is in a `data-state` attribute on what holds it: `open` or `closed`.

## Server components

ActionBar starts with `"use client"`: it hands the element that's listened to on to `ActionBarSelection`. A selection is state in any case, so the component that renders the bar is a client component.

## Do and don't

**Do**

- Put the count first and the most used action next to it.
- Keep destructive actions last, and in the danger intent.

**Don't**

- Don't use it for actions that don't need a selection. Those go in a [toolbar](toolbar.md).
- Don't cover the thing being selected. Leave room under a list for a fixed bar.
