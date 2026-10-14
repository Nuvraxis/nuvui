<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/command.mdx. Don't edit it here: run `pnpm skill`. -->

# Command

A search field over a list of commands that filters as you type, in the page or in a dialog opened with a shortcut.

Use a command list to let people find something by typing a few letters of its name: a page to go to, an action to run, a record to open. In a dialog that opens with a shortcut it's what's often called a command palette.

To pick a value for a form, use a [combobox](combobox.md). It's the same list behind a button, with a value it remembers.

```tsx
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@nuvui/react";

export default function Example() {
  return (
    <Command
      label="Commands"
      style={{
        inlineSize: "100%",
        maxInlineSize: 420,
        border: "1px solid var(--color-border)",
      }}
    >
      <CommandInput placeholder="Type a command or search" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Files">
          <CommandItem aria-keyshortcuts="Control+N">
            New file
            <CommandShortcut>Ctrl+N</CommandShortcut>
          </CommandItem>
          <CommandItem aria-keyshortcuts="Control+O">
            Open file
            <CommandShortcut>Ctrl+O</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>Save a copy</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="View">
          <CommandItem keywords={["dark", "light", "appearance"]}>
            Toggle theme
          </CommandItem>
          <CommandItem>Zoom in</CommandItem>
          <CommandItem>Zoom out</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
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
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Command` | The box around the field and the list. It does the filtering and holds which item is active. |
| `CommandDialog` | A `Command` in a dialog, with an optional shortcut that opens it. |
| `CommandInput` | The search field. |
| `CommandList` | The part that scrolls, with the items in it. |
| `CommandItem` | One command. |
| `CommandGroup` | Items that belong together, under a heading. |
| `CommandSeparator` | A line between groups. |
| `CommandShortcut` | The keys that do the same thing, shown at the end of an item's row. |
| `CommandEmpty` | What's shown while nothing matches. |
| `CommandLoading` | What's shown while the items are being fetched. |

These are separate exports, not properties of `Command`. `Command.Item` isn't available, because property access on a client component doesn't work from a server component.

## Props

### Command

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Search"` | The search field's name, for screen readers. Translate it with the rest of your interface. |
| `shouldFilter` | `boolean` |  | Whether the list is filtered as you type. Turn it off when the items are fetched for each search, and already are the matches. |
| `filter` | `CommandFilter` |  | Scores an item against the search. It's called with the item's value, the search and the item's keywords. Zero hides the item, and items with a higher score come first. |
| `loop` | `boolean` |  | Whether the arrow keys go round from the last item to the first. |
| `vimBindings` | `boolean` | `false` | Whether Ctrl+N, Ctrl+J, Ctrl+P and Ctrl+K move through the list as the arrow keys do. Off by default, because in a text field on a Mac some of those keys already do something else. |
| `value` | `string` |  | The value of the active item, when you control it yourself. Use it with `onValueChange`. |
| `onValueChange` | `((value: string) => void)` |  | Called with an item's value when it becomes the active one. |

### CommandDialog

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Whether the dialog is open, when you control it. |
| `defaultOpen` | `boolean` | `false` | Whether the dialog starts open, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the dialog opens or closes. |
| `shortcut` | `string \| null` |  | A key that opens and closes the dialog when pressed with Ctrl, or with Command on a Mac. `"k"` is the usual one. Left out, there's no shortcut. |
| `title` | `string` | `"Command palette"` | The dialog's name, for screen readers. It isn't drawn. Translate it with the rest of your interface. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the dialog is rendered into. Set this when the dialog should pick up a `data-theme` from a section of the page. |

It takes everything `Command` does as well, and passes it on.

### CommandInput

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `placeholder` | `string` |  | What the field shows while it's empty. |
| `value` | `string` |  | The search text, when you control it yourself. Use it with `onValueChange`. |
| `onValueChange` | `((search: string) => void)` |  | Called with the text when it changes. |

### CommandItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onSelect` | `((value: string) => void)` |  | Called with the item's value when it's run, by a click or by Enter. |
| `value` | `string` |  | What the search matches against, and what `onSelect` is called with. Left out, it's the item's text. It has to differ from every other item's. |
| `keywords` | `string[]` |  | Other words that should find this item. |
| `disabled` | `boolean` |  | Stops the item from being run. The arrow keys skip it. |

### CommandList

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Suggestions"` | The list's name, for screen readers. Translate it with the rest of your interface. |

### CommandGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `heading` | `ReactNode` |  | The text over the group's items. It also names the group. |

### CommandSeparator

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `alwaysRender` | `boolean` | `false` | Whether the line stays while something is typed in the search field. Left off, it goes, because the groups it was between may have gone. |

### CommandLoading

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Loading"` | What a screen reader is told while this is shown, and what's drawn if there are no children. Translate it with the rest of your interface. |

`CommandEmpty` is a `div` and `CommandShortcut` is a `span`. They take what those elements take.

## In a dialog

`CommandDialog` has no trigger part. It opens with its `shortcut`, or from anything that sets `open`.

```tsx
"use client";

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from "@nuvui/react";
import { useState } from "react";

const pages = ["Dashboard", "Orders", "Customers", "Invoices", "Settings"];
const actions = ["Create an order", "Invite a teammate", "Export as CSV"];

export default function Example() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("");

  // Running a command closes the palette. That's yours to do.
  const run = (command: string) => {
    setLast(command);
    setOpen(false);
  };

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      <p style={{ margin: 0, fontSize: 14 }}>
        Or press <Kbd>Ctrl</Kbd> <Kbd>J</Kbd>
      </p>
      <output style={{ fontSize: 14 }}>{last ? `Ran: ${last}` : null}</output>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        // This site's own search has Ctrl+K.
        shortcut="j"
        label="Search commands"
      >
        <CommandInput placeholder="Where to, or what to do" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {pages.map((page) => (
              <CommandItem key={page} onSelect={run}>
                {page}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            {actions.map((action) => (
              <CommandItem key={action} onSelect={run}>
                {action}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
```

`shortcut` takes a letter, and listens for it with <kbd>Ctrl</kbd>, or with <kbd>⌘</kbd> on a Mac. The same keys close the dialog again. Left out, there's no shortcut.

- Something that already uses the keys keeps them. An editor that handles <kbd>Ctrl</kbd> + <kbd>K</kbd> itself, and calls `preventDefault`, isn't interrupted.
- Text that's edited in place, in an element with `contenteditable`, keeps them too. The browser has uses of its own for some of them there.
- Otherwise the browser is stopped from acting on the keys. Firefox would move focus to its search bar on <kbd>Ctrl</kbd> + <kbd>K</kbd>.

Running a command doesn't close the dialog by itself. Some commands should leave it open, to pick a second thing say. Close it in `onSelect` when that's what you want, as the example does.

The search starts empty each time the dialog opens.

## Shortcuts next to items

`CommandShortcut` shows the keys at the end of a row. It only shows them. Listening for the keys is up to you.

It's hidden from screen readers, so that "New file" isn't read as "New file Ctrl+N" with no pause. Put the same keys in `aria-keyshortcuts` on the item, and they're announced as a shortcut.

## How the search matches

The match is loose: the letters you type have to appear in the item in that order, and don't have to be next to each other. `stg` finds Settings. Items that match better come first, so the order of the list changes as you type.

That suits a list of commands, where people type as little as they can. It's the opposite choice from [Combobox](combobox.md#how-the-search-matches), which keeps its options in order and only matches letters in a row.

`keywords` adds other words that should find an item. The first example finds "Toggle theme" when you type `dark`.

## Items from a server

Control the search text on `CommandInput`, fetch for it, and turn `shouldFilter` off on `Command`, because what comes back is already the matches.

