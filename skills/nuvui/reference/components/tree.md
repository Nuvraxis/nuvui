<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/tree.mdx. Don't edit it here: run `pnpm skill`. -->

# Tree

Rows that open to show more rows, moved through with the arrow keys, with one or many of them selected.

Use a tree for things that are inside other things: files in folders, the teams of a company, the sections of a document. For a flat list of pages, use a [sidebar](sidebar.md). For one level that opens, an [accordion](accordion.md) is simpler.

```tsx
import { Tree, TreeItem } from "@nuvui/react";

export default function Example() {
  return (
    <Tree
      aria-label="Project files"
      defaultExpanded={["src", "src/components"]}
      style={{ inlineSize: "100%", maxInlineSize: 320 }}
    >
      <TreeItem value="src" label="src">
        <TreeItem value="src/components" label="components">
          <TreeItem value="src/components/button.tsx" label="button.tsx" />
          <TreeItem value="src/components/dialog.tsx" label="dialog.tsx" />
          <TreeItem value="src/components/tree.tsx" label="tree.tsx" />
        </TreeItem>
        <TreeItem value="src/styles" label="styles">
          <TreeItem value="src/styles/tokens.scss" label="tokens.scss" />
          <TreeItem value="src/styles/index.scss" label="index.scss" />
        </TreeItem>
        <TreeItem value="src/index.ts" label="index.ts" />
      </TreeItem>
      <TreeItem value="test" label="test">
        <TreeItem value="test/setup.ts" label="setup.ts" />
      </TreeItem>
      <TreeItem value="package.json" label="package.json" />
      <TreeItem value="README.md" label="README.md" />
    </Tree>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Tree, TreeItem } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Tree` | The tree. It keeps which rows are open and which are selected. |
| `TreeItem` | A row. Put `TreeItem`s inside it for the rows under it. |

A row with rows inside it can be opened. A row without can't, and has no chevron. Nothing else says which is which.

## Selecting one row

`selectionMode="single"` lets one row be selected at a time. `value` is a list in every mode, here with one value in it or none.

```tsx
"use client";

import { Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";

const names: Record<string, string> = {
  company: "Acme",
  engineering: "Engineering",
  platform: "Platform",
  apps: "Apps",
  design: "Design",
  sales: "Sales",
};

export default function Example() {
  const [value, setValue] = useState(["platform"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Tree
        aria-label="Teams"
        selectionMode="single"
        value={value}
        onValueChange={setValue}
        defaultExpanded={["company", "engineering"]}
      >
        <TreeItem value="company" label="Acme">
          <TreeItem value="engineering" label="Engineering">
            <TreeItem value="platform" label="Platform" />
            <TreeItem value="apps" label="Apps" />
          </TreeItem>
          <TreeItem value="design" label="Design" />
          <TreeItem value="sales" label="Sales" />
        </TreeItem>
      </Tree>
      <p style={{ margin: 0, fontSize: 14 }}>
        Showing: {value[0] ? names[value[0]] : "nothing"}
      </p>
    </div>
  );
}
```

## Selecting several

With `selectionMode="multiple"`, a press on a row adds it to the selection, and a press on a selected row takes it out. Nothing has to be held down, so it works the same with a finger. Shift and a press selects every row from the last one pressed to this one.

```tsx
"use client";

import { Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [value, setValue] = useState(["reports/q3.pdf"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Tree
        aria-label="Files to share"
        selectionMode="multiple"
        value={value}
        onValueChange={setValue}
        defaultExpanded={["reports"]}
      >
        <TreeItem value="reports" label="Reports">
          <TreeItem value="reports/q1.pdf" label="q1.pdf" />
          <TreeItem value="reports/q2.pdf" label="q2.pdf" />
          <TreeItem value="reports/q3.pdf" label="q3.pdf" />
          <TreeItem value="reports/q4.pdf" label="q4.pdf" disabled />
        </TreeItem>
        <TreeItem value="invoices" label="Invoices">
          <TreeItem value="invoices/october.pdf" label="october.pdf" />
        </TreeItem>
        <TreeItem value="notes.md" label="notes.md" />
      </Tree>
      <p style={{ margin: 0, fontSize: 14 }}>{value.length} selected</p>
    </div>
  );
}
```

## Opening rows yourself

`expanded` and `onExpandedChange` put the open rows in your hands, for an "Open all" button or to remember them between visits. `defaultExpanded` says which are open at first and leaves the rest to the tree.

