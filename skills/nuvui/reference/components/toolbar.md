<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/toolbar.mdx. Don't edit it here: run `pnpm skill`. -->

# Toolbar

A row of buttons, links and toggles that the Tab key treats as one stop, with the arrow keys moving inside it.

Use a toolbar for a set of controls that act on the same thing: the formatting buttons of an editor, the tools of a drawing app, the actions above a table. What makes it a toolbar is the keyboard: one press of <kbd>Tab</kbd> gets past it, however many controls it holds.

Three controls or fewer don't need one. A plain row of [buttons](button.md) is simpler, and each button is then its own tab stop.

```tsx
import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react";

export default function Example() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup
        type="single"
        defaultValue="left"
        aria-label="Alignment"
      >
        <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
        <ToolbarToggleItem value="center">Center</ToolbarToggleItem>
        <ToolbarToggleItem value="right">Right</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarLink href="#formatting-help">Help</ToolbarLink>
      <ToolbarButton>Share</ToolbarButton>
    </Toolbar>
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
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Toolbar` | The row. It has `role="toolbar"`. |
| `ToolbarButton` | A button. |
| `ToolbarLink` | A link, which the arrow keys reach like the buttons. |
| `ToolbarToggleGroup` | A group of buttons that stay pressed. |
| `ToolbarToggleItem` | One of those buttons. |
| `ToolbarSeparator` | A line between two groups. |

## Props

All of these come from Radix.

### Toolbar

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` |  | `"horizontal"` or `"vertical"`. It sets the layout and which arrow keys move focus. Horizontal by default. |
| `loop` | `boolean` |  | Whether the arrow keys go round from the last control to the first. On by default. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction, which decides which of the left and right arrows goes forward. It's taken from `DirectionProvider` when not set. |

### ToolbarToggleGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `type` (required) | `"multiple" \| "single"` |  | `"single"` lets one button be pressed at a time. `"multiple"` lets any number. |
| `value` | `string \| string[]` |  | The pressed button's value, or an array of them for `"multiple"`, when you control it yourself. Use it with `onValueChange`. |
| `defaultValue` | `string \| string[]` |  | What's pressed to begin with, when you don't control it. |
| `onValueChange` | `((value: string) => void) \| ((value: string[]) => void)` |  | Called with the new value when a button is pressed. |
| `disabled` | `boolean` |  | Disables every button in the group. |

### ToolbarToggleItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What this button stands for in the group's value. |
| `disabled` | `boolean` |  | Stops it from being focused or pressed. |

`ToolbarButton`, `ToolbarLink` and `ToolbarSeparator` take what their elements take. `ToolbarButton` also takes `asChild`, which is how [other components join the toolbar](#a-menu-in-a-toolbar).

## Icons

A toolbar of icons needs a name on each control, with `aria-label`. A control holding only an icon comes out square.

```tsx
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </svg>
  );
}

export default function Example() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarButton aria-label="Undo">
        <Icon>
          <path d="M3 6h7a3.5 3.5 0 010 7H6M3 6l3-3M3 6l3 3" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton aria-label="Redo" disabled>
        <Icon>
          <path d="M13 6H6a3.5 3.5 0 000 7h4M13 6l-3-3M13 6l-3 3" />
        </Icon>
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold" aria-label="Bold">
          <Icon>
            <path d="M4.5 3h4a2.5 2.5 0 010 5h-4zm0 5h4.5a2.5 2.5 0 010 5H4.5z" />
          </Icon>
        </ToolbarToggleItem>
        <ToolbarToggleItem value="italic" aria-label="Italic">
          <Icon>
            <path d="M6.5 3h5M4.5 13h5M9.5 3l-3 10" />
          </Icon>
        </ToolbarToggleItem>
        <ToolbarToggleItem value="underline" aria-label="Underline">
          <Icon>
            <path d="M4.5 3v4.5a3.5 3.5 0 007 0V3M4 13.5h8" />
          </Icon>
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
    </Toolbar>
  );
}
```

A [tooltip](tooltip.md) on each one helps people who see the icon and don't know what it means. `aria-label` doesn't do that: it's for screen readers only.

## A menu in a toolbar

Any button can take part in the toolbar's arrow-key order. Pass `asChild` to `ToolbarButton` and put the other component's trigger inside.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from "@nuvui/react";

export default function Example() {
  return (
    <Toolbar aria-label="Document">
      <ToolbarButton>Save</ToolbarButton>
      <ToolbarButton>Print</ToolbarButton>
      <ToolbarSeparator />
      <DropdownMenu>
        <ToolbarButton asChild>
          <DropdownMenuTrigger>Export</DropdownMenuTrigger>
        </ToolbarButton>
        <DropdownMenuContent>
          <DropdownMenuItem>PDF</DropdownMenuItem>
          <DropdownMenuItem>Word document</DropdownMenuItem>
          <DropdownMenuItem>Plain text</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Toolbar>
  );
}
```

