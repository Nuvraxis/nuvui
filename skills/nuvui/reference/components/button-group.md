<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/button-group.mdx. Don't edit it here: run `pnpm skill`. -->

# ButtonGroup

Joins buttons, and the inputs or selects next to them, into one strip with shared edges.

Use a button group for actions that belong together, for a main action with a menu of variations beside it, or to attach a button to an input. Each thing in the group keeps working as it did. The group only changes how they're drawn.

```tsx
import { Button, ButtonGroup } from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup aria-label="Message actions">
      <Button intent="secondary">Reply</Button>
      <Button intent="secondary">Forward</Button>
      <Button intent="secondary">Archive</Button>
    </ButtonGroup>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Button, ButtonGroup } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Which way the buttons run. |

Everything else is passed to the `<div>` it renders, including `ref`, `className` and `aria-label`.

## What can go in one

The group works on its direct children. It takes the round corners off where two meet and overlaps their edges, so there's one line between them and not two.

These all have an edge of their own and join cleanly: [Button](button.md), [Input](input.md), `SelectTrigger`, [Toggle](toggle.md) and [InputGroup](input-group.md). A menu's trigger works too when it's a button, as in the next example.

[NativeSelect](native-select.md) and [PasswordInput](password-input.md) draw their edge on an element inside a wrapper, so the group can't square their corners. Keep them out of a group.

## A main action with a menu

```tsx
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup>
      <Button>Publish</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More ways to publish">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Publish at a set time</DropdownMenuItem>
          <DropdownMenuItem>Save as a draft</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
```

Two filled buttons side by side would read as one, so the second gets a thin line on the side where they meet. It's mixed from the button's own text color, so it shows on any fill.

## With an input

```tsx
import { Button, ButtonGroup, Input } from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup style={{ inlineSize: "100%", maxInlineSize: 360 }}>
      <Input type="email" aria-label="Email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </ButtonGroup>
  );
}
```

The input takes the room the buttons leave. To put something inside the input's box instead, such as an icon or a unit, that's an [InputGroup](input-group.md).

## Vertical

```tsx
import { Button, ButtonGroup } from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Zoom">
      <Button intent="secondary" aria-label="Zoom in">
        +
      </Button>
      <Button intent="secondary" aria-label="Zoom out">
        −
      </Button>
    </ButtonGroup>
  );
}
```

## Accessibility

### Keyboard

A group adds no keyboard behavior. <kbd>Tab</kbd> goes to each button in turn, as it would without the group.

If you want a strip that's one tab stop with arrow keys inside it, that's a [toggle group](toggle-group.md).

### What the component handles

- It has `role="group"`, so a screen reader can say that the buttons belong together. Give it a name with `aria-label` when that helps, for example "Message actions".
- The button with keyboard focus is drawn above its neighbours, so no part of its ring is covered.
- The joined corners follow the reading direction: in a right-to-left layout the first button is on the right and has the round corners there.

### What you need to handle

- Give an icon-only button its own `aria-label`. The group's name doesn't replace it.
- On a phone, check that the strip fits. A group doesn't wrap, because a strip that breaks onto two lines no longer looks joined.

## CSS variables

The group reads one variable of its own. Everything else about how the buttons look comes from the [button's variables](button.md#css-variables), which you can set on the group to change every button in it.

```css
.editor-toolbar {
  --nuv-button-radius: var(--radius-full);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-button-group-divider` | `color-mix(in oklab, currentcolor 35%, transparent)` | Color of the line between two filled buttons, those with the primary or danger intent. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-button-group` | The group. |
| `.nuv-button-group--horizontal` | orientation="horizontal" |
| `.nuv-button-group--vertical` | orientation="vertical" |

## Server components

ButtonGroup has no `"use client"` directive and uses no state, so it renders in a server component as it is.

## Do and don't

**Do**

- Group actions that act on the same thing.
- Keep one intent across a group. A primary button joined to a secondary one looks like a mistake.

**Don't**

- Don't use a group for a choice between options. That's a [toggle group](toggle-group.md) or a [radio group](radio-group.md).
- Don't join more buttons than fit on a phone.
