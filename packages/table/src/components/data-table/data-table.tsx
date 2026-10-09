"use client";

import type {
  ReactTable,
  Row,
  RowData,
  TableFeatures,
} from "@tanstack/react-table";
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import {
  DataTableContent,
  type DataTableContentOwnProps,
  type DataTableContentProps,
  type DataTableName,
} from "./content";
import {
  type AnyRow,
  type AnyTable,
  columnLabel,
  type DataTableView,
  supports,
  tableContexts,
  useDataTableView,
  ViewContext,
} from "./context";
import { type DataTableLabels, defaultLabels } from "./labels";
import { DataTablePagination } from "./pagination";
import { DataTableBulkActions } from "./selection";
import { DataTableToolbar } from "./toolbar";

export interface DataTableRootOwnProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table
  TData extends RowData = any,
> {
  /** The table, from `useDataTable` or from TanStack's own `useTable`. */
  // biome-ignore lint/suspicious/noExplicitAny: whatever state the table selects
  table: ReactTable<TFeatures, TData, any>;
  /** Text the table writes itself, to change or translate. */
  labels?: Partial<DataTableLabels>;
  /**
   * The id of the column that names each row, such as a person's name. Its
   * cells become the row's heading, and the row's checkbox and expand
   * button are named after it: "Select Ada Lovelace".
   */
  rowHeader?: string;
  /**
   * A name for a row, where no one column gives it. It's used the way
   * `rowHeader` is, for the names of the row's controls.
   */
  getRowLabel?: (row: Row<TFeatures, TData>) => string;
  /**
   * Rows are on their way. With none yet, the table shows placeholders.
   * With some, it keeps them and marks itself busy.
   * @default false
   */
  loading?: boolean;
  /**
   * The rows couldn't be loaded. A message of your own, or `true` for the
   * standard one. It's shown in place of the rows.
   */
  error?: ReactNode;
  /** With `error`, adds a button that calls this. */
  onRetry?: () => void;
}

export interface DataTableRootProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
> extends DataTableRootOwnProps<TFeatures, TData>,
    HTMLAttributes<HTMLDivElement> {}

type Change = "filter" | "sort" | "page" | "selection";

// Says what a change did, for someone who can't see the rows move. One
// polite region, so a message never interrupts what's being read.
function Announcer() {
  const { table, labels, loading } = useDataTableView("DataTable");
  const [message, setMessage] = useState("");

  const sorting = table.atoms.sorting?.get();
  const columnFilters = table.atoms.columnFilters?.get();
  const globalFilter = table.atoms.globalFilter?.get();
  const pageIndex = table.atoms.pagination?.get().pageIndex;
  const selection = supports.selection(table)
    ? table.getSelectedRowIds().length
    : 0;

  const seen = useRef({
    sorting,
    columnFilters,
    globalFilter,
    pageIndex,
    selection,
  });
  const pending = useRef<Change | null>(null);
  // For a change a server answers: the rows that were showing when it was
  // made, and whether the table has been marked as loading since.
  const asked = useRef<{ data: unknown; loaded: boolean } | null>(null);
  const { data } = table.options;
  const manualFilter = table.options.manualFiltering === true;
  const manualSort = table.options.manualSorting === true;
  const manualPage = table.options.manualPagination === true;

  useEffect(() => {
    const before = seen.current;
    seen.current = {
      sorting,
      columnFilters,
      globalFilter,
      pageIndex,
      selection,
    };
    // A filter also sends the table back to its first page. The filter is
    // the news.
    let fresh = true;
    if (
      before.columnFilters !== columnFilters ||
      before.globalFilter !== globalFilter
    ) {
      pending.current = "filter";
    } else if (before.sorting !== sorting) {
      pending.current = "sort";
    } else if (before.pageIndex !== pageIndex) {
      pending.current = "page";
    } else if (before.selection !== selection) {
      pending.current = "selection";
    } else {
      fresh = false;
    }

    const change = pending.current;
    if (!change) return;
    const manual =
      (change === "filter" && manualFilter) ||
      (change === "sort" && manualSort) ||
      (change === "page" && manualPage);
    // With a server doing the work, the rows that answer the change aren't
    // here yet, and the table may not be marked as loading yet either: an
    // app that fetches in an effect sets that one render later. The
    // message waits until loading has come and gone, or the rows are new.
    if (manual) {
      if (fresh) asked.current = { data, loaded: false };
      if (asked.current && loading) asked.current.loaded = true;
      const answered =
        asked.current !== null &&
        !loading &&
        (asked.current.loaded || asked.current.data !== data);
      if (!answered) return;
      asked.current = null;
    } else if (loading) {
      return;
    }
    pending.current = null;

    let text = "";
    if (change === "filter") {
      text = labels.results(
        supports.pagination(table)
          ? table.getRowCount()
          : table.getRowModel().rows.length,
      );
    } else if (change === "sort") {
      const first = sorting?.[0];
      const column = first ? table.getColumn(first.id) : undefined;
      if (!first || !column) text = labels.sortCleared;
      else if (first.desc) text = labels.sortedDescending(columnLabel(column));
      else text = labels.sortedAscending(columnLabel(column));
    } else if (change === "page") {
      text = labels.page(
        (pageIndex ?? 0) + 1,
        Math.max(table.getPageCount(), 1),
      );
    } else {
      text = labels.selected(selection);
    }
    // The same words twice in a row aren't read the second time. A space
    // on the end, one that isn't trimmed away, makes them new.
    setMessage((last) => (last === text ? `${text}\u00a0` : text));
  }, [
    table,
    labels,
    loading,
    data,
    manualFilter,
    manualSort,
    manualPage,
    sorting,
    columnFilters,
    globalFilter,
    pageIndex,
    selection,
  ]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="nuv-data-table__status"
    >
      {message}
    </div>
  );
}

