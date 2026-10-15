<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/context-menu.mdx. Don't edit it here: run `pnpm skill`. -->

# Context menu

A menu of actions that opens where someone right-clicks, or presses and holds on a touch screen.

Use a context menu to offer the actions for one thing where the pointer already is: a file in a list, a row in a table, a block on a canvas. Nothing on the page says the menu is there, so it can only be a shortcut. Every action in it needs another way to be reached.

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        style={{
          display: "grid",
          placeItems: "center",
          inlineSize: "min(100%, 18rem)",
          blockSize: "7rem",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          fontSize: 14,
        }}
      >
        Right-click, or press and hold
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="report.pdf">
        <ContextMenuLabel>report.pdf</ContextMenuLabel>
        <ContextMenuItem>
          Open
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>Share</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem intent="danger">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `ContextMenu` | Holds the open state. Renders nothing itself. |
| `ContextMenuTrigger` | The area that takes the right click. It renders a `span`. Pass `asChild` to use your own element. |
| `ContextMenuContent` | The panel with the items. |
| `ContextMenuItem` | One action. |
| `ContextMenuCheckboxItem` | An item that's on or off. |
| `ContextMenuRadioGroup` | Wraps radio items and holds which one is chosen. |
| `ContextMenuRadioItem` | One choice in a radio group. |
| `ContextMenuLabel` | A heading for the items under it. It can't be focused. |
| `ContextMenuSeparator` | A line between groups of items. |
| `ContextMenuShortcut` | The keys that do the same as an item, shown at the end of its row. |
| `ContextMenuGroup` | Groups items for screen readers. It has no look of its own. |
| `ContextMenuSub` | Holds the open state of a submenu. |
| `ContextMenuSubTrigger` | The item that opens the submenu. |
| `ContextMenuSubContent` | The submenu's panel. |

These are separate exports, not properties of `ContextMenu`. `ContextMenu.Item` isn't available, because property access on a client component doesn't work from a server component.

The parts and their props match the [dropdown menu](dropdown-menu.md), so the items of one can be moved to the other by changing the names.

## Props

### ContextMenuContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the menu may get to the edge of the screen, in pixels. It moves or flips to keep this much room. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the menu is rendered into. Set this when the menu should pick up a `data-theme` from a section of the page. |

The menu opens at the pointer, so there's no `side` or `align` to set.

### ContextMenuItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `intent` | `"danger" \| "neutral"` | `"neutral"` | Use `"danger"` for an action that destroys something. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onSelect` | `((event: Event) => void)` |  | Called when the item is chosen, by click or by keyboard. Call `event.preventDefault()` in it to keep the menu open. |
| `disabled` | `boolean` |  | Stops the item from being chosen. The arrow keys skip it. |
| `textValue` | `string` |  | The text that typing a letter matches against. Only needed when the item's content isn't plain text. |

### ContextMenuTrigger

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `disabled` | `boolean` |  | Leaves the area alone, so a right click on it opens the browser's own menu. |
| `asChild` | `boolean` |  | Renders the element you pass in place of the `span`, and gives it the right click. |

### ContextMenu

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when it opens or closes. |
| `modal` | `boolean` |  | On unless you pass `false`. While a modal menu is open, the rest of the page can't be clicked or scrolled, and screen readers can't reach it. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. With `"rtl"`, submenus open to the left and the left and right arrow keys swap. |

A context menu can't start out open, because it has no place to open at until someone points. There's no `defaultOpen`.

### ContextMenuSubContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the submenu may get to the edge of the screen, in pixels. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the submenu is rendered into. Pass the same one as the menu's. |