```tsx
"use client";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@nuvui/react";
import { useEffect, useState } from "react";

const orders = [
  "10248 · Acme Corporation",
  "10249 · Blue Harbor Logistics",
  "10250 · Cedar & Stone",
  "10251 · Delta Freight",
  "10252 · Evergreen Health",
];

// Stands in for a request to your server.
function searchOrders(text: string): Promise<string[]> {
  const matches = orders.filter((order) =>
    order.toLowerCase().includes(text.toLowerCase()),
  );
  return new Promise((resolve) => setTimeout(() => resolve(matches), 600));
}

export default function Example() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    searchOrders(search).then((matches) => {
      // An answer to an older search can arrive after a newer one.
      if (!current) return;
      setResults(matches);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [search]);

  return (
    <Command
      label="Search orders"
      // The server has already done the filtering.
      shouldFilter={false}
      style={{
        inlineSize: "100%",
        maxInlineSize: 420,
        border: "1px solid var(--color-border)",
      }}
    >
      <CommandInput
        placeholder="Order number or customer"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading ? <CommandLoading label="Loading orders" /> : null}
        <CommandEmpty>No order found.</CommandEmpty>
        {loading
          ? null
          : results.map((order) => (
              <CommandItem key={order}>{order}</CommandItem>
            ))}
      </CommandList>
    </Command>
  );
}
```

Render `CommandLoading` while a request is out. `CommandEmpty` waits while it's there: nothing has been found yet, which isn't the same as nothing matching.

## On small screens

Items are 44 pixels tall on a touch screen and 32 with a mouse. The search field is 44 and 40, and its text is 16 pixels on a touch screen, because iOS zooms the page in when a field with smaller text takes focus.

On a phone the dialog sits at the top of the screen, 16 pixels in from each edge, and not at the bottom the way a [dialog](dialog.md) does. The field is the first thing in it, and the keyboard comes up from the bottom. From the `sm` breakpoint it's 36rem wide and sits towards the top, so the list can grow and shrink under the field without the field moving.

The list is at most 20rem tall and scrolls inside itself.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| Typing | Filters the list. The best match becomes the active item. |
| <kbd>↓</kbd> and <kbd>↑</kbd> | Move to the next or previous item. Disabled items are skipped. |
| <kbd>Alt</kbd> + <kbd>↓</kbd> and <kbd>Alt</kbd> + <kbd>↑</kbd> | Move to the first item of the next or previous group. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last item. They don't move the caret in the search field. |
| <kbd>Enter</kbd> | Runs the active item. |
| <kbd>Esc</kbd> | In a dialog, closes it. |
| The `shortcut` | Opens and closes a `CommandDialog`. |

### What the component handles

- The search field has `role="combobox"` and controls the list, which has `role="listbox"`. Items have `role="option"`, and each group is named by its heading.
- Focus stays in the field. Its `aria-activedescendant` says which item the arrow keys are on, and that item has `aria-selected`.
- cmdk, the library underneath, works that attribute out a moment too early. On its own it leaves the attribute empty when the list first shows and after each letter typed, and after a letter is erased it names an item that's no longer the active one. A screen reader would then say nothing, or the wrong thing, about what <kbd>Enter</kbd> is about to run. This component watches which item is marked active and keeps the attribute pointing at it. A test goes through each of those steps.
- When nothing matches, the text of `CommandEmpty` is put in a status region next to the list, so a screen reader says it. The copy that's drawn inside the list is hidden from screen readers, because a list of options may only hold options. `CommandLoading` works the same way.
- cmdk's separator has `role="separator"`, which a list of options isn't allowed to hold. This component's separator is decoration and hidden from screen readers. Groups are told apart by their headings.
- The active item is filled with the primary color. That fill has at least 3:1 contrast with the panel, and the text on it keeps 4.5:1. Where the browser forces its own colors, as Windows high contrast does, the item has an outline instead.
- The search field shows that it has focus with a line in the ring color along the bottom of its row.
- The dialog has a name that isn't drawn, set with `title`. Opening it moves focus to the field. Closing it gives focus back to whatever had it before.
- The dialog only animates when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give people another way in. A shortcut nobody has been told about isn't found, and a phone has no <kbd>Ctrl</kbd> key. A button that opens the palette covers both.
- Don't make the palette the only way to reach something. It's a quicker route to what's also in the menus.
- Translate `label`, `title`, the list's `label` and the text of `CommandEmpty` and `CommandLoading` with the rest of your interface.
- Safari doesn't give a button focus when it's clicked. So after a palette that was opened by a click there closes, focus isn't on the button. Opened from the keyboard, focus goes back where it was.

