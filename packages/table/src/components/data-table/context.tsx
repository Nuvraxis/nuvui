"use client";

import {
  type AppReactTable,
  type Cell,
  type Column,
  createTableHookContexts,
  type Header,
  type ReactTable,
  type Row,
} from "@tanstack/react-table";
import { createContext, type ReactNode, useContext } from "react";
import type { DataTableLabels } from "./labels";

// biome-ignore lint/complexity/noBannedTypes: no registered components
type Empty = {};

// Inside the package a table is read as one with every feature. TanStack
// types a table by the features it was made with, and these components have
// to take any of them. Each use of a feature is behind a check that the
// feature is there: see `supports`.
// biome-ignore lint/suspicious/noExplicitAny: see above
export type AnyTable = ReactTable<any, any, any> &
  // On a table from the bound hook, and not on one from plain useTable.
  Partial<
    Pick<
      // biome-ignore lint/suspicious/noExplicitAny: see above
      AppReactTable<any, any, any, Empty, Empty, Empty>,
      "AppHeader" | "AppFooter" | "AppCell"
    >
  >;
// biome-ignore lint/suspicious/noExplicitAny: see above
export type AnyRow = Row<any, any>;
// biome-ignore lint/suspicious/noExplicitAny: see above
export type AnyColumn = Column<any, any, unknown>;
// biome-ignore lint/suspicious/noExplicitAny: see above
export type AnyHeader = Header<any, any, unknown>;
// biome-ignore lint/suspicious/noExplicitAny: see above
export type AnyCell = Cell<any, any, unknown>;

// TanStack's createTableHook has contexts of its own for the table, the
// header and the cell, and doesn't export them. These are passed to it in
// their place, so the components here can read what it provides.
// biome-ignore lint/suspicious/noExplicitAny: see above
export const tableContexts = createTableHookContexts<any>();

/**
 * What a column can say about itself for the controls. Register it with
 * `columnMeta: metaHelper<DataTableColumnMeta>()` in `tableFeatures` and
 * a column's `meta` is typed.
 */
export interface DataTableColumnMeta {
  /**
   * The column's name in the column chooser and for screen readers. A
   * column whose `header` is a string doesn't need one.
   */
  label?: string;
  /** Which side the column's cells and heading sit on. */
  align?: "start" | "center" | "end";
  /**
   * The column only holds a control, such as a checkbox. It's kept as
   * narrow as the control.
   */
  control?: boolean;
}

export interface DataTableView {
  table: AnyTable;
  labels: DataTableLabels;
  /** A name for a row, for the labels of its controls. */
  rowName: (row: AnyRow) => string;
  rowHeader: string | undefined;
  loading: boolean;
  error: ReactNode;
  onRetry: (() => void) | undefined;
}

export const ViewContext = createContext<DataTableView | null>(null);

export function useDataTableView(part: string): DataTableView {
  const view = useContext(ViewContext);
  if (!view) {
    throw new Error(`${part} has to be inside a DataTable or DataTableRoot.`);
  }
  return view;
}

export const useHeader = (): AnyHeader | null =>
  useContext(tableContexts.headerContext);
export const useCell = (): AnyCell | null =>
  useContext(tableContexts.cellContext);

const is = (value: unknown) => typeof value === "function";

// A feature's methods are only on a table that was made with the feature.
export const supports = {
  sorting: (table: AnyTable) => is(table.setSorting),
  columnFilters: (table: AnyTable) => is(table.setColumnFilters),
  globalFilter: (table: AnyTable) => is(table.setGlobalFilter),
  pagination: (table: AnyTable) => is(table.setPagination),
  selection: (table: AnyTable) => is(table.setRowSelection),
  visibility: (table: AnyTable) => is(table.setColumnVisibility),
  pinning: (table: AnyTable) => is(table.setColumnPinning),
  sizing: (table: AnyTable) => is(table.setColumnSizing),
  resizing: (table: AnyTable) => is(table.setColumnResizing),
  expanding: (table: AnyTable) => is(table.setExpanded),
};

export const columnMeta = (column: AnyColumn): DataTableColumnMeta =>
  (column.columnDef.meta as DataTableColumnMeta | undefined) ?? {};

export function columnLabel(column: AnyColumn): string {
  const { label } = columnMeta(column);
  if (label) return label;
  const { header } = column.columnDef;
  return typeof header === "string" && header ? header : column.id;
}

export const canSort = (column: AnyColumn) =>
  is(column.getCanSort) && column.getCanSort();
export const sorted = (column: AnyColumn) =>
  is(column.getIsSorted) ? column.getIsSorted() : false;
export const pinned = (column: AnyColumn) =>
  is(column.getIsPinned) ? column.getIsPinned() : false;
export const canResize = (column: AnyColumn) =>
  is(column.getCanResize) && is(column.getSize) && column.getCanResize();
export const canHide = (column: AnyColumn) =>
  is(column.getCanHide) && column.getCanHide();
export const canExpand = (row: AnyRow) =>
  is(row.getCanExpand) && row.getCanExpand();
export const expanded = (row: AnyRow) =>
  is(row.getIsExpanded) && row.getIsExpanded();
export const selected = (row: AnyRow) =>
  is(row.getIsSelected) && row.getIsSelected();

// The columns that are showing, in the order they're drawn: pinned to the
// start, then the rest, then pinned to the end. Read from the headers,
// which TanStack orders that way with or without the visibility feature.
// A row's own list of cells is only ordered when that feature is there.
export function leafColumns(table: AnyTable): AnyColumn[] {
  return table
    .getHeaderGroups()
    .flatMap((group) => group.headers)
    .filter((header) => header.subHeaders.length === 0)
    .map((header) => header.column);
}

export function anyFilter(table: AnyTable): boolean {
  const columnFilters = table.atoms.columnFilters?.get() ?? [];
  const globalFilter = table.atoms.globalFilter?.get();
  return (
    columnFilters.length > 0 || (globalFilter != null && globalFilter !== "")
  );
}
