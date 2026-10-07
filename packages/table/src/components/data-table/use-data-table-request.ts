"use client";

import {
  type ColumnFiltersState,
  functionalUpdate,
  type PaginationState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

/** What a server is asked for: which page, in what order, filtered how. */
export interface DataTableRequest {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

export interface DataTableRequestOptions {
  state: DataTableRequest;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  onSortingChange: (updater: Updater<SortingState>) => void;
  onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => void;
  onGlobalFilterChange: (updater: Updater<string>) => void;
  manualPagination: true;
  manualSorting: true;
  manualFiltering: true;
}

const firstPage = (request: DataTableRequest): DataTableRequest => ({
  ...request,
  pagination: { ...request.pagination, pageIndex: 0 },
});

/**
 * For a table whose sorting, filtering and paging are done by a server.
 *
 * It holds what the table is asking for, and returns it with the options
 * that make the table ask and not do the work itself. Spread the options
 * into `useDataTable`, fetch with the request, and pass the rows you get
 * back as `data` with the total as `rowCount`.
 *
 * A new sort or filter goes back to the first page. TanStack does that
 * itself when it does the paging, and not when a server does.
 *
 * @example
 * const [request, options] = useDataTableRequest({
 *   pagination: { pageIndex: 0, pageSize: 20 },
 * });
 * const page = useQuery({ queryKey: ["people", request], ... });
 * const table = useDataTable({
 *   columns,
 *   data: page.data?.rows ?? none,
 *   rowCount: page.data?.total,
 *   ...options,
 * });
 */
export function useDataTableRequest(
  initial: Partial<DataTableRequest> = {},
): [request: DataTableRequest, options: DataTableRequestOptions] {
  const [request, setRequest] = useState<DataTableRequest>(() => ({
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [],
    columnFilters: [],
    globalFilter: "",
    ...initial,
  }));

  const handlers = useMemo(
    () => ({
      onPaginationChange: (updater: Updater<PaginationState>) =>
        setRequest((old) => ({
          ...old,
          pagination: functionalUpdate(updater, old.pagination),
        })),
      onSortingChange: (updater: Updater<SortingState>) =>
        setRequest((old) =>
          firstPage({
            ...old,
            sorting: functionalUpdate(updater, old.sorting),
          }),
        ),
      onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) =>
        setRequest((old) =>
          firstPage({
            ...old,
            columnFilters: functionalUpdate(updater, old.columnFilters),
          }),
        ),
      onGlobalFilterChange: (updater: Updater<string>) =>
        setRequest((old) =>
          firstPage({
            ...old,
            globalFilter: functionalUpdate(updater, old.globalFilter) ?? "",
          }),
        ),
      manualPagination: true as const,
      manualSorting: true as const,
      manualFiltering: true as const,
    }),
    [],
  );

  return [request, { state: request, ...handlers }];
}
