<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/list-view.mdx. Don't edit it here: run `pnpm skill`. -->

# ListView

A list whose rows can be selected and can each hold buttons, moved through with the arrow keys.

Use a list view for rows that are things to work on: people with a button each, requests to approve, files to open. The arrow keys move between rows and Tab goes into the row it's at, so a list of a hundred rows with three buttons each is one stop for Tab and not three hundred. For rows that only show something, use an [item](item.md). For rows with columns to sort and filter, use a [data table](../table/index.md).

```tsx
"use client";

import { Badge, Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const people = [
  { id: "ada", name: "Ada Lovelace", role: "Owner" },
  { id: "bo", name: "Bo Jensen", role: "Admin" },
  { id: "cleo", name: "Cleo Park", role: "Member" },
  { id: "dan", name: "Dan Abbott", role: "Member" },
];

export default function Example() {
  const [said, setSaid] = useState("");

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <ListView aria-label="People">
        {people.map((person) => (
          <ListViewItem key={person.id} value={person.id}>
            <span style={{ flex: 1, minInlineSize: 0 }}>{person.name}</span>
            <Badge variant="outline">{person.role}</Badge>
            <Button
              size="sm"
              intent="secondary"
              aria-label={`Message ${person.name}`}
              onClick={() => setSaid(`Message to ${person.name} started.`)}
            >
              Message
            </Button>
          </ListViewItem>
        ))}
      </ListView>
      <p role="status" style={{ margin: 0, minBlockSize: 20, fontSize: 14 }}>
        {said}
      </p>
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
import { ListView, ListViewItem } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `ListView` | The list. It keeps which rows are selected. |
| `ListViewItem` | A row. Put text in it, and any buttons or links. |

What you put in a row is laid side by side and centered. Give the part that should take the room `flex: 1`.

## Selecting one row

`selectionMode="single"` lets one row be selected at a time. `value` is a list in every mode, here with one value in it or none.

```tsx
"use client";

import { ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const plans = [
  { id: "starter", name: "Starter", price: "Free" },
  { id: "team", name: "Team", price: "$12 a seat" },
  { id: "business", name: "Business", price: "$24 a seat" },
];

export default function Example() {
  const [value, setValue] = useState(["team"]);
  const plan = plans.find((other) => other.id === value[0]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <ListView
        aria-label="Plans"
        selectionMode="single"
        value={value}
        onValueChange={setValue}
      >
        {plans.map((item) => (
          <ListViewItem key={item.id} value={item.id}>
            <span style={{ flex: 1 }}>{item.name}</span>
            <span>{item.price}</span>
          </ListViewItem>
        ))}
      </ListView>
      <p style={{ margin: 0, fontSize: 14 }}>
        Showing: {plan ? plan.name : "nothing"}
      </p>
    </div>
  );
}
```

## Selecting several

With `selectionMode="multiple"`, a press on a row adds it to the selection, and a press on a selected row takes it out. Nothing has to be held down, so it works the same with a finger. Shift and a press selects every row from the last one pressed to this one.

```tsx
"use client";

import { Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const invoices = [
  { id: "INV-2041", to: "Northwind", locked: false },
  { id: "INV-2042", to: "Contoso", locked: false },
  { id: "INV-2043", to: "Fabrikam", locked: true },
  { id: "INV-2044", to: "Adatum", locked: false },
];

export default function Example() {
  const [value, setValue] = useState(["INV-2041"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <ListView
        aria-label="Invoices"
        selectionMode="multiple"
        value={value}
        onValueChange={setValue}
      >
        {invoices.map((invoice) => (
          <ListViewItem
            key={invoice.id}
            value={invoice.id}
            disabled={invoice.locked}
          >
            <span style={{ flex: 1 }}>
              {invoice.id}, {invoice.to}
              {invoice.locked ? " (already sent)" : ""}
            </span>
          </ListViewItem>
        ))}
      </ListView>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 14 }}>{value.length} selected</p>
        <Button size="sm" intent="ghost" onClick={() => setValue([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
```

## Doing something with a row

`onAction` is called with a row's value when Enter is pressed on it. Where rows can't be selected, a press on the row calls it too. A press on a button inside the row is the button's alone: it doesn't select the row or call `onAction`.

```tsx
"use client";

import { Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const reports = [
  { id: "q3", name: "Q3 revenue" },
  { id: "churn", name: "Churn by plan" },
  { id: "seats", name: "Seats in use" },
];

export default function Example() {
  const [said, setSaid] = useState("Nothing opened yet.");
  const name = (id: string) =>
    reports.find((report) => report.id === id)?.name ?? id;

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <ListView
        aria-label="Reports"
        onAction={(id) => setSaid(`Opened ${name(id)}.`)}
      >
        {reports.map((report) => (
          <ListViewItem key={report.id} value={report.id}>
            <span style={{ flex: 1 }}>{report.name}</span>
            <Button
              size="sm"
              intent="ghost"
              aria-label={`Export ${report.name}`}
              onClick={() => setSaid(`Exported ${report.name}.`)}
            >
              Export
            </Button>
          </ListViewItem>
        ))}
      </ListView>
      <p role="status" style={{ margin: 0, fontSize: 14 }}>
        {said}
      </p>
    </div>
  );
}
```

Where rows can be selected, a press selects, so give the row a button or a link for a mouse to open it with. Enter still calls `onAction`.

## A row that doesn't start with its name

Typing a letter goes to the next row whose text starts with it. When a row starts with something else, a date or a count, say what its name is with `textValue`.

```tsx
<ListViewItem value="inv-2041" textValue="Northwind">
  <time dateTime="2026-10-09">9 October</time>
  Northwind
</ListViewItem>
```

## ListView props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `selectionMode` | `"multiple" \| "none" \| "single"` | `"none"` | Whether rows can be selected, and how many. With `"multiple"`, a press adds a row to the selection or takes it out, and Shift selects a run of them. |
| `value` | `string[]` |  | The selected rows' values, when you control them. |
| `defaultValue` | `string[]` |  | The rows selected at first, when you don't. |
| `onValueChange` | `((value: string[]) => void)` |  | Called with every selected row's value when the selection changes. |
| `onAction` | `((value: string) => void)` |  | Called with a row's value when Enter is pressed on it. Where rows can't be selected, a press on the row calls it too. |

It also takes what a `div` takes, including `ref` and `className`.

## ListViewItem props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the row is known by in `value`. No two the same. |
| `textValue` | `string` |  | The row's name as plain text, which typing a letter looks for. Needed when the row's text doesn't start with it. |
| `disabled` | `boolean` | `false` | A row that can't be selected or acted on. The arrow keys still stop at it, so a screen reader can read it. Disable the buttons inside it yourself. |
| `children` | `ReactNode` |  | What the row shows: text, and any buttons or links. |

It also takes what a `div` takes, including `ref` and `className`.

## Accessibility

It follows the [grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) of the ARIA Authoring Practices, as a grid one column wide. That's the pattern for a list whose rows hold controls: a `listbox` can't have buttons inside its options.

### Keyboard

The list is one stop for Tab. With focus on a row:

| Key | What it does |
| --- | --- |
| Down, Up | Moves to the next or the previous row. |
| Home, End | Moves to the first or the last row. |
| Tab | Moves to the first button in the row, then the next. After the last, it leaves the list. |
| Shift and Tab | From a button, moves back through the row's buttons to the row. From the row, it leaves the list. |
| Enter | Calls `onAction`. With no `onAction`, selects the row. |
| Space | Selects the row, or with several, adds it or takes it out. With no selection, calls `onAction`. |
| A letter | Moves to the next row that starts with it. Letters typed quickly make a word. |
| Shift and Down or Up | With several: moves, and selects the row it arrives at. |
| Ctrl or Command and A | With several: selects every row. |

With focus on a button or in a field inside a row, every key is that control's. The arrow keys work again once focus is back on the row.

### What the component handles

- The roles: `grid`, `row` and `gridcell`. A screen reader says which row of how many it's on.
- `aria-selected` on every row when rows can be selected, and `aria-multiselectable` on the list when several can.
- Only the buttons of the row Tab is at are in the Tab order. The list takes the others out by setting their `tabindex` to `-1`, and gives each back what it had when its row is the one. A press on a button in any row still works, and makes that the row.
- Tab stops at the row focus was last in. If that row goes, because the data changed, Tab stops at the first row.
- A selected row differs by more than its background: a bar at its start, drawn as a border, which is still there where the browser forces its own colors.
- A disabled row can still be reached with the arrow keys, so a screen reader can read it. It can't be selected or acted on.

### What you need to handle

- Name the list with `aria-label` or `aria-labelledby`.
- Give every row a `value` no other row has.
- A row's name is all its text, button names included. Where every row has a button that says the same, name each for its row: `aria-label="Message Ada Lovelace"`.
- Disable the buttons inside a disabled row. The row doesn't do it for you.
- Render something else when there are no rows, such as an [empty state](empty.md). A grid with no rows isn't valid.

## On small screens

A row is at least 44 pixels tall, and as tall as what's in it. What's in a row stays on one line. For a row with more than fits, put the text in an element with `flex: 1` and `min-inline-size: 0` so it wraps or is cut short, and keep to one or two buttons, or put the rest in a [menu](dropdown-menu.md).

## CSS variables

Set any of these on the `ListView`, or on anything around it.

```css
.requests {
  --nuv-list-view-padding-inline: 1rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-list-view-fg` | `var(--color-foreground)` | Color of the text. |
| `--nuv-list-view-row-height` | `var(--nuv-touch-size)` | Least height of a row. |
| `--nuv-list-view-padding-block` | `calc(var(--spacing) * 2)` | Space above and below what's in a row. |
| `--nuv-list-view-padding-inline` | `calc(var(--spacing) * 3)` | Space at the start and end of a row. |
| `--nuv-list-view-radius` | `0` | Corner radius of a row. |
| `--nuv-list-view-divider` | `var(--color-border)` | Color of the line between rows. |
| `--nuv-list-view-hover-bg` | `var(--color-muted)` | Background of the row under the pointer. |
| `--nuv-list-view-selected-bg` | `var(--color-muted)` | Background of a selected row. |
| `--nuv-list-view-selected-line-width` | `2px` | Thickness of the bar at the start of a selected row. |
| `--nuv-list-view-selected-line` | `var(--color-primary)` | Color of that bar. Keep it at 3:1 against the row. |
| `--nuv-list-view-button-bg` | `var(--color-background)` | Background of a secondary button in a row. The page's color by default, so the button can be told from a selected row. |
| `--nuv-list-view-gap` | `calc(var(--spacing) * 3)` | Space between the things in a row. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-list-view` | ListView |
| `.nuv-list-view__cell` | The row's one cell, which holds what you gave it. |
| `.nuv-list-view__item` | ListViewItem: the row, which is what's pressed. |

A selected row has `aria-selected="true"` and a disabled one `aria-disabled="true"`.

## Server components

ListView starts with `"use client"`: it keeps which rows are selected. You can render it from a server component with rows written there, as long as you leave `onValueChange` and `onAction` out, since a function can't be passed from the server.

## Do and don't

**Do**

- Keep a row to one line of what it is and one or two things to do with it.
- Say what happened after a button in a row is pressed, in a status or a [toast](toast.md). The row may be gone.

**Don't**

- Don't use it for rows nobody acts on. That's a plain list, or [items](item.md).
- Don't nest a list view in a row.
