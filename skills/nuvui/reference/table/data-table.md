<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/table/data-table.mdx. Don't edit it here: run `pnpm skill`. -->

# DataTable

A finished table from a TanStack Table instance. Headings that sort, a search field, a column chooser, checkboxes and a pagination bar, each one there when the table has the feature for it, with loading, empty and error states.

Use a data table for rows that people work with: sort, search, page through, select and act on. For a short table that's only read, the [table elements](table.md) on their own are enough.

```tsx
"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("role", { header: "Role" }),
  helper.accessor("seats", { header: "Seats", meta: { align: "end" } }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: people,
    getRowId: (person) => person.id,
  });

  return <DataTable table={table} caption="People" rowHeader="name" />;
}
```

## Install

```sh
pnpm add @nuvui/table @nuvui/react @tanstack/react-table
```

## Import

```tsx
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
```

`@nuvui/table/full` is the hook with every feature. [Tables](index.md#features-are-opt-in) shows how to make one with only the features you use, and how to load the styles.

## How it fits together

There are three steps, and the first two are TanStack Table's.

1. **Columns.** `helper.accessor("name", { header: "Name" })` is a column that reads `name` from each row. A `header` that's a string is all a column needs: where the column can be sorted, the heading becomes a button that sorts it.
2. **The table.** `useDataTable({ columns, data })` returns a TanStack table. It holds the sorting, the filters, the page and the selection, and works out which rows to show.
3. **`DataTable`.** It takes the table and draws it.

`DataTable` looks at what the table can do and adds the controls for it:

| The table has | `DataTable` adds |
| --- | --- |
| [Sorting](sorting.md) | A button in each heading that can sort. |
| [A global filter](filtering.md) | A search field above the table. |
| [Column visibility](column-visibility.md) | A "Columns" button above the table. |
| [Pagination](pagination.md) | A bar under the table. |
| [Row selection](row-selection.md) | Nothing by itself. Add `helper.select()` to the columns. |
| [Column pinning](column-pinning.md) | Pinned columns that stay in view. |
| [Column resizing](column-resizing.md) | A grip on each heading, with `layout="fixed"`. |
| [Expanding rows](expanding.md) | Nothing by itself. Add `helper.expand()`, or `cell.ExpandToggle` in a cell. |

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `table` (required) | `ReactTable<TFeatures, TData, any>` |  | The table, from `useDataTable` or from TanStack's own `useTable`. |
| `labels` | `Partial<DataTableLabels>` |  | Text the table writes itself, to change or translate. |
| `rowHeader` | `string` |  | The id of the column that names each row, such as a person's name. Its cells become the row's heading, and the row's checkbox and expand button are named after it: "Select Ada Lovelace". |
| `getRowLabel` | `((row: Row<TFeatures, TData>) => string)` |  | A name for a row, where no one column gives it. It's used the way `rowHeader` is, for the names of the row's controls. |
| `loading` | `boolean` | `false` | Rows are on their way. With none yet, the table shows placeholders. With some, it keeps them and marks itself busy. |
| `error` | `ReactNode` |  | The rows couldn't be loaded. A message of your own, or `true` for the standard one. It's shown in place of the rows. |
| `onRetry` | `(() => void)` |  | With `error`, adds a button that calls this. |

What goes around the table:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `toolbar` | `ReactNode` |  | What goes above the table. Left out, it's the search field and the column chooser, where the table has those features. `false` for nothing. |
| `bulkActions` | `((rows: Row<TFeatures, TData>[]) => ReactNode) \| ReactNode` |  | Actions for the selected rows. They show in a bar above the table while anything is selected. As a function it's given the selected rows that are loaded. |
| `pagination` | `ReactNode` |  | What goes under the table. Left out, it's the pagination bar, where the table has pages. `false` for nothing. |
| `pageSizes` | `number[]` | `[10, 20, 50, 100]` | The choices for rows per page. |

And the table itself:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `captionHidden` | `boolean` | `false` | Keep the caption for screen readers and show nothing. |
| `stickyHeader` | `boolean` | `false` | Keep the header row in view while the rows scroll. Give the table a height to scroll in with `--nuv-table-container-max-height`. |
| `striped` | `boolean` | `false` | Shade every second row. |
| `layout` | `"auto" \| "fixed"` | `"auto"` | `"auto"` sizes each column to what's in it. `"fixed"` gives each column the width TanStack holds for it, which needs `columnSizingFeature`, and puts a grip on every column that can be resized. |
| `renderDetail` | `((row: Row<TFeatures, TData>) => ReactNode)` |  | What a row shows under itself when it's open. With this set, a row can be opened if `getRowCanExpand` says so. |
| `empty` | `ReactNode` |  | Shown in place of rows when there are none. |
| `loadingRows` | `number` | `the page size, up to 10` | How many placeholder rows to show while the first rows load. |
| `className` | `string` |  |  |

A data table also needs a name. Pass one of `caption`, `aria-label` or `aria-labelledby`. TypeScript reports a table with none of them.

| Prop | When |
| --- | --- |
| `caption` | Nothing else on the page names the table. It's drawn under the table, or kept for screen readers with `captionHidden`. |
| `aria-labelledby` | A heading above the table already names it. Pass the heading's `id`. |
| `aria-label` | The name shouldn't be on show at all. |

## Name the rows

`rowHeader` takes the id of the column that names each row, such as a person's name or an order number. It does two things. That column's cells become the headings of their rows, so a screen reader can say whose row a cell is in. And the row's own controls are named after it: "Select Ada Lovelace", "Show details for Ada Lovelace".

Without it, a row is named by its place: "Select row 3". Where no single column names a row, pass `getRowLabel`:

```tsx
<DataTable
  table={table}
  caption="Orders"
  getRowLabel={(row) => `order ${row.original.number}`}
/>
```

## Columns

A column is TanStack's. These are the parts of one that the data table reads.

`header` as a string is the heading, and the column's name in the column chooser and for screen readers. As a function it draws the heading itself, and is given the registered parts:

```tsx
helper.accessor("email", {
  meta: { label: "Email" },
  header: ({ header }) => (
    <>
      <header.ColumnHeader />
      <header.ColumnFilter />
    </>
  ),
});
```

`header.ColumnHeader` is the heading with its sort button. A column whose `header` is a function has no text for the chooser to list, so give it a `meta.label`. Without one, the column's id is used.

`cell` is what a cell shows. Left out, it's the row's value as text, which suits a name. A number, a date or a status wants more, and `cell` is given the value to draw it from:

```tsx
import { Badge, FormattedNumber } from "@nuvui/react";

// A date with no time is written as UTC, or a reader west of Greenwich
// sees the day before.
const day = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

helper.columns([
  helper.accessor("total", {
    header: "Total",
    meta: { align: "end" },
    cell: (cell) => <FormattedNumber value={cell.getValue()} currency="USD" />,
  }),
  helper.accessor("placed", {
    header: "Placed",
    cell: (cell) => (
      <time dateTime={cell.getValue().toISOString()}>
        {day.format(cell.getValue())}
      </time>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    cell: (cell) => <Badge variant="outline">{cell.getValue()}</Badge>,
  }),
]);
```

Sorting and filtering go by the value and not by what `cell` draws, so a total sorts as a number however it's written. `cell.row.original` is the whole row, for a cell that needs more than its own value.

`meta` takes three things:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` |  | The column's name in the column chooser and for screen readers. A column whose `header` is a string doesn't need one. |
| `align` | `"center" \| "end" \| "start"` |  | Which side the column's cells and heading sit on. |
| `control` | `boolean` |  | The column only holds a control, such as a checkbox. It's kept as narrow as the control. |

With `@nuvui/table/full`, `meta` is typed. In a hook of your own, register the type to get the same:

```tsx
import type { DataTableColumnMeta } from "@nuvui/table";
import { metaHelper, tableFeatures } from "@tanstack/react-table";

tableFeatures({
  columnMeta: metaHelper<DataTableColumnMeta>(),
});
```

A `footer` on any column adds a footer row.

## Loading, empty and failed

```tsx
"use client";

import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { useState } from "react";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
]);
const rows = people.slice(0, 4);
const none: Person[] = [];