## Vertical

`orientation="vertical"` stacks the controls, turns the separators on their side, and moves focus with the up and down arrows.

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@nuvui/react";

export default function Example() {
  return (
    <Toolbar orientation="vertical" aria-label="Drawing tools">
      <ToolbarButton>Select</ToolbarButton>
      <ToolbarButton>Pen</ToolbarButton>
      <ToolbarButton>Shape</ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton>Erase</ToolbarButton>
    </Toolbar>
  );
}
```

## On small screens

A toolbar that runs out of room wraps onto another row, so nothing is pushed off the screen. The arrow keys still go through the controls in order.

On a touch screen every control is at least 44 pixels tall and wide. With a mouse or trackpad they're 32 pixels at the default [density](../theming.md#density), 28 at compact and 36 at comfortable. A toolbar is a dense row by nature, so it takes the smallest of the three control heights.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus into the toolbar, to the control that had focus last time, and out again with the next press. |
| <kbd>→</kbd> and <kbd>←</kbd> | Move to the next and the previous control. In a vertical toolbar it's <kbd>↓</kbd> and <kbd>↑</kbd>. In a right-to-left toolbar the left arrow goes forward. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first and the last control. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | Press the control that has focus. |

Disabled controls are skipped.

### What the component handles

- `role="toolbar"` and `aria-orientation`, and the keys above. This part is Radix.
- A toggle group of type `single` is a radio group, and each button a radio button with `aria-checked`. One of type `multiple` is a plain group, and each button has `aria-pressed`.
- The separator has `role="separator"`, so a screen reader says where one group ends.
- A pressed toggle is filled with the primary color, which has at least 3:1 against the toolbar in every theme. Where the browser forces its own colors, it takes the system's colors for something selected.
- Keyboard focus shows a 2 pixel ring in `--color-ring`.

### What you need to handle

- **Name the toolbar** with `aria-label`: "Formatting", "Drawing tools". Name each toggle group too.
- **Give an icon-only control an `aria-label`.**
- **Don't put a text field in a toolbar.** The arrow keys move the caret inside a field, so they can't also move to the next control, and people get stuck. A field belongs next to the toolbar. The [ARIA guide](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) has more on this.
- Keep a toggle's name the same in both states. `aria-pressed` says which state it's in.

## CSS variables

Set any of these on `Toolbar`, or on anything around it.

```css
.editor {
  --nuv-toolbar-border: transparent;
  --nuv-toolbar-padding: 0;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-toolbar-gap` | `var(--spacing)` | Space between the controls. |
| `--nuv-toolbar-padding` | `var(--spacing)` | Padding inside the toolbar. |
| `--nuv-toolbar-border` | `var(--color-border)` | Color of the toolbar's edge and of the separators. |
| `--nuv-toolbar-radius` | `var(--radius-lg)` | Corner radius of the toolbar. |
| `--nuv-toolbar-bg` | `var(--color-surface)` | Background color of the toolbar. |
| `--nuv-toolbar-item-padding-inline` | `calc(var(--spacing) * 2.5)` | Padding left and right in a control. |
| `--nuv-toolbar-item-radius` | `var(--radius-md)` | Corner radius of a control. |
| `--nuv-toolbar-fg` | `var(--color-surface-foreground)` | Text color of the controls. |
| `--nuv-toolbar-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Smallest height, and smallest width, of a control. Differs by whether the device is touch. |
| `--nuv-toolbar-item-hover-bg` | `var(--color-muted)` | Background color of a control under the pointer. |
| `--nuv-toolbar-on-bg` | `var(--color-primary)` | Background color of a pressed toggle. Keep it at 3:1 against the toolbar. |
| `--nuv-toolbar-on-fg` | `var(--color-primary-foreground)` | Text color of a pressed toggle. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-toolbar` | Toolbar. |
| `.nuv-toolbar__button` | ToolbarButton. |
| `.nuv-toolbar__link` | ToolbarLink. |
| `.nuv-toolbar__separator` | ToolbarSeparator. |
| `.nuv-toolbar__toggle-group` | ToolbarToggleGroup. |
| `.nuv-toolbar__toggle-item` | ToolbarToggleItem. |

Radix sets `data-orientation` on the toolbar, the groups and the separators, `data-state` to `on` or `off` on a toggle, and `data-disabled` on a disabled control.

## Server components

The toolbar parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files. You can render them from a server component, as the examples on this page do.

## Do and don't

**Do**

- Group controls that belong together, with a separator between groups.
- Put the controls people use most at the start, where focus lands.

**Don't**

- Don't use a toolbar for a site's navigation. That's a [navigation menu](navigation-menu.md), or a plain list of links.
- Don't disable a control without saying why somewhere. A grayed-out button with no explanation is a dead end.
