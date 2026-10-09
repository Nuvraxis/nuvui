/**
 * Every piece of text the data table writes itself. Pass the ones you want
 * to change, or all of them in another language, as `labels`.
 */
export interface DataTableLabels {
  /** The search field's name and placeholder. */
  search: string;
  /** The column chooser's button. */
  columns: string;
  /** Shown in place of rows when there are none. */
  empty: string;
  /** Shown in place of rows when a filter leaves none. */
  noMatches: string;
  clearFilters: string;
  /** Shown when `error` is `true` and not a message of your own. */
  error: string;
  retry: string;
  selectAll: string;
  /** The header checkbox of a table with pages. */
  selectPage: string;
  selectRow: (row: string) => string;
  /** A row's name when it has no `rowHeader` column: its place in the list. */
  rowName: (position: number) => string;
  expandRow: (row: string) => string;
  collapseRow: (row: string) => string;
  selected: (count: number) => string;
  clearSelection: string;
  /** The name of the bar that holds the actions for selected rows. */
  bulkActions: string;
  pagination: string;
  rowsPerPage: string;
  /** "21-40 of 143". */
  pageRange: (from: number, to: number, total: number) => string;
  page: (page: number, pages: number) => string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  resizeColumn: (column: string) => string;
  filterColumn: (column: string) => string;
  /** Read out after a sort. */
  sortedAscending: (column: string) => string;
  sortedDescending: (column: string) => string;
  sortCleared: string;
  /** Read out after a filter changes how many rows there are. */
  results: (count: number) => string;
}

export const defaultLabels: DataTableLabels = {
  search: "Search",
  columns: "Columns",
  empty: "No rows.",
  noMatches: "No rows match.",
  clearFilters: "Clear filters",
  error: "The rows couldn't be loaded.",
  retry: "Try again",
  selectAll: "Select all rows",
  selectPage: "Select all rows on this page",
  selectRow: (row) => `Select ${row}`,
  rowName: (position) => `row ${position}`,
  expandRow: (row) => `Show details for ${row}`,
  collapseRow: (row) => `Hide details for ${row}`,
  selected: (count) => `${count} selected`,
  clearSelection: "Clear selection",
  bulkActions: "Selected rows",
  pagination: "Pagination",
  rowsPerPage: "Rows per page",
  pageRange: (from, to, total) =>
    total === 0 ? "0 of 0" : `${from}–${to} of ${total}`,
  page: (page, pages) => `Page ${page} of ${pages}`,
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  resizeColumn: (column) => `Resize ${column}`,
  filterColumn: (column) => `Filter ${column}`,
  sortedAscending: (column) => `Sorted by ${column}, ascending`,
  sortedDescending: (column) => `Sorted by ${column}, descending`,
  sortCleared: "Sorting cleared",
  results: (count) => (count === 1 ? "1 row" : `${count} rows`),
};