type State = "rows" | "first load" | "reload" | "empty" | "error";

export default function Example() {
  const [state, setState] = useState<State>("first load");
  const table = useDataTable({
    columns,
    data: state === "rows" || state === "reload" ? rows : none,
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ToggleGroup
        type="single"
        aria-label="State"
        value={state}
        onValueChange={(value) => value && setState(value as State)}
      >
        <ToggleGroupItem value="rows">Rows</ToggleGroupItem>
        <ToggleGroupItem value="first load">First load</ToggleGroupItem>
        <ToggleGroupItem value="reload">Reload</ToggleGroupItem>
        <ToggleGroupItem value="empty">Empty</ToggleGroupItem>
        <ToggleGroupItem value="error">Error</ToggleGroupItem>
      </ToggleGroup>
      <DataTable
        table={table}
        aria-label="People"
        rowHeader="name"
        toolbar={false}
        pagination={false}
        loading={state === "first load" || state === "reload"}
        loadingRows={4}
        error={state === "error"}
        onRetry={() => setState("first load")}
        empty="Nobody has been invited yet."
      />
    </div>
  );
}
```

- **`loading`** with no rows yet shows placeholder rows: as many as a page holds, up to ten, or `loadingRows`. With rows already there, it keeps them, so a reload doesn't flash the table empty. Either way the table has `aria-busy`.
- **No rows** shows "No rows.", or what you pass as `empty`. When a filter is why there are none, it says "No rows match." with a button that clears the filters.
- **`error`** shows a message in place of the rows, and reads it out at once. Pass a message of your own or `true` for the standard one. With `onRetry` there's a "Try again" button.

## Arrange the parts yourself

`DataTable` is a `DataTableRoot` with four parts in it: the toolbar, the bar for selected rows, the table and the pagination bar. To put them somewhere else, or something else between them, use the root and place the parts:

```tsx
"use client";

import {
  DataTableContent,
  DataTablePagination,
  DataTableRoot,
} from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: people,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return (
    <DataTableRoot table={table} rowHeader="name">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 id="team-heading" style={{ margin: 0, fontWeight: 600 }}>
          Team
        </h3>
        <table.Filter />
      </div>
      <DataTableContent aria-labelledby="team-heading" striped />
      <DataTablePagination pageSizes={[]} />
    </DataTableRoot>
  );
}
```

| Part | What it is |
| --- | --- |
| `DataTableRoot` | Takes `table`, `labels`, `rowHeader`, `getRowLabel`, `loading`, `error` and `onRetry`, and hands them to the parts. Every part has to be inside one. |
| `DataTableContent` | The table. Takes the name, `stickyHeader`, `striped`, `layout`, `renderDetail`, `empty` and `loadingRows`. |
| `DataTableToolbar` | A row for controls. Empty, it holds the search field and the column chooser. |
| `DataTableFilter` | The search field. |
| `DataTableColumnFilter` | A text filter for one column. |
| `DataTableColumnChooser` | The "Columns" button. |
| `DataTableBulkActions` | The bar that shows while rows are selected. |
| `DataTablePagination` | The pagination bar. |
| `DataTableColumnHeader` | A heading with its sort button. |
| `DataTableSelectAll` and `DataTableSelectRow` | The checkboxes. |
| `DataTableExpandToggle` | The button that opens a row. |

On a table from the hook the same parts are there as `table.Filter`, `table.Pagination` and so on.

The `toolbar` and `pagination` props of `DataTable` cover the common changes without going this far. Pass your own, or `false` for none.

## Text and translation

Everything the data table writes itself is in `labels`: the button names, "No rows.", "Page 2 of 5", and what's read out after a sort. Pass the ones to change:

```tsx
<DataTable
  table={table}
  caption="Personen"
  labels={{
    search: "Suchen",
    columns: "Spalten",
    rowsPerPage: "Zeilen pro Seite",
    page: (page, pages) => `Seite ${page} von ${pages}`,
    selected: (count) => `${count} ausgewählt`,
  }}
