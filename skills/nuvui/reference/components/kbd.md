<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/kbd.mdx. Don't edit it here: run `pnpm skill`. -->

# Kbd

A key on the keyboard, drawn as a key cap, for writing out shortcuts.

Use `Kbd` wherever text names a key: in help text, in a tooltip, in a table of shortcuts. It renders the HTML `<kbd>` element, which is the element for something the reader types.

```tsx
import { Kbd } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0 }}>
      Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to search, and <Kbd>Esc</Kbd> to
      close.
    </p>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Kbd } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

`Kbd` adds no props of its own. It takes what a `<kbd>` takes, including `ref` and `className`.

## It follows the text around it

A key is sized in `em`, so it's as big as the text it sits in. It never makes its line taller: the cap is taller than its letters, and that extra height sits in the space between lines. With a line height under about 1.3, the caps on two lines one above the other can touch.

```tsx
import { Kbd } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12 }}>
        Small text: <Kbd>Tab</Kbd>
      </p>
      <p style={{ margin: 0, fontSize: 16 }}>
        Body text: <Kbd>Tab</Kbd>
      </p>
      <p style={{ margin: 0, fontSize: 24 }}>
        Large text: <Kbd>Tab</Kbd>
      </p>
    </div>
  );
}
```

## Combinations

Write each key as its own `Kbd` and put the plus sign between them as plain text. A screen reader then reads the keys in the order they're written, plus sign included, and each key is one key.

Keys differ between systems. Where a shortcut uses <kbd>Ctrl</kbd> on Windows and Linux and Command on a Mac, say both, or show the one for the system the visitor is on. A symbol such as the Command sign is read differently by different screen readers, so wrap it in an `<abbr>` with the key's name as its `title`.

```tsx
import { Kbd } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0 }}>
      Save with{" "}
      <Kbd>
        <abbr title="Command" style={{ textDecoration: "none" }}>
          ⌘
        </abbr>
      </Kbd>{" "}
      + <Kbd>S</Kbd> on a Mac, and <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> elsewhere.
    </p>
  );
}
```

## In a menu

A menu item's shortcut has its own part: `DropdownMenuShortcut`, `ContextMenuShortcut` and `MenubarShortcut`. Those are laid out at the end of the row and hidden from screen readers, with the keys given in `aria-keyshortcuts`. Use them there, and `Kbd` in running text.

## Accessibility

A key has no keyboard behavior. It's text.

### What the component handles

- It's a `<kbd>` element. Browsers and screen readers treat it as text, and tools that list a page's shortcuts can find it.
- Its edge has at least 3:1 against the page in every theme, and its text at least 4.5:1 against its fill.
- The edge is a border, so the key keeps its shape where the browser forces its own colors.

### What you need to handle

- Write the key's name, not only its symbol: "Shift", "Enter", "Esc".
- A page that shows a shortcut has to make the shortcut work. `Kbd` only draws it.
- Don't build a shortcut on a single letter without a way to turn it off. Speech input users trigger those by talking. [WCAG 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts) has the details.

## CSS variables

Set any of these on the key, or on anything around it.

```css
.shortcut-table {
  --nuv-kbd-font: var(--font-mono);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-kbd-size` | `1.6em` | Smallest width and height, in em of the key's own font size. A key with one letter is a square of this size. |
| `--nuv-kbd-padding-inline` | `0.4em` | Padding left and right. |
| `--nuv-kbd-border` | `var(--color-border-strong)` | Border color. |
| `--nuv-kbd-radius` | `var(--radius-sm)` | Corner radius. |
| `--nuv-kbd-bg` | `var(--color-muted)` | Background color. |
| `--nuv-kbd-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-kbd-font` | `var(--font-sans)` | Font family. The interface's font by default, not the browser's monospace font for kbd. |
| `--nuv-kbd-font-size` | `0.8em` | Font size. A little under the text around it by default. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-kbd` | Every key. |

## Server components

Kbd has no `"use client"` directive and uses no state, so it renders in a server component as it is.

## Do and don't

**Do**

- Use the names printed on the keys.
- Keep the same order everywhere: modifiers first, then the key.

**Don't**

- Don't use it for text people type in, such as a command. That's `<code>`.
- Don't put a whole combination in one `Kbd`.
