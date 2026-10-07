"use client";

// A hook with every feature this package has controls for, ready to use.
// It's an entry of its own, and not in the package's main one, because it
// pulls all nine features into a bundle. An app that uses fewer makes its
// own with createDataTableHook.
import {
  columnFilteringFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_includesString,
  filterFn_inDateRange,
  filterFn_inNumberRange,
  filterFn_weakEquals,
  globalFilteringFeature,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import type { DataTableColumnMeta } from "./components/data-table/context";
import { createDataTableHook } from "./components/data-table/create-data-table-hook";

/**
 * Sorting, column filters, a global filter, pagination, row selection,
 * column visibility, column pinning, column sizing with resizing, and
 * expanding rows. The sort and filter functions are the ones TanStack picks
 * by itself from a column's values.
 */
export const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
    inDateRange: filterFn_inDateRange,
    equals: filterFn_equals,
    weakEquals: filterFn_weakEquals,
    arrIncludes: filterFn_arrIncludes,
  },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
    basic: sortFn_basic,
  },
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnPinningFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export const {
  useDataTable,
  createColumnHelper,
  useTableContext,
  useHeaderContext,
  useCellContext,
} = createDataTableHook({ features });
