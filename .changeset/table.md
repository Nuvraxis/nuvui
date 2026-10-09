---
"@nuvui/table": minor
---

A new package, `@nuvui/table`, for tables. It's installed next to `@nuvui/react` and `@tanstack/react-table` 9, which are peer dependencies, and has a stylesheet of its own, `@nuvui/table/styles.css`. It's published as ES modules only, as `@tanstack/react-table` is.

- `Table`, with `TableContainer`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell` and `TableCaption`: the elements of a table, styled, for a table written out by hand. `stickyHeader`, `striped`, pinned cells, and a box that scrolls sideways and takes keyboard focus while it does.
- `DataTable`: a finished table from a TanStack Table instance. It adds the controls for the features the table was made with: headings that sort, a search field, a column chooser, checkboxes with a bar for the selected rows, a pagination bar, pinned columns, columns resized by dragging or from the keyboard, and rows that open a panel or a tree. It has loading, empty and error states, and reads out what a sort, a filter or a change of page did.
- `DataTableRoot` and the parts, `DataTableContent`, `DataTableToolbar`, `DataTableFilter`, `DataTableColumnFilter`, `DataTableColumnChooser`, `DataTableBulkActions`, `DataTablePagination`, `DataTableColumnHeader`, `DataTableSelectAll`, `DataTableSelectRow` and `DataTableExpandToggle`, for arranging a table yourself.
- `createDataTableHook`: makes `useDataTable` and a column helper from the TanStack features you list, with the parts registered on the table, on a header and on a cell. `@nuvui/table/full` has one ready with all nine features.
- `useDataTableRequest`: holds what a table is asking a server for, and goes back to the first page when the sort or a filter changes.
- `@nuvui/table/virtual`: `DataTableVirtual` and `DataTableVirtualContent`, which draw only the rows in view. They need `@tanstack/react-virtual`, an optional peer dependency.
