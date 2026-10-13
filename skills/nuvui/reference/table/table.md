<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/table/table.mdx. Don't edit it here: run `pnpm skill`. -->

# Table

The elements of a table, styled. A real table with a caption, column and row headings, a sticky header, a pinned column, and a box that scrolls sideways and can be reached from the keyboard.

Use these for a table you write out yourself: a price list, a comparison, the lines of an invoice. Nothing in them sorts or pages. For rows that people sort, filter or select, use a [data table](data-table.md), which is drawn with these same elements.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";

const invoices = [
  { id: "INV-001", customer: "Acme", status: "Paid", total: "$250.00" },
  { id: "INV-002", customer: "Globex", status: "Pending", total: "$1,150.00" },
  { id: "INV-003", customer: "Initech", status: "Overdue", total: "$350.00" },
  { id: "INV-004", customer: "Umbrella", status: "Paid", total: "$450.00" },
];

export default function Example() {
  return (
    <TableContainer>
      <Table>
        <TableCaption>Invoices sent in October</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="end">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell rowHeader>{invoice.id}</TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell align="end">{invoice.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell align="end">$2,200.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
```

## Install

```sh
pnpm add @nuvui/table @nuvui/react @tanstack/react-table
```

## Import

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";
```

The styles come from `@nuvui/table/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Tables](index.md) covers that.

These elements have no TanStack code in them. An app that only uses them can import from `@nuvui/table/table`, and a bundler that doesn't remove unused code then leaves the data table out.

## The parts

Each part is the HTML element it's named for, with a class. It takes that element's attributes and a `ref`.

| Part | Element | What it's for |
| --- | --- | --- |
| `TableContainer` | `div` | The box the table scrolls in. |
| `Table` | `table` | The table. |
| `TableCaption` | `caption` | The table's name. |
| `TableHeader` | `thead` | The rows of headings. |
| `TableBody` | `tbody` | The rows of data. |
| `TableFooter` | `tfoot` | Totals. |
| `TableRow` | `tr` | A row. |
| `TableHead` | `th` | A column's heading. It has `scope="col"`. |
| `TableCell` | `td` | A cell. With `rowHeader` it's a `th` with `scope="row"`. |

## Props

### Table

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `striped` | `boolean` | `false` | Shade every second row of the body. |
| `stickyHeader` | `boolean` | `false` | Keep the header row in view while the body scrolls under it. It sticks to the top of the nearest thing that scrolls: a `TableContainer` with a height, or the page. |
| `layout` | `"auto" \| "fixed"` | `"auto"` | `"auto"` sizes each column to what's in it. `"fixed"` takes each column's width from its first row or its `col`, and is what a table with set column widths needs. |

### TableCaption

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `visuallyHidden` | `boolean` | `false` | Keep the caption for screen readers and show nothing. For a table whose heading is already on the page above it. |

### TableRow

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `selected` | `boolean` | `false` | Mark the row as picked. It gets the selected background and `data-state="selected"`. |

### TableHead and TableCell

Both take these:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `align` | `"center" \| "end" \| "start"` | `"start"` | Which side the content sits on. `"end"` is for numbers, so their digits line up. |
| `pinned` | `"end" \| "start"` |  | Keep the cell in view while the table scrolls sideways. Do it for every cell of the column, the header's too. With one pinned column a side that's all there is to it. With more, each one after the first needs an `inset-inline-start` or `inset-inline-end` of its own. |
| `pinnedEdge` | `boolean` | `false` | Draw the line that separates pinned columns from the ones that scroll. For the last column pinned to the start and the first pinned to the end. |

`TableCell` also takes `rowHeader`, which makes it the heading of its row.

## Name the table

A screen reader reads a table's name when it reaches it, and lists tables by name. Give every table one.

`TableCaption` is the usual way. It's drawn under the table. Where a heading above the table already says what it is, pass `visuallyHidden` to keep the caption for screen readers only, or leave the caption out and point `aria-labelledby` on the `Table` at the heading.

## Headings for rows

A column's heading tells a screen reader what a cell is. A row's heading tells it whose. Mark the cell that names the row, such as the invoice number above or a person's name, with `rowHeader`. A screen reader can then say which invoice a cell belongs to as it moves down a column.

## A table wider than its space

Put the table in a `TableContainer`. A table too wide for it then scrolls sideways inside the box, and the page stays as wide as the screen.

While there's something to scroll, the box takes keyboard focus, and the arrow keys scroll it. Without that, someone who doesn't use a mouse or a touch screen couldn't reach the columns that are out of view. Give the box an `aria-label` or `aria-labelledby` and it's also a region with that name, so a screen reader says what's being scrolled. While everything fits, the box isn't a stop for <kbd>Tab</kbd>.

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const regions = [
  "Austria",
  "Belgium",
  "Croatia",
  "Denmark",
  "Estonia",
  "Finland",
  "Germany",
  "Hungary",
  "Ireland",
  "Latvia",
];

export default function Example() {
  return (
    <TableContainer
      aria-label="Orders by country and month"
      style={{ maxBlockSize: "16rem" }}
    >
      <Table stickyHeader aria-label="Orders by country and month">
        <TableHeader>
          <TableRow>
            <TableHead pinned="start" pinnedEdge>
              Country
            </TableHead>
            {months.map((month) => (
              <TableHead key={month} align="end">
                {month}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {regions.map((region, row) => (
            <TableRow key={region}>
              <TableCell rowHeader pinned="start" pinnedEdge>
                {region}
              </TableCell>
              {months.map((month, column) => (
                <TableCell key={month} align="end">
                  {(1200 + row * 310 + column * 127).toLocaleString("en-US")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

That table also keeps its headings and its first column in view:

- `stickyHeader` on the `Table` keeps the header row at the top of whatever scrolls. Give the `TableContainer` a height, or a `max-block-size`, and that's the box. With no height it's the page.
- `pinned="start"` on every cell of a column, the heading's too, keeps the column at the start edge. `pinnedEdge` draws the line between it and the columns that scroll.

One pinned column on each side needs nothing more. A second on the same side has to start where the first one ends, so it needs an `inset-inline-start` of the first one's width. A [data table](column-pinning.md) measures the columns and does that for you.

## Numbers

`align="end"` puts a column's content at its end edge, which lines digits up so that amounts can be compared down the column. Put it on the heading as well. The table asks the font for digits of equal width, so `1,150.00` and `250.00` line up in a font that has them.

## Density

A row is at least as tall as a control: 40 pixels with a mouse, and 36 or 44 with the [density](../theming.md#density) set to compact or comfortable. A cell with more than one line of text makes its row taller.

On a touch screen a row is at least 44 pixels whatever the density. A checkbox or a button in a row answers a tap anywhere in 44 pixels around it, and in shorter rows those areas would overlap.

`--nuv-table-row-height` sets the least height yourself, and `--nuv-table-cell-padding-x` and `--nuv-table-cell-padding-y` the padding.

## Right to left

The parts use logical properties, so inside `dir="rtl"` text starts at the right, `align="end"` is the left, and `pinned="start"` pins to the right.

## Accessibility

### What the component handles

- The markup is a real `table`, with `thead`, `tbody` and `tfoot`. A screen reader's table commands, such as moving down a column, work in it.
- `TableHead` is a `th` with `scope="col"`, and a `TableCell` with `rowHeader` is a `th` with `scope="row"`. That's what ties every cell to its headings.
- A `TableContainer` with something to scroll takes keyboard focus and scrolls with the arrow keys. Its focus ring is drawn inside the box, where it can't be clipped.
- A selected row has `data-state="selected"` and a background. Where the browser forces its own colors, as Windows high contrast does, backgrounds aren't drawn, and the row gets a bar at its start edge.
- Pinned cells and a sticky header are painted, so what scrolls under them doesn't show through.

### What you need to handle

- Name the table, with a caption or a label.
- Mark the cell that names each row with `rowHeader`.
- Name a `TableContainer` that may scroll, with `aria-label` or `aria-labelledby`.
- `selected` on a row is a look. If rows can be selected, there has to be a control that does it and says so, such as a checkbox with a label. A [data table](row-selection.md) has one.
- Don't use a table to lay out a page. A screen reader announces it as data.

## CSS variables

```css
.pricing {
  --nuv-table-row-height: 3.5rem;
  --nuv-table-header-bg: transparent;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-table-container-max-height` | `none` | The most height the box takes before its rows scroll. |
| `--nuv-table-container-border-width` | `var(--nuv-border-width)` | Width of the box's border. Set it to 0 for a table inside a card. |
| `--nuv-table-border` | `var(--color-border)` | Color of the lines between rows, and of the box. |
| `--nuv-table-container-radius` | `var(--radius-lg)` | Corner radius of the box. |
| `--nuv-table-bg` | `var(--color-surface)` | Background of the box and of a row. |
| `--nuv-table-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-table-font-size` | `var(--text-sm)` | Size of the text. |
| `--nuv-table-cell-padding-y` | `calc(var(--spacing) * 1.5)` | Space above and below a cell's content. |
| `--nuv-table-cell-padding-x` | `calc(var(--spacing) * 3)` | Space at the start and end of a cell. |
| `--nuv-table-caption-fg` | `var(--color-muted-foreground)` | Color of the caption. |
| `--nuv-table-caption-side` | `bottom` | Where the caption goes: bottom or top. |
| `--nuv-table-row-bg` | `var(--nuv-table-bg, var(--color-surface))` | Background of a row. Set it on a row to give that row a color of its own. |
| `--nuv-table-row-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | The least height of a row. The default is a control's height at the current density, and 44 pixels on a touch screen. |
| `--nuv-table-header-bg` | `var(--color-muted)` | Background of a heading. |
| `--nuv-table-header-fg` | `var(--color-muted-foreground)` | Color of a heading's text. |
| `--nuv-table-last-row-border-width` | `0` | Width of the line under the last row. Zero by default, because the box has a border there. |
| `--nuv-table-footer-bg` | `var(--color-muted)` | Background of the footer's rows. |
| `--nuv-table-stripe-bg` | `var(--color-muted)` | Background of every second row with striped. |
| `--nuv-table-row-hover-bg` | `var(--color-muted)` | Background of a row under the pointer. |
| `--nuv-table-row-selected-bg` | `color-mix(in oklab, var(--color-primary) 12%, var(--color-surface))` | Background of a selected row. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-table` | The table. |
| `.nuv-table--fixed` | With layout="fixed". |
| `.nuv-table--sticky-header` | With stickyHeader. |
| `.nuv-table-container` | The box the table scrolls in. |
| `.nuv-table__body` | The tbody. |
| `.nuv-table__body--striped` | The tbody of a table with striped. |
| `.nuv-table__caption` | The caption. |
| `.nuv-table__caption--hidden` | A caption kept for screen readers only. |
| `.nuv-table__cell` | A cell. |
| `.nuv-table__cell--align-center` | A cell with its content in the middle. |
| `.nuv-table__cell--align-end` | A cell with its content at the end. |
| `.nuv-table__cell--pinned-edge` | A pinned cell with the dividing line. |
| `.nuv-table__cell--pinned-end` | A cell pinned to the end. |
| `.nuv-table__cell--pinned-start` | A cell pinned to the start. |
| `.nuv-table__cell--row-header` | The cell that's the heading of its row. |
| `.nuv-table__footer` | The tfoot. |
| `.nuv-table__head` | A column's heading. |
| `.nuv-table__head--align-center` | A heading with its content in the middle. |
| `.nuv-table__head--align-end` | A heading with its content at the end. |
| `.nuv-table__head--pinned-edge` | A pinned heading with the dividing line. |
| `.nuv-table__head--pinned-end` | A heading pinned to the end. |
| `.nuv-table__head--pinned-start` | A heading pinned to the start. |
| `.nuv-table__row` | A row. |

`nuv-table__header` is on the `thead`. It has no styles of its own and is there to hook yours on.

## Do and don't

**Do**

- Put every table in a `TableContainer`, so a phone can scroll it.
- Align numbers to the end, headings included.
- Keep a heading to a word or two. Explain it in the caption or in text near the table.

**Don't**

- Don't leave a table without a name.
- Don't use an empty cell to mean "none" or "not applicable". Write it, so a screen reader has something to read.
- Don't put more in a hand-written table than fits on a screen or two. Past that, people need to sort and search: use a [data table](data-table.md).
