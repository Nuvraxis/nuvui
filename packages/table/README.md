# @nuvui/table

Tables for [`@nuvui/react`](https://github.com/Nuvraxis/nuvui/tree/main/packages/ui): the elements of a table, styled, and a data table drawn from a [TanStack Table](https://tanstack.com/table) 9 instance, with the controls that go with it.

This is early, and the package hasn't been released. See the [repository README](https://github.com/Nuvraxis/nuvui#readme) for where things stand.

```sh
pnpm add @nuvui/table @nuvui/react @tanstack/react-table
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/table/styles.css";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";

type Person = { id: string; name: string; email: string };

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
]);

export function People({ people }: { people: Person[] }) {
  const table = useDataTable({ columns, data: people });
  return <DataTable table={table} caption="People" rowHeader="name" />;
}
```

## What's in it

- `Table`, `TableContainer`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell` and `TableCaption`: a real `table`, styled, for a table written out by hand. A sticky header, a pinned column, and a box that scrolls sideways and can be reached from the keyboard.
- `DataTable`: a finished table from a TanStack table. Headings that sort, a search field, a column chooser, checkboxes with a bar for the selected rows, a pagination bar, pinned and resizable columns, rows that open, and loading, empty and error states. Each is there when the table was made with the feature for it.
- `createDataTableHook`: makes the hook your tables are created with, from the TanStack features you list. Only those end up in your bundle.
- `@nuvui/table/full`: that hook, ready made, with all nine features.
- `useDataTableRequest`: for a table whose sorting, filtering and paging are done by a server.
- `@nuvui/table/virtual`: the data table with only the rows in view drawn. It needs `@tanstack/react-virtual`.

TanStack Table keeps a table's state and works out its rows. The markup, the styles, the controls and the accessibility are this package's: a caption or label, `scope` on headings, `aria-sort`, named checkboxes, and a live region that reads out what a sort, a filter or a change of page did.

## Peer dependencies

`@nuvui/react` and `@tanstack/react-table` 9 are peer dependencies. Your columns are written with TanStack's own helpers and types, so your app owns that version. `@tanstack/react-virtual` is an optional peer, needed only for `@nuvui/table/virtual`.

TanStack Table 9 is a different API from version 8. The docs have a page for people coming from version 8.

The package is ES modules only, as `@tanstack/react-table` is.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install a table engine.

Docs will live at https://nuvui.nuvraxis.com.

## License

MIT