```tsx
"use client";

import { Button, Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";

const folders = ["guides", "guides/start", "reference"];

export default function Example() {
  const [expanded, setExpanded] = useState(["guides"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          intent="secondary"
          onClick={() => setExpanded(folders)}
        >
          Open all
        </Button>
        <Button size="sm" intent="secondary" onClick={() => setExpanded([])}>
          Close all
        </Button>
      </div>
      <Tree
        aria-label="Documentation"
        expanded={expanded}
        onExpandedChange={setExpanded}
      >
        <TreeItem value="guides" label="Guides">
          <TreeItem value="guides/start" label="Getting started">
            <TreeItem value="guides/start/install" label="Install" />
            <TreeItem value="guides/start/theme" label="Choose a theme" />
          </TreeItem>
          <TreeItem value="guides/forms" label="Forms" />
        </TreeItem>
        <TreeItem value="reference" label="Reference">
          <TreeItem value="reference/tokens" label="Tokens" />
        </TreeItem>
      </Tree>
    </div>
  );
}
```

The rows inside a closed row aren't in the page. A tree of thousands of rows costs what its open rows cost.

## Moving rows

Give the tree `onMove` and its rows can be moved: dragged with a mouse, picked up with a finger held down for a moment, or walked up and down with Alt and an arrow key. The tree doesn't move anything. It tells you what was moved and where to, and you change your data.

```tsx
"use client";

import { Button, Tree, TreeItem, type TreeMove } from "@nuvui/react";
import { useState } from "react";

// A section has pages, even if none yet. A page has none and can't.
interface Entry {
  id: string;
  name: string;
  pages?: Entry[];
}

const start: Entry[] = [
  {
    id: "guides",
    name: "Guides",
    pages: [
      { id: "install", name: "Install" },
      { id: "theme", name: "Choose a theme" },
      { id: "forms", name: "Forms" },
    ],
  },
  {
    id: "reference",
    name: "Reference",
    pages: [{ id: "tokens", name: "Tokens" }],
  },
  { id: "drafts", name: "Drafts", pages: [] },
  { id: "changelog", name: "Changelog" },
];

const find = (entries: Entry[], id: string): Entry | undefined => {
  for (const entry of entries) {
    if (entry.id === id) return entry;
    const inside = find(entry.pages ?? [], id);
    if (inside) return inside;
  }
};

// The entries with a move made: the moved ones taken out of where they
// were, and put back at the place the move names.
function moved(entries: Entry[], move: TreeMove): Entry[] {
  const taken: Entry[] = [];
  const take = (from: Entry[]): Entry[] =>
    from.flatMap((entry) => {
      if (move.values.includes(entry.id)) {
        taken.push(entry);
        return [];
      }
      return [entry.pages ? { ...entry, pages: take(entry.pages) } : entry];
    });
  const put = (into: Entry[]): Entry[] =>
    into.flatMap((entry) => {
      if (entry.id !== move.target) {
        return [entry.pages ? { ...entry, pages: put(entry.pages) } : entry];
      }
      if (move.position === "before") return [...taken, entry];
      if (move.position === "after") return [entry, ...taken];
      return [{ ...entry, pages: [...(entry.pages ?? []), ...taken] }];
    });
  return put(take(entries));
}

export default function Example() {
  const [entries, setEntries] = useState(start);

  const rows = (list: Entry[]) =>
    list.map((entry) => (
      <TreeItem key={entry.id} value={entry.id} label={entry.name}>
        {entry.pages && entry.pages.length > 0 ? rows(entry.pages) : null}
      </TreeItem>
    ));

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Tree
        aria-label="Pages"
        defaultExpanded={["guides"]}
        onMove={(move) => setEntries((now) => moved(now, move))}
        // Only a section can have pages put inside it.
        canDrop={(move) =>
          move.position !== "inside" ||
          find(entries, move.target)?.pages !== undefined
        }
      >
        {rows(entries)}
      </Tree>
      <div>
        <Button size="sm" intent="secondary" onClick={() => setEntries(start)}>
          Put back
        </Button>
      </div>
    </div>
  );
}
```

A move has three parts.

| Part | What it is |
| --- | --- |
| `values` | The rows that moved, in the order they're shown. |
| `target` | The row they were moved to. |
| `position` | `"before"` that row, `"after"` it, or `"inside"` it, after the rows it already has. |

With `selectionMode="multiple"`, moving a selected row moves every selected row that's shown. A row inside another that's moving isn't in `values`: it goes where that one goes.

`canDrop` is asked about each place before it's offered. Return `false` and a drag shows no mark there, and the keys pass it by. In the example, only a section can have pages put inside it. A row can never go inside itself, or inside a disabled row, and a disabled row can't be moved.

