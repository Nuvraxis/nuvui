<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/dropdown-menu.mdx. Don't edit it here: run `pnpm skill`. -->

# Dropdown menu

A menu of actions that opens from a button, with keyboard navigation, checkable items and submenus.

Use a dropdown menu for a list of actions on one thing: rename, duplicate, delete. For picking a value in a form, use a [select](select.md).

```tsx
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem intent="danger">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `DropdownMenu` | Holds the open state. Renders nothing itself. |
| `DropdownMenuTrigger` | The button that opens the menu. Wrap your own with `asChild`. |
| `DropdownMenuContent` | The panel with the items. |
| `DropdownMenuItem` | One action. |
| `DropdownMenuCheckboxItem` | An item that's on or off. |
| `DropdownMenuRadioGroup` | Wraps radio items and holds which one is chosen. |
| `DropdownMenuRadioItem` | One choice in a radio group. |
| `DropdownMenuLabel` | A heading for the items under it. It can't be focused. |
| `DropdownMenuSeparator` | A line between groups of items. |
| `DropdownMenuShortcut` | The keys that do the same as an item, shown at the end of its row. |
| `DropdownMenuGroup` | Groups items for screen readers. It has no look of its own. |
| `DropdownMenuSub` | Holds the open state of a submenu. |
| `DropdownMenuSubTrigger` | The item that opens the submenu. |
| `DropdownMenuSubContent` | The submenu's panel. |

These are separate exports, not properties of `DropdownMenu`. `DropdownMenu.Item` isn't available, because property access on a client component doesn't work from a server component.

## Props

### DropdownMenuContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `align` | `"center" \| "end" \| "start"` | `"start"` | Which edge of the trigger the menu lines up with. |
| `sideOffset` | `number` | `6` | The gap between the trigger and the menu, in pixels. |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the menu may get to the edge of the screen, in pixels. It moves or flips to keep this much room. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the menu is rendered into. Set this when the menu should pick up a `data-theme` from a section of the page. |

One more from Radix that's often useful:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `side` | `"bottom" \| "left" \| "right" \| "top"` |  | The side of the trigger the menu opens on. It's `"bottom"` unless you say otherwise, and it flips to the opposite side when there isn't room. |

### DropdownMenuItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `intent` | `"danger" \| "neutral"` | `"neutral"` | Use `"danger"` for an action that destroys something. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onSelect` | `((event: Event) => void)` |  | Called when the item is chosen, by click or by keyboard. Call `event.preventDefault()` in it to keep the menu open. |
| `disabled` | `boolean` |  | Stops the item from being chosen. The arrow keys skip it. |
| `textValue` | `string` |  | The text that typing a letter matches against. Only needed when the item's content isn't plain text. |

### DropdownMenuCheckboxItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `checked` | `"indeterminate" \| boolean` |  | Whether the item is on. `"indeterminate"` shows a dash. |
| `onCheckedChange` | `((checked: boolean) => void)` |  | Called with the new state when the item is chosen. |

### DropdownMenuRadioGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The `value` of the radio item that's chosen. |
| `onValueChange` | `((value: string) => void)` |  | Called with an item's `value` when it's chosen. |

### DropdownMenu

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Whether it's open, when you control it yourself. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` |  | Whether it starts open, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when it opens or closes. |
| `modal` | `boolean` |  | On unless you pass `false`. While a modal menu is open, the rest of the page can't be clicked or scrolled, and screen readers can't reach it. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. With `"rtl"`, submenus open to the left and the left and right arrow keys swap. |

### DropdownMenuSubContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the submenu may get to the edge of the screen, in pixels. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the submenu is rendered into. Pass the same one as the menu's. |