### What hasn't been checked

The tests check the roles, names and states that a browser passes on to a screen reader. What each screen reader then says hasn't been checked by a person.

## CSS variables

A `Command` in the page takes its variables from itself or anything around it. One in a `CommandDialog` renders at the end of `<body>`, so set them on `:root` or `body`.

```css
:root {
  --nuv-command-width: 40rem;
  --nuv-command-list-height: 24rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-command-radius` | `var(--radius-lg)` | Corner radius of the panel, and of the dialog. |
| `--nuv-command-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-command-fg` | `var(--color-surface-foreground)` | Text color of the panel. |
| `--nuv-command-border` | `var(--color-border)` | Color of the dialog's edge, and of the lines inside the panel. |
| `--nuv-command-input-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of the search field. The default differs between touch screens and a mouse. |
| `--nuv-command-input-font-size` | `var(--text-base)`, `var(--text-sm)` | Size of the search field's text. Keep it at 16 pixels or more on touch screens. |
| `--nuv-command-input-placeholder` | `var(--color-muted-foreground)` | Color of the search field's placeholder. |
| `--nuv-command-list-height` | `20rem` | The tallest the list gets before it scrolls. |
| `--nuv-command-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Minimum height of an item. The default differs between touch screens and a mouse. |
| `--nuv-command-highlight-bg` | `var(--color-primary)` | Background of the active item, from the pointer or the arrow keys. Keep it at 3:1 against the panel. |
| `--nuv-command-highlight-fg` | `var(--color-primary-foreground)` | Text color of that item. |
| `--nuv-command-overlay-bg` | `var(--color-overlay)` | Color of the layer that dims the page. |
| `--nuv-command-shadow` | `var(--shadow-xl)` | Shadow under the dialog. |
| `--nuv-command-width` | `36rem` | The widest the dialog gets, from the sm breakpoint up. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-command` | Command. |
| `.nuv-command__dialog` | The dialog around the Command. |
| `.nuv-command__empty` | CommandEmpty. |
| `.nuv-command__input` | CommandInput. |
| `.nuv-command__item` | CommandItem. |
| `.nuv-command__label` | A group's heading. |
| `.nuv-command__list` | CommandList. |
| `.nuv-command__loading` | CommandLoading. |
| `.nuv-command__overlay` | The layer that dims the page behind a CommandDialog. |
| `.nuv-command__search` | The row the search field is in. |
| `.nuv-command__search-icon` | The magnifying glass in that row. |
| `.nuv-command__separator` | CommandSeparator. |
| `.nuv-command__shortcut` | CommandShortcut. |
| `.nuv-command__status` | The region a screen reader hears "no results" and "loading" from. It isn't drawn. |
| `.nuv-command__title` | The dialog's name. It isn't drawn. |

An item has `data-selected="true"` while it's the active one, and `data-disabled="true"` when it can't be run. The dialog and its overlay have `data-state`, which is `open` or `closed`.

The panel has no edge of its own, so that it can sit inside a card or a popover without doubling one. The examples on this page that show it in the page give it a border.

## Server components

The command parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

The parts can be put together inside a server component, as the first example is. An `onSelect` is a function, so a list that runs things needs a client component of your own.

## Themed sections

A `CommandDialog` opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` and it will be.

## What it's built on

The filtering and the keyboard handling are [cmdk](https://github.com/pacocoursey/cmdk), and the dialog is Radix's. Both are installed with the library.

## Do and don't

**Do**

- Name commands by what they do, starting with a verb: "Create an order", not "Orders".
- Group them, and put what people reach for most at the top.
- Show the shortcut that opens the palette somewhere people will see it.

**Don't**

- Don't put a form's fields in one. Use a [combobox](combobox.md) for a value.
- Don't keep the palette open after a command that changes the page. People lose track of what happened behind it.
- Don't put thousands of items in it. Fetch the matches as the person types.