// The value is made again every time this draws, and this draws on every
// change of the table's state. A new value is what tells the parts to draw
// themselves again: the elements passed in as children are the same ones as
// last time, and React would otherwise leave them as they were.
function Provide({
  table,
  labels: given,
  rowHeader,
  getRowLabel,
  loading,
  error,
  onRetry,
  children,
}: Omit<DataTableView, "labels" | "rowName"> & {
  labels: Partial<DataTableLabels> | undefined;
  getRowLabel: ((row: AnyRow) => string) | undefined;
  children: ReactNode;
}) {
  const labels = useMemo(() => ({ ...defaultLabels, ...given }), [given]);
  const view: DataTableView = {
    table,
    labels,
    rowHeader,
    loading,
    error,
    onRetry,
    rowName(row) {
      if (getRowLabel) return getRowLabel(row);
      if (rowHeader) return String(row.getValue(rowHeader) ?? "");
      const index = row.getDisplayIndex();
      return labels.rowName((index === -1 ? row.index : index) + 1);
    },
  };

  return (
    <tableContexts.tableContext.Provider value={table}>
      <ViewContext.Provider value={view}>{children}</ViewContext.Provider>
    </tableContexts.tableContext.Provider>
  );
}

/**
 * What every part of a data table sits in. It takes the table and hands it
 * to the parts, and reads out what changes for screen readers.
 *
 * `DataTable` is this with the usual parts already inside. Use this one to
 * arrange them yourself.
 */
export function DataTableRoot<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({
  table: given,
  labels,
  rowHeader,
  getRowLabel,
  loading = false,
  error,
  onRetry,
  className,
  children,
  ...props
}: DataTableRootProps<TFeatures, TData>) {
  const table = given as unknown as AnyTable;
  return (
    <div
      className={cx("nuv-data-table", className)}
      data-loading={loading ? "" : undefined}
      {...props}
    >
      {/* The table handed in may only follow some of its state: useTable
          takes a selector for that. The parts need all of it. */}
      <table.Subscribe selector={(state) => state}>
        {() => (
          <Provide
            table={table}
            labels={labels}
            rowHeader={rowHeader}
            getRowLabel={getRowLabel as ((row: AnyRow) => string) | undefined}
            loading={loading}
            error={error}
            onRetry={onRetry}
          >
            {children}
            <Announcer />
          </Provide>
        )}
      </table.Subscribe>
    </div>
  );
}

export interface DataTableOwnProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
> {
  /**
   * What goes above the table. Left out, it's the search field and the
   * column chooser, where the table has those features. `false` for
   * nothing.
   */
  toolbar?: ReactNode;
  /**
   * Actions for the selected rows. They show in a bar above the table
   * while anything is selected. As a function it's given the selected
   * rows that are loaded.
   */
  bulkActions?: ReactNode | ((rows: Row<TFeatures, TData>[]) => ReactNode);
  /**
   * What goes under the table. Left out, it's the pagination bar, where
   * the table has pages. `false` for nothing.
   */
  pagination?: ReactNode;
  /**
   * The choices for rows per page.
   * @default [10, 20, 50, 100]
   */
  pageSizes?: number[];
}

export type DataTableProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
> = DataTableRootOwnProps<TFeatures, TData> &
  DataTableContentOwnProps<TFeatures, TData> &
  DataTableOwnProps<TFeatures, TData> &
  DataTableName;

/**
 * A finished table from a TanStack table: headings that sort, rows, a
 * search field, a column chooser, checkboxes and a pagination bar, each
 * one there if the table was made with the feature for it.
 */
export function DataTable<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(props: DataTableProps<TFeatures, TData>) {
  return (
    <DataTableLayout
      {...props}
      content={(content) => <DataTableContent<TFeatures, TData> {...content} />}
    />
  );
}

// DataTable with the table itself left open, so the virtual one can put
// its own in.
export function DataTableLayout<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({
  content: renderContent,
  table,
  labels,
  rowHeader,
  getRowLabel,
  loading,
  error,
  onRetry,
  className,
  toolbar,
  bulkActions,
  pagination,
  pageSizes,
  ...content
}: DataTableProps<TFeatures, TData> & {
  content: (props: DataTableContentProps<TFeatures, TData>) => ReactNode;
}) {
  return (
    <DataTableRoot
      table={table}
      labels={labels}
      rowHeader={rowHeader}
      getRowLabel={getRowLabel}
      loading={loading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {toolbar === undefined ? <DataTableToolbar /> : toolbar}
      {bulkActions !== undefined ? (
        <DataTableBulkActions<TFeatures, TData>>
          {bulkActions}
        </DataTableBulkActions>
      ) : null}
      {renderContent(content)}
      {pagination === undefined ? (
        <DataTablePagination pageSizes={pageSizes} />
      ) : (
        pagination
      )}
    </DataTableRoot>
  );
}