/>
```

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `search` (required) | `string` |  | The search field's name and placeholder. |
| `columns` (required) | `string` |  | The column chooser's button. |
| `empty` (required) | `string` |  | Shown in place of rows when there are none. |
| `noMatches` (required) | `string` |  | Shown in place of rows when a filter leaves none. |
| `clearFilters` (required) | `string` |  |  |
| `error` (required) | `string` |  | Shown when `error` is `true` and not a message of your own. |
| `retry` (required) | `string` |  |  |
| `selectAll` (required) | `string` |  |  |
| `selectPage` (required) | `string` |  | The header checkbox of a table with pages. |
| `selectRow` (required) | `(row: string) => string` |  |  |
| `rowName` (required) | `(position: number) => string` |  | A row's name when it has no `rowHeader` column: its place in the list. |
| `expandRow` (required) | `(row: string) => string` |  |  |
| `collapseRow` (required) | `(row: string) => string` |  |  |
| `selected` (required) | `(count: number) => string` |  |  |
| `clearSelection` (required) | `string` |  |  |
| `bulkActions` (required) | `string` |  | The name of the bar that holds the actions for selected rows. |
| `pagination` (required) | `string` |  |  |
| `rowsPerPage` (required) | `string` |  |  |
| `pageRange` (required) | `(from: number, to: number, total: number) => string` |  | "21-40 of 143". |
| `page` (required) | `(page: number, pages: number) => string` |  |  |
| `firstPage` (required) | `string` |  |  |
| `previousPage` (required) | `string` |  |  |
| `nextPage` (required) | `string` |  |  |
| `lastPage` (required) | `string` |  |  |
| `resizeColumn` (required) | `(column: string) => string` |  |  |
| `filterColumn` (required) | `(column: string) => string` |  |  |
| `sortedAscending` (required) | `(column: string) => string` |  | Read out after a sort. |
| `sortedDescending` (required) | `(column: string) => string` |  |  |
| `sortCleared` (required) | `string` |  |  |
| `results` (required) | `(count: number) => string` |  | Read out after a filter changes how many rows there are. |

Numbers in the labels are plain. Format them in your own functions if your language groups digits.

## On small screens

The toolbar wraps, and the search field takes a row of its own. The pagination bar puts the page buttons on their own row, spread across the width. The table scrolls sideways inside its box, and the box can be scrolled from the keyboard.

A table with many columns is hard to use on a phone however it scrolls. [Pin](column-pinning.md) the column that names the row, so it stays in view, and [hide](column-visibility.md) the columns that matter least.

On a touch screen every control is 44 pixels: the sort buttons, the page buttons and the area around each checkbox.

## Accessibility

### Keyboard

Every control is a button, a checkbox, a text field or a select, and works the way those do: <kbd>Tab</kbd> to reach it, <kbd>Enter</kbd> or <kbd>Space</kbd> to use it. Each feature's page has the keys that are particular to it.

| Key | Where | What it does |
| --- | --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | A heading | Sorts by the column. |
| <kbd>Shift</kbd> with <kbd>Enter</kbd> | A heading | Adds the column to the sort. |
| <kbd>Space</kbd> | A checkbox | Selects the row. |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | The table's box, when it scrolls | Scrolls it. |
| <kbd>←</kbd> and <kbd>→</kbd> | A column's grip | Makes the column narrower or wider. |

### What the component handles

- The table is a real `table` with a name, column headings with `scope`, and a heading for each row when `rowHeader` is set.
- A sorted column's heading has `aria-sort`. With a sort by several columns, the first has it.
- Every checkbox, expand button and grip has a name that says which row or column it's for.
- A sort, a filter, a change of page and a change in the selection are each read out by a polite live region: "Sorted by Name, ascending", "4 rows", "Page 2 of 5", "3 selected". With a [server](server.md) doing the work, the message waits for the rows to arrive.
- A page button with no page to go to keeps keyboard focus and is marked `aria-disabled`. A disabled button would drop focus onto the page the moment "Next" reached the last page.
- When the bar for selected rows goes, because the selection was cleared from inside it, focus moves to the table's first checkbox.
- An error is in an alert, so it's read out when it appears.
- The heading of a column of checkboxes isn't a column heading, so a screen reader doesn't read "Select all rows" before every cell under it.

### What you need to handle

- Name the table, and set `rowHeader` or `getRowLabel`.
- Give a column whose `header` is a function a `meta.label`.
- What you put in a cell is yours. A button made of an icon needs a name that says which row it acts on.
- Translate `labels` with the rest of your interface.

### What hasn't been checked

The tests check the roles, names and states that a browser passes on to a screen reader, and that the live region's text changes. What each screen reader then says, and when, hasn't been checked by a person.

## CSS variables

The table inside is made of the [table elements](table.md#css-variables), and their variables apply here: `--nuv-table-row-height`, `--nuv-table-header-bg` and the rest. These are the data table's own:

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-data-table-gap` | `calc(var(--spacing) * 3)` | Space between the toolbar, the table and the pagination bar. |
| `--nuv-data-table-fg` | `var(--color-foreground)` | Text color of the toolbar and the bars. |
| `--nuv-data-table-filter-width` | `16rem` | Width of the search field from the sm breakpoint up. |
| `--nuv-data-table-column-filter-min-width` | `6rem` | The least width of a column's filter field. |
| `--nuv-data-table-bulk-border` | `var(--color-border)` | Border color of the bar for selected rows. |
| `--nuv-data-table-bulk-radius` | `var(--radius-lg)` | Corner radius of that bar. |
| `--nuv-data-table-bulk-bg` | `var(--color-muted)` | Background of that bar. |
| `--nuv-data-table-sort-hover-fg` | `var(--color-foreground)` | Color of a heading's sort button under the pointer. |
| `--nuv-data-table-sorted-fg` | `var(--color-foreground)` | Color of the heading of a sorted column. |
| `--nuv-data-table-resize-color` | `var(--color-border-strong)` | Color of the line on a column's grip. |
| `--nuv-data-table-resize-active-color` | `var(--color-primary)` | Color of that line under the pointer and while the column is being resized. |
| `--nuv-data-table-expand-size` | `1.5rem` | Width and height of the button that opens a row. |
| `--nuv-data-table-indent` | `1.25rem` | How far each level of a tree is indented. |
| `--nuv-data-table-depth` | `0` | Set by the component on each expand button: how deep its row is in a tree. Read it, don't set it. |
| `--nuv-data-table-expand-fg` | `var(--color-muted-foreground)` | Color of that button's arrow. |
| `--nuv-data-table-detail-bg` | `var(--color-background)` | Background of a row's open panel. |
| `--nuv-data-table-detail-padding` | `calc(var(--spacing) * 4)` | Padding of that panel. |
| `--nuv-data-table-message-padding` | `calc(var(--spacing) * 10)` | Space above and below what's shown in place of rows. |
| `--nuv-data-table-message-fg` | `var(--color-muted-foreground)` | Color of that text. |
| `--nuv-data-table-pagination-fg` | `var(--color-muted-foreground)` | Text color of the pagination bar. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-data-table` | The root element. |
| `.nuv-data-table__bulk` | The bar for selected rows. |
| `.nuv-data-table__bulk-actions` | The element around your actions. |
| `.nuv-data-table__bulk-count` | How many are selected. |
| `.nuv-data-table__cell--control` | A cell of a column that only holds a control. |
| `.nuv-data-table__column-filter` | A column's filter field. |
| `.nuv-data-table__detail` | The panel's cell. |
| `.nuv-data-table__detail-row` | The row that holds an open panel. |
| `.nuv-data-table__expand` | The button that opens a row. |
| `.nuv-data-table__expand-gap` | The space a row with nothing to open has in its place. |
| `.nuv-data-table__expand-icon` | The arrow in the button. |
| `.nuv-data-table__filter` | The search field. |
| `.nuv-data-table__head--resizable` | A heading with a grip. |
| `.nuv-data-table__heading` | The text of a heading. |
| `.nuv-data-table__loading-row` | A placeholder row. |
| `.nuv-data-table__message` | Its cell. |
| `.nuv-data-table__message-row` | The row shown in place of rows. |
| `.nuv-data-table__page` | The page it is. |
| `.nuv-data-table__page-button` | A page button. |
| `.nuv-data-table__page-icon` | The arrow in it. |
| `.nuv-data-table__page-range` | Which rows are showing, out of how many. |
| `.nuv-data-table__page-size` | The rows per page label and select. |
| `.nuv-data-table__pages` | The page buttons and the page between them. |
| `.nuv-data-table__pagination` | The pagination bar. |
| `.nuv-data-table__resize` | The grip. |
| `.nuv-data-table__sort` | A heading's sort button. |
| `.nuv-data-table__sort-icon` | The arrows in it. |
| `.nuv-data-table__sort-index` | The number that shows a column's place in a sort by several. |
| `.nuv-data-table__status` | The live region. It's in the page and not on show. |
| `.nuv-data-table__toolbar` | The row of controls above the table. |
| `.nuv-data-table__toolbar-gap` | The space that pushes the column chooser to the end. |

`nuv-data-table__container` is on the table's box, `nuv-data-table__chooser` on the "Columns" button and `nuv-data-table__page-size-label` on the rows per page label. They have no styles of their own and are there to hook yours on.

## What it's built on

[TanStack Table](https://tanstack.com/table) 9 holds the state and works out the rows. The markup, the styles, the controls and the accessibility on this page are this package's. The controls are `@nuvui/react`'s button, checkbox, input, native select and dropdown menu.

## Do and don't

**Do**

- Set `getRowId` when rows have an id. Selection and open rows are then kept by id, and survive a sort or a reload.
- Keep `columns` and `data` the same arrays between renders, unless they've changed.
- Use the [server mode](server.md) once there are more rows than you'd send to a browser in one go.

**Don't**

- Don't put a table inside a row's cell. Use a [panel under the row](expanding.md).
- Don't hide the pagination bar while the rows run past one page. The rows after the first page couldn't be reached. A table whose rows all fit on one page, ten unless you set another size, can leave the bar out, as the short examples on these pages do.
- Don't rely on color in a cell to carry meaning. Write the status.