The other parts take the same props as the Radix parts they wrap. The [Radix Dropdown Menu reference](https://www.radix-ui.com/primitives/docs/components/dropdown-menu#api-reference) lists them.

## Doing something

Give each item an `onSelect`. It runs for a click, a tap, <kbd>Enter</kbd> and <kbd>Space</kbd> alike, and the menu closes afterwards.

```tsx
"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [last, setLast] = useState("Nothing yet");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button intent="secondary">File</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setLast("New file")}>
            New file
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("Open")}>
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("Save")}>
            Save
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p style={{ margin: 0 }}>Last chosen: {last}</p>
    </div>
  );
}
```

## Checkable items

A checked item shows a check at the end of its row. Putting it there keeps every label lined up, whether or not the menu has checkable items.

```tsx
"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState("name");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary">View</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked={hidden} onCheckedChange={setHidden}>
          Show hidden files
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">
            Date changed
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Shortcuts

`DropdownMenuShortcut` shows the keys that do the same thing as an item, at the end of its row. It only shows them: listening for the keys is your code's job.

```tsx
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary">Edit</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem aria-keyshortcuts="Control+D">
          Duplicate
          <DropdownMenuShortcut>Ctrl+D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem aria-keyshortcuts="F2">
          Rename
          <DropdownMenuShortcut>F2</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem intent="danger" aria-keyshortcuts="Delete">
          Delete
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

It's hidden from screen readers, because its text would otherwise run into the item's name. To have the keys announced, put them in `aria-keyshortcuts` on the item, as the example does. That attribute has its own way of writing keys: `Control+D`, not `Ctrl+D`.

## Submenus

```tsx
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary">Share</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Copy link</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Send to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Email</DropdownMenuItem>
            <DropdownMenuItem>Messages</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

A submenu opens beside its parent, and on a phone there's little room beside anything. It stays on the screen by opening on whichever side has more room and getting narrower to fit, which can leave it cramped. A flat menu is easier to use there. Keep submenus for places you know have the width.

## On small screens

Rows are 44 pixels tall on a touch screen and 32 when a mouse or trackpad is the main input.

A menu is never taller than the room around its trigger. A long one scrolls inside itself.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd>, <kbd>Space</kbd> or <kbd>↓</kbd> | On the trigger, opens the menu and moves focus to its first item. |
| <kbd>↓</kbd> and <kbd>↑</kbd> | Move to the next or previous item. Disabled items are skipped. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last item. |
| A letter | Moves to the next item that starts with it. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Chooses the focused item. |
| <kbd>→</kbd> | On a submenu's trigger, opens the submenu. |
| <kbd>←</kbd> | Inside a submenu, closes it and goes back to its trigger. |
| <kbd>Esc</kbd> | Closes the menu and returns focus to the trigger. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The panel has `role="menu"` and is named by its trigger. Items have `menuitem`, `menuitemcheckbox` or `menuitemradio`, and the checkable ones have `aria-checked`.
- The trigger gets `aria-haspopup="menu"` and `aria-expanded`.
- Focus moves into the menu when it opens and back to the trigger when it closes.
- The row that has focus is filled with the primary color. That fill is the focus indicator: it has at least 3:1 contrast with the panel, and the text on it keeps 4.5:1. Radix moves focus to the row under the pointer too, so hovering and arrowing look the same.
- A `danger` item is filled with the danger color instead.
- Where the browser forces its own colors, as Windows high contrast does, the fill isn't drawn. The focused row has an outline there instead.
- The open and close animations only run when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give the trigger a name. An icon-only button needs `aria-label`.
- Ask before doing something that can't be undone. A menu item is easy to hit by mistake, so a `danger` item should open a [dialog](dialog.md) that confirms it.
- In a right-to-left layout, pass `dir="rtl"`.

### A note on automated checks

While a menu is open, Radix hides the rest of the page from screen readers. If you run axe on a page in that state, it reports the trigger under its `aria-hidden-focus` rule, because the trigger is a focusable element inside the hidden part.

Focus can't actually get there. <kbd>Tab</kbd> and clicks outside the menu are blocked until it closes. The library's own tests leave that rule out for open menus for this reason. Passing `modal={false}` avoids the report, and leaves the page reachable behind the menu.

## CSS variables

Menus render at the end of `<body>`, so set these on `:root` or `body`, or straight on `DropdownMenuContent` with `style` or a class.

```css
:root {
  --nuv-dropdown-menu-width: 14rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-dropdown-menu-width` | `12rem` | The narrowest the menu gets. It grows to fit its longest item. |
| `--nuv-dropdown-menu-border` | `var(--color-border)` | Border color of the panel, and the color of the separators. |
| `--nuv-dropdown-menu-radius` | `var(--radius-lg)` | Corner radius of the panel. |
| `--nuv-dropdown-menu-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-dropdown-menu-shadow` | `var(--shadow-lg)` | Shadow under the panel. |
| `--nuv-dropdown-menu-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-dropdown-menu-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Minimum height of a row. The default differs between touch screens and a mouse. |
| `--nuv-dropdown-menu-highlight-bg` | `var(--color-primary)` | Background of the row that has focus, from the pointer or the arrow keys. Keep it at 3:1 against the panel. |
| `--nuv-dropdown-menu-highlight-fg` | `var(--color-primary-foreground)` | Text color of that row. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-dropdown-menu` | DropdownMenuContent and DropdownMenuSubContent. |
| `.nuv-dropdown-menu__check` | The check mark inside it. |
| `.nuv-dropdown-menu__chevron` | The arrow at the end of DropdownMenuSubTrigger. |
| `.nuv-dropdown-menu__dash` | The dash shown while a checkbox item is indeterminate. |
| `.nuv-dropdown-menu__indicator` | The mark at the end of a checked item. Radix only renders it while the item is checked or indeterminate. |
| `.nuv-dropdown-menu__item` | Every kind of item, and DropdownMenuSubTrigger. |
| `.nuv-dropdown-menu__item--danger` | An item with intent="danger". |
| `.nuv-dropdown-menu__label` | DropdownMenuLabel. |
| `.nuv-dropdown-menu__separator` | DropdownMenuSeparator. |
| `.nuv-dropdown-menu__shortcut` | DropdownMenuShortcut. |

Radix sets `data-highlighted` on the row that has focus, `data-disabled` on a disabled one, and `data-state` on the panels, the submenu triggers and the checkable items. The fill and the animation hang off those.

## Server components

The menu parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a menu together inside a server component, as the first example on this page does. An `onSelect` handler is the usual reason to need a client component of your own. That's a React rule about passing functions from the server, not something specific to this library.

## Themed sections

A menu opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` to `DropdownMenuContent`, and to `DropdownMenuSubContent` if there is one.

## Do and don't

**Do**

- Start each item with a verb: "Rename", "Duplicate", "Delete".
- Put the destructive item last, after a separator, with `intent="danger"`.
- Leave an unavailable item in place and disable it, so the menu doesn't change shape.

**Don't**

- Don't use a menu for navigation between pages. Those are links.
- Don't hide the main action of a screen in a menu. Give it a button.
- Don't go more than one submenu deep.