`ContextMenuCheckboxItem`, `ContextMenuRadioGroup` and the other parts take the same props as the Radix parts they wrap. The [Radix Context Menu reference](https://www.radix-ui.com/primitives/docs/components/context-menu#api-reference) lists them.

## Another way to the same actions

A context menu is hidden until someone thinks to right-click, and many people never do. Put the same actions behind a button that can be seen as well. Here the row has a "more" button with a [dropdown menu](dropdown-menu.md) that holds the same three.

```tsx
"use client";

import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

const actions = ["Open", "Rename", "Move"];

export default function Example() {
  const [last, setLast] = useState("nothing yet");

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "min(100%, 20rem)" }}>
      <ContextMenu>
        <ContextMenuTrigger
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 8px 8px 16px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 14,
          }}
        >
          report.pdf
          {/* The same actions, for everyone who doesn't right-click. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                intent="ghost"
                size="sm"
                aria-label="Actions for report.pdf"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <circle cx="3" cy="8" r="1.25" />
                  <circle cx="8" cy="8" r="1.25" />
                  <circle cx="13" cy="8" r="1.25" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem key={action} onSelect={() => setLast(action)}>
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="report.pdf">
          {actions.map((action) => (
            <ContextMenuItem key={action} onSelect={() => setLast(action)}>
              {action}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
      <p style={{ margin: 0, fontSize: 14 }}>Last chosen: {last}</p>
    </div>
  );
}
```

## Checkable items

```tsx
"use client";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState("name");

  return (
    <ContextMenu>
      <ContextMenuTrigger
        style={{
          display: "grid",
          placeItems: "center",
          inlineSize: "min(100%, 18rem)",
          blockSize: "7rem",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          fontSize: 14,
        }}
      >
        Sorted by {sort}
        {hidden ? ", hidden files shown" : ""}
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="View">
        <ContextMenuCheckboxItem checked={hidden} onCheckedChange={setHidden}>
          Show hidden files
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
          <ContextMenuLabel>Sort by</ContextMenuLabel>
          <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          <ContextMenuRadioItem value="date">Date</ContextMenuRadioItem>
          <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

## Submenus

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        style={{
          display: "grid",
          placeItems: "center",
          inlineSize: "min(100%, 18rem)",
          blockSize: "7rem",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          fontSize: 14,
        }}
      >
        photo.jpg
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="photo.jpg">
        <ContextMenuItem>Copy link</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Send to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Messages</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

A submenu opens beside its parent, and on a phone there's little room beside anything. It stays on the screen by opening on whichever side has more room and getting narrower to fit. A flat menu is easier to use there.

## Shortcuts

`ContextMenuShortcut` shows the keys that do the same thing as an item. It only shows them: listening for the keys is your code's job.

It's hidden from screen readers, because its text would otherwise run into the item's name. To have the keys announced, put them in `aria-keyshortcuts` on the item, written the way that attribute expects: `aria-keyshortcuts="Control+N"`.

## On touch screens

There's no right click on a touch screen. The menu opens when a finger stays on the area for 700 milliseconds, at the place it's touching. A finger that moves or lifts before that opens nothing, so the area can still be scrolled and tapped.

Rows are 44 pixels tall on a touch screen and 32 when a mouse or trackpad is the main input.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Shift</kbd> + <kbd>F10</kbd>, or the menu key | On Windows and Linux, with focus in the area, opens the menu. The browser turns these keys into the same event as a right click, and decides where the menu appears. |
| <kbd>↓</kbd> and <kbd>↑</kbd> | Move to the next or previous item. Disabled items are skipped. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last item. |
| A letter | Moves to the next item that starts with it. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Chooses the focused item. |
| <kbd>→</kbd> | On a submenu's trigger, opens the submenu. |
| <kbd>←</kbd> | Inside a submenu, closes it and goes back to its trigger. |
| <kbd>Esc</kbd> | Closes the menu. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The panel has `role="menu"`. Items have `menuitem`, `menuitemcheckbox` or `menuitemradio`, and the checkable ones have `aria-checked`.
- Focus moves into the menu when it opens.
- The row that has focus is filled with the primary color. That fill is the focus indicator: it has at least 3:1 contrast with the panel, and the text on it keeps 4.5:1. Radix moves focus to the row under the pointer too, so hovering and arrowing look the same.
- Where the browser forces its own colors, as Windows high contrast does, the fill isn't drawn. The focused row has an outline there instead.
- The menu stays on the screen, wherever it's opened from.
- The open and close animations only run when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give every action another way in, as in [the example above](#another-way-to-the-same-actions). Nothing on the page shows that the menu is there, and not every keyboard has a key that opens it.
- The area has to hold something that can take focus, or take it itself with `tabIndex={0}`, for the keyboard shortcut to have anywhere to work from.
- Name the menu with `aria-label` on `ContextMenuContent`. Unlike a dropdown menu, it has no button to take a name from.
- Ask before doing something that can't be undone. A `danger` item should open an [alert dialog](alert-dialog.md) that confirms it.
- In a right-to-left layout, pass `dir="rtl"`.

### A note on automated checks

While a menu is open, Radix hides the rest of the page from screen readers. If you run axe on a page in that state, it reports whatever in the hidden part can take focus under its `aria-hidden-focus` rule.

Focus can't actually get there. <kbd>Tab</kbd> and clicks outside the menu are blocked until it closes. The library's own tests leave that rule out for open menus for this reason. Passing `modal={false}` avoids the report, and leaves the page reachable behind the menu.

## CSS variables

Menus render at the end of `<body>`, so set these on `:root` or `body`, or straight on `ContextMenuContent` with `style` or a class. They're separate from the dropdown menu's variables: changing `--nuv-dropdown-menu-width` doesn't change a context menu.

```css
:root {
  --nuv-context-menu-width: 14rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-context-menu-width` | `12rem` | The narrowest the menu gets. It grows to fit its longest item. |
| `--nuv-context-menu-border` | `var(--color-border)` | Border color of the panel, and the color of the separators. |
| `--nuv-context-menu-radius` | `var(--radius-lg)` | Corner radius of the panel. |
| `--nuv-context-menu-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-context-menu-shadow` | `var(--shadow-lg)` | Shadow under the panel. |
| `--nuv-context-menu-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-context-menu-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Minimum height of a row. The default differs between touch screens and a mouse. |
| `--nuv-context-menu-highlight-bg` | `var(--color-primary)` | Background of the row that has focus, from the pointer or the arrow keys. Keep it at 3:1 against the panel. |
| `--nuv-context-menu-highlight-fg` | `var(--color-primary-foreground)` | Text color of that row. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-context-menu` | ContextMenuContent and ContextMenuSubContent. |
| `.nuv-context-menu__check` | The check mark inside it. |
| `.nuv-context-menu__chevron` | The arrow at the end of ContextMenuSubTrigger. |
| `.nuv-context-menu__dash` | The dash shown while a checkbox item is indeterminate. |
| `.nuv-context-menu__indicator` | The mark at the end of a checked item. Radix only renders it while the item is checked or indeterminate. |
| `.nuv-context-menu__item` | Every kind of item, and ContextMenuSubTrigger. |
| `.nuv-context-menu__item--danger` | An item with intent="danger". |
| `.nuv-context-menu__label` | ContextMenuLabel. |
| `.nuv-context-menu__separator` | ContextMenuSeparator. |
| `.nuv-context-menu__shortcut` | ContextMenuShortcut. |

`ContextMenuTrigger` has no class. It's your area, and it looks however you make it look. Radix sets `data-state="open"` on it while its menu is open, which you can style.

Radix sets `data-highlighted` on the row that has focus, `data-disabled` on a disabled one, and `data-state` on the panels, the submenu triggers and the checkable items. The fill and the animation hang off those.

## Server components

The menu parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a menu together inside a server component, as the first example on this page does. An `onSelect` handler is the usual reason to need a client component of your own.

## Themed sections

A menu opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` to `ContextMenuContent`, and to `ContextMenuSubContent` if there is one.

## Do and don't

**Do**

- Offer the same actions somewhere that can be seen.
- Keep the menu about the thing that was clicked, not about the page.
- Put the destructive item last, after a separator, with `intent="danger"`.

**Don't**

- Don't take over the right click on a whole page. People use the browser's own menu to copy, inspect and open links.
- Don't put a context menu on text people may want to select or copy.
- Don't go more than one submenu deep.
