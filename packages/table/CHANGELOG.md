# @nuvui/table

## 0.1.2

### Patch Changes

- Updated dependencies [[`adfcd97`](https://github.com/Nuvraxis/nuvui/commit/adfcd978c029bfa747be1d3ca2952d4b8df5d409), [`5489f1e`](https://github.com/Nuvraxis/nuvui/commit/5489f1e191c9ad8325e26c0c03fdf9b81c56f74a)]:
  - @nuvui/react@0.2.0

## 0.1.1

### Patch Changes

- [#26](https://github.com/Nuvraxis/nuvui/pull/26) [`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1) Thanks [@sajanv88](https://github.com/sajanv88)! - Each package's README said the package hadn't been released and that the docs would live at nuvui.nuvraxis.com. It now gives the install command and links to the docs, which are there.
- Updated dependencies [[`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1)]:
  - @nuvui/react@0.1.1

## 0.1.0

### Minor Changes

- [#11](https://github.com/Nuvraxis/nuvui/pull/11) [`f2ff8b3`](https://github.com/Nuvraxis/nuvui/commit/f2ff8b383109aec24cb41e2bca6aad33c87bc5bc) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, `@nuvui/table`, for tables. It's installed next to `@nuvui/react` and `@tanstack/react-table` 9, which are peer dependencies, and has a stylesheet of its own, `@nuvui/table/styles.css`. It's published as ES modules only, as `@tanstack/react-table` is.
  
  - `Table`, with `TableContainer`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell` and `TableCaption`: the elements of a table, styled, for a table written out by hand. `stickyHeader`, `striped`, pinned cells, and a box that scrolls sideways and takes keyboard focus while it does.
  - `DataTable`: a finished table from a TanStack Table instance. It adds the controls for the features the table was made with: headings that sort, a search field, a column chooser, checkboxes with a bar for the selected rows, a pagination bar, pinned columns, columns resized by dragging or from the keyboard, and rows that open a panel or a tree. It has loading, empty and error states, and reads out what a sort, a filter or a change of page did.
  - `DataTableRoot` and the parts, `DataTableContent`, `DataTableToolbar`, `DataTableFilter`, `DataTableColumnFilter`, `DataTableColumnChooser`, `DataTableBulkActions`, `DataTablePagination`, `DataTableColumnHeader`, `DataTableSelectAll`, `DataTableSelectRow` and `DataTableExpandToggle`, for arranging a table yourself.
  - `createDataTableHook`: makes `useDataTable` and a column helper from the TanStack features you list, with the parts registered on the table, on a header and on a cell. `@nuvui/table/full` has one ready with all nine features.
  - `useDataTableRequest`: holds what a table is asking a server for, and goes back to the first page when the sort or a filter changes.
  - `@nuvui/table/virtual`: `DataTableVirtual` and `DataTableVirtualContent`, which draw only the rows in view. They need `@tanstack/react-virtual`, an optional peer dependency.

### Patch Changes

- Updated dependencies [[`96ea5b0`](https://github.com/Nuvraxis/nuvui/commit/96ea5b066337f2af55990c7c1ab5d2b6167c689d), [`f1888c3`](https://github.com/Nuvraxis/nuvui/commit/f1888c3dd1ae3d577a019a5e90736cddbbbea98e), [`593695e`](https://github.com/Nuvraxis/nuvui/commit/593695e160e11aa9dd63d6f47ce4cdb4093ac63e), [`4fd9569`](https://github.com/Nuvraxis/nuvui/commit/4fd9569dd181fb77194aebdcca84ed76247d0884), [`28459a2`](https://github.com/Nuvraxis/nuvui/commit/28459a2bb5bbab719610be3a7cdd95078bae10c7), [`803ca37`](https://github.com/Nuvraxis/nuvui/commit/803ca371a159e47e0b883445e25a351bcb84ee7b), [`e4fef87`](https://github.com/Nuvraxis/nuvui/commit/e4fef8740a1021d9f55c3ddf049412b44cb4c557), [`c59eabf`](https://github.com/Nuvraxis/nuvui/commit/c59eabfef3028bd4d4a0417ca88dc88d978f706d), [`e47ff84`](https://github.com/Nuvraxis/nuvui/commit/e47ff846062fb1a742ff56d4021a06a8a5eebbc5)]:
  - @nuvui/react@0.1.0
