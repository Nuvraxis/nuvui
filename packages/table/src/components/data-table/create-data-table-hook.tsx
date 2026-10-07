"use client";

import { useDirection } from "@nuvui/react/direction";
import {
  type AppColumnHelper,
  type AppDisplayColumnDef,
  type AppReactTable,
  type CreateTableHookOptions,
  createTableHook,
  type DisplayColumnDef,
  type RowData,
  type TableFeatures,
  type TableOptions,
  type TableState,
} from "@tanstack/react-table";
import type { ComponentType } from "react";
import { tableContexts } from "./context";
import { DataTableColumnHeader } from "./header";
import { DataTablePagination } from "./pagination";
import {
  DataTableBulkActions,
  DataTableExpandToggle,
  DataTableSelectAll,
  DataTableSelectRow,
} from "./selection";
import {
  DataTableColumnChooser,
  DataTableColumnFilter,
  DataTableFilter,
  DataTableToolbar,
} from "./toolbar";

// The parts every table from the hook carries: on the table, on a header
// and on a cell. `table.Pagination`, `header.ColumnHeader`, `cell.SelectRow`.
const tableComponents = {
  Toolbar: DataTableToolbar,
  Filter: DataTableFilter,
  ColumnChooser: DataTableColumnChooser,
  BulkActions: DataTableBulkActions,
  Pagination: DataTablePagination,
};
const headerComponents = {
  ColumnHeader: DataTableColumnHeader,
  ColumnFilter: DataTableColumnFilter,
  SelectAll: DataTableSelectAll,
};
const cellComponents = {
  SelectRow: DataTableSelectRow,
  ExpandToggle: DataTableExpandToggle,
};

// biome-ignore lint/suspicious/noExplicitAny: what TanStack's own registry takes
type Components = Record<string, ComponentType<any>>;
// biome-ignore lint/complexity/noBannedTypes: no components of the app's own
type None = {};

type TableComponents<T extends Components> = typeof tableComponents & T;
type HeaderComponents<T extends Components> = typeof headerComponents & T;
type CellComponents<T extends Components> = typeof cellComponents & T;

type ControlColumn<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TCell extends Components,
  THeader extends Components,
> = Partial<
  AppDisplayColumnDef<
    TFeatures,
    TData,
    CellComponents<TCell>,
    HeaderComponents<THeader>
  >
>;

export type DataTableColumnHelper<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TCell extends Components = None,
  THeader extends Components = None,
> = AppColumnHelper<
  TFeatures,
  TData,
  CellComponents<TCell>,
  HeaderComponents<THeader>
> & {
  /**
   * A column of checkboxes: one a row, and one in the heading for all of
   * them. Needs `rowSelectionFeature`.
   */
  select: (
    column?: ControlColumn<TFeatures, TData, TCell, THeader>,
  ) => DisplayColumnDef<TFeatures, TData, unknown>;
  /**
   * A column of buttons that open and close a row. Needs
   * `rowExpandingFeature`.
   */
  expand: (
    column?: ControlColumn<TFeatures, TData, TCell, THeader>,
  ) => DisplayColumnDef<TFeatures, TData, unknown>;
};

export type DataTableHookOptions<
  TFeatures extends TableFeatures,
  TTable extends Components = None,
  TCell extends Components = None,
  THeader extends Components = None,
> = Omit<
  CreateTableHookOptions<TFeatures, TTable, TCell, THeader>,
  "tableContext" | "cellContext" | "headerContext"
>;

// What a control column is, whatever the features. They're switched off for
// everything a column of data can do, each only where the feature that
// knows the option is there. An option no feature knows is ignored.
const control = {
  enableSorting: false,
  enableHiding: false,
  enableResizing: false,
  enableColumnFilter: false,
  enableGlobalFilter: false,
  size: 48,
  meta: { control: true },
};

/**
 * Makes the hook an app's tables are created with. Call it once, in a
 * module of its own, with the features your tables use. Only those end up
 * in your bundle.
 *
 * It's TanStack's `createTableHook` with this package's controls already
 * registered, and takes the same options. What it returns:
 *
 * - `useDataTable`: `useTable`, bound to the features. Its table has the
 *   controls on it: `table.Pagination`, `table.Filter` and so on.
 * - `createColumnHelper`: TanStack's column helper, bound to the features,
 *   with `select()` and `expand()` added. In a column's `header` and `cell`
 *   the controls are on what it's given: `header.ColumnHeader`,
 *   `cell.SelectRow`.
 */
export function createDataTableHook<
  TFeatures extends TableFeatures,
  const TTable extends Components = None,
  const TCell extends Components = None,
  const THeader extends Components = None,
>(options: DataTableHookOptions<TFeatures, TTable, TCell, THeader>) {
  const hook = createTableHook<
    TFeatures,
    TableComponents<TTable>,
    CellComponents<TCell>,
    HeaderComponents<THeader>
  >({
    ...options,
    ...tableContexts,
    tableComponents: {
      ...tableComponents,
      ...options.tableComponents,
    } as TableComponents<TTable>,
    cellComponents: {
      ...cellComponents,
      ...options.cellComponents,
    } as CellComponents<TCell>,
    headerComponents: {
      ...headerComponents,
      ...options.headerComponents,
    } as HeaderComponents<THeader>,
  } as unknown as CreateTableHookOptions<
    TFeatures,
    TableComponents<TTable>,
    CellComponents<TCell>,
    HeaderComponents<THeader>
  >);

  function useDataTable<
    TData extends RowData,
    TSelected = TableState<TFeatures>,
  >(
    tableOptions: Omit<TableOptions<TFeatures, TData>, "features">,
    selector?: (state: TableState<TFeatures>) => TSelected,
  ): AppReactTable<
    TFeatures,
    TData,
    TSelected,
    TableComponents<TTable>,
    CellComponents<TCell>,
    HeaderComponents<THeader>
  > {
    // Dragging a column's edge has to know which way wider is.
    const columnResizeDirection = useDirection();
    return hook.useAppTable(
      { columnResizeDirection, ...tableOptions } as Omit<
        TableOptions<TFeatures, TData>,
        "features"
      >,
      selector,
    );
  }

  function createColumnHelper<TData extends RowData>(): DataTableColumnHelper<
    TFeatures,
    TData,
    TCell,
    THeader
  > {
    const helper = hook.createAppColumnHelper<TData>();
    type Column = ControlColumn<TFeatures, TData, TCell, THeader>;
    type Display = Parameters<typeof helper.display>[0];
    return Object.assign(helper, {
      select: (column: Column = {}) =>
        helper.display({
          id: "select",
          header: DataTableSelectAll,
          cell: DataTableSelectRow,
          ...control,
          ...column,
        } as unknown as Display),
      expand: (column: Column = {}) =>
        helper.display({
          id: "expand",
          cell: DataTableExpandToggle,
          ...control,
          ...column,
        } as unknown as Display),
    });
  }

  return {
    /** The features object that was passed in. */
    features: hook.appFeatures,
    useDataTable,
    createColumnHelper,
    useTableContext: hook.useTableContext,
    useHeaderContext: hook.useHeaderContext,
    useCellContext: hook.useCellContext,
  };
}