A row dropped inside another opens it. A drag held over a closed row opens it too, and a drag near the top or the bottom of what scrolls the tree scrolls it. Escape puts the rows back.

Under the last row of an open row, a drop could mean inside that row or after it. The line shows which: move the pointer out towards the start of the tree and the line goes out with it.

## A label that isn't plain text

`label` takes anything: an icon and a name, a name and a count. Typing a letter goes to the next row whose label starts with it. When the label's text doesn't start with the row's name, say what the name is with `textValue`.

```tsx
<TreeItem
  value="inbox"
  textValue="Inbox"
  label={
    <>
      <Badge>12</Badge> Inbox
    </>
  }
/>
```

Keep buttons and links out of a label. A row is one thing to press, and a screen reader in a tree reads rows, not what's inside them.

## Tree props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `selectionMode` | `"multiple" \| "none" \| "single"` | `"none"` | Whether rows can be selected, and how many. With `"multiple"`, a press adds a row to the selection or takes it out, and Shift selects a run of them. |
| `value` | `string[]` |  | The selected rows' values, when you control them. |
| `defaultValue` | `string[]` |  | The rows selected at first, when you don't. |
| `onValueChange` | `((value: string[]) => void)` |  | Called with every selected row's value when the selection changes. |
| `expanded` | `string[]` |  | The open rows' values, when you control them. |
| `defaultExpanded` | `string[]` |  | The rows open at first, when you don't. |
| `onExpandedChange` | `((expanded: string[]) => void)` |  | Called with every open row's value when a row opens or closes. |
| `onMove` | `((move: TreeMove) => void)` |  | Called when rows are moved, by dragging them or with Alt and an arrow key. Giving it is what lets rows be moved. The tree doesn't move them: change your data to match, and draw the rows again. |
| `canDrop` | `((move: TreeMove) => boolean)` |  | Whether rows can go to a place. Return `false` and it isn't offered: a drag shows no mark there, and the keys pass it by. A row can never go inside itself or inside a disabled row. |
| `getMoveText` | `((move: TreeMove) => string)` | `"Moved Budget into Reports", and the like` | What a screen reader is told when rows have moved. |

It also takes what a `ul` takes, including `ref` and `className`. `TreeMove`, the type of a move, is exported too.

## TreeItem props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the row is known by in `value` and `expanded`. No two the same. |
| `label` (required) | `ReactNode` |  | What the row shows: its name, and an icon if you like. |
| `textValue` | `string` |  | The row's name as plain text, which typing a letter looks for. Needed when the label doesn't start with it, as when it starts with a count. |
| `disabled` | `boolean` | `false` | A row that can't be selected, opened or closed. The arrow keys still stop at it, so a screen reader can read it. |
| `children` | `ReactNode` |  | The rows inside this one: more `TreeItem`s. With any, the row opens. |

It also takes what an `li` takes, including `ref` and `className`.

## Accessibility

It follows the [tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) of the ARIA Authoring Practices.

### Keyboard

The tree is one stop for Tab. Inside it:

| Key | What it does |
| --- | --- |
| Down, Up | Moves to the next or the previous row that's shown. |
| Right | Opens a closed row. On an open one, moves to its first row. |
| Left | Closes an open row. On a closed one or one that doesn't open, moves to the row it's inside. |
| Home, End | Moves to the first or the last row that's shown. |
| Enter | Opens or closes the row, and selects it when rows can be selected. |
| Space | Selects the row, or with several, adds it or takes it out. With no selection, opens or closes it. |
| A letter | Moves to the next row that starts with it. Letters typed quickly make a word. |
| `*` | Opens every row beside this one. |
| Shift and Down or Up | With several: moves, and selects the row it arrives at. |
| Ctrl or Command and A | With several: selects every row that's shown. |
| Alt and Down or Up | With `onMove`: moves the row to the next place it can go, down or up. Every place is on the way: into an open row, out of its end, and inside a row that's closed or has nothing in it. |

In a right-to-left page Right and Left change places, as the tree does.

### What the component handles

- The roles: `tree`, `treeitem`, and `group` for the rows inside a row. A screen reader says how deep a row is and how many are beside it from where it is in the lists.
- `aria-expanded` on a row that opens, and `aria-selected` on every row when rows can be selected.
- A row's name is its own label, not that and every row inside it.
- Tab stops at the row focus was last on. If that row goes, because its parent was closed or the data changed, Tab stops at the first row.
- A selected row differs by more than its background: a bar at its start and heavier text. The bar is a border, which is still drawn where the browser forces its own colors.
- A disabled row can still be reached with the arrow keys, so a screen reader can read it. It can't be selected, opened, closed or moved.
- A row that can be moved says so with `aria-keyshortcuts`. After a move, focus stays on the row, and a screen reader is told where it went: "Moved Forms into Reference". The words are in a `status` beside the tree, which is there only with `onMove`.
- Where a drag would put the rows is a line or a ring, not a change of color alone, and both are still drawn where the browser forces its own colors.

### What you need to handle

- Name the tree with `aria-label` or `aria-labelledby`.
- Give every row a `value` no other row has.
- Selecting a row does nothing by itself. Show the file, or the team, from `onValueChange`.
- Offer a way to move a row with a press and no drag, such as a "Move to" menu beside the tree. Someone who uses a pointer and can't drag has neither the drag nor the keys, and WCAG's 2.5.7 asks for it.
- In another language, give the words said after a move with `getMoveText`.
- Say somewhere near the tree that rows can be moved. Nothing about a row shows it.

## On small screens

A row is 44 pixels tall with a finger and 32 with a mouse. With `onMove`, a finger held on a row for a moment picks it up. A finger that moves first scrolls, as it does anywhere. A long label is cut short, so the tree is as wide as you make it. A deep tree in a narrow space runs out of room for its labels: put it in a [scroll area](scroll-area.md), or make `--nuv-tree-indent` smaller.

## CSS variables

Set any of these on the `Tree`, or on anything around it.

```css
.files {
  --nuv-tree-indent: 1.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-tree-gap` | `1px` | Space between rows. |
| `--nuv-tree-fg` | `var(--color-foreground)` | Color of the labels. |
| `--nuv-tree-row-height` | `var(--nuv-touch-size)`, `calc(var(--spacing) * 8)` | Least height of a row. Taller by default with a finger than with a mouse. |
| `--nuv-tree-radius` | `var(--radius-md)` | Corner radius of a row. |
| `--nuv-tree-hover-bg` | `var(--color-muted)` | Background of the row under the pointer. |
| `--nuv-tree-selected-bg` | `var(--color-muted)` | Background of a selected row. |
| `--nuv-tree-selected-line-width` | `2px` | Thickness of the bar at the start of a selected row. |
| `--nuv-tree-selected-line` | `var(--color-primary)` | Color of that bar. Keep it at 3:1 against the row. |
| `--nuv-tree-dragging-opacity` | `var(--nuv-disabled-opacity)` | How faded a row is while it's being dragged. |
| `--nuv-tree-drop-line-width` | `2px` | Thickness of that line. |
| `--nuv-tree-drop-line` | `var(--color-primary)` | Color of the line, or the ring, where dragged rows would go. Keep it at 3:1 against the page. |
| `--nuv-tree-chevron` | `var(--color-muted-foreground)` | Color of the chevron. |
| `--nuv-tree-indent` | `calc(var(--spacing) * 4)` | How far in the rows inside a row are set. |
| `--nuv-tree-line` | `var(--color-border)` | Color of the line down the side of the rows inside a row. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-tree` | Tree |
| `.nuv-tree__chevron` | The chevron, or its empty place in a row that doesn't open. |
| `.nuv-tree__group` | The list of rows inside a row. |
| `.nuv-tree__item` | TreeItem: the row and the rows inside it. |
| `.nuv-tree__label` | The label. |
| `.nuv-tree__row` | The row itself, which is what's pressed. |
| `.nuv-tree__status` | What a screen reader is told after a move. Beside the tree, and drawn for nobody. |

An open row has `aria-expanded="true"`, a selected one `aria-selected="true"` and a disabled one `aria-disabled="true"`. During a drag the tree and each row being dragged have `data-dragging`, and the row they'd go to has `data-drop`, which is `before`, `after` or `inside`.

## Server components

Tree starts with `"use client"`: it keeps which rows are open. You can render it from a server component with rows written there, as long as you leave `onValueChange`, `onExpandedChange` and `onMove` out, since a function can't be passed from the server.

## Do and don't

**Do**

- Open the rows the reader most likely wants, with `defaultExpanded`.
- Keep labels short. A path is already said by where the row is.

**Don't**

- Don't use a tree for a list with one level. That's a list.
- Don't put buttons inside a row. Put what can be done to the selection beside the tree, or in an [action bar](action-bar.md).
- Don't nest deeper than people can follow. Past four or five levels, think about a search.
