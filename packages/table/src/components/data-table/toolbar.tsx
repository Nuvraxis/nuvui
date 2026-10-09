"use client";

import { Button } from "@nuvui/react/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@nuvui/react/dropdown-menu";
import { Input, type InputProps } from "@nuvui/react/input";
import type { Column, RowData, TableFeatures } from "@tanstack/react-table";
import { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { cx } from "../../utils/cx";
import {
  type AnyColumn,
  canHide,
  columnLabel,
  supports,
  useDataTableView,
  useHeader,
} from "./context";

// A text field that holds what's typed and passes it on after a pause.
// With no pause set, it passes every keystroke on at once.
function useDebounced(
  value: string,
  commit: (text: string) => void,
  debounce: number,
) {
  const [text, setText] = useState(value);
  const sent = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The filter can be changed from outside: cleared by a button, say.
  // What's typed and not sent yet is left alone otherwise.
  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (next: string) => {
    setText(next);
    clearTimeout(timer.current);
    const send = () => {
      sent.current = next;
      commit(next);
    };
    if (debounce > 0) timer.current = setTimeout(send, debounce);
    else send();
  };
  return [text, change] as const;
}

export interface DataTableFilterOwnProps {
  /**
   * How long to wait after the last keystroke before filtering, in
   * milliseconds. Set it when each change asks a server.
   * @default 0
   */
  debounce?: number;
}

export interface DataTableFilterProps
  extends DataTableFilterOwnProps,
    Omit<InputProps, "value" | "defaultValue" | "onChange" | "type"> {}

/**
 * A search field over every column that can be searched. It's the table's
 * global filter. It needs `globalFilteringFeature`, and shows nothing
 * without it.
 */
export function DataTableFilter({
  debounce = 0,
  className,
  ...props
}: DataTableFilterProps) {
  const { table, labels } = useDataTableView("DataTableFilter");
  const available = supports.globalFilter(table);
  const value = available ? String(table.atoms.globalFilter.get() ?? "") : "";
  const [text, change] = useDebounced(
    value,
    (next) => table.setGlobalFilter(next),
    debounce,
  );
  if (!available) return null;
  return (
    <Input
      type="search"
      aria-label={labels.search}
      placeholder={labels.search}
      className={cx("nuv-data-table__filter", className)}
      {...props}
      value={text}
      onChange={(event) => change(event.target.value)}
    />
  );
}

export interface DataTableColumnFilterProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's column
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's column
  TData extends RowData = any,
> extends Omit<InputProps, "value" | "defaultValue" | "onChange"> {
  /**
   * The column to filter. Inside a column's `header` it's found without
   * being passed.
   */
  // biome-ignore lint/suspicious/noExplicitAny: a column of any value
  column?: Column<TFeatures, TData, any>;
  /** @default 0 */
  debounce?: number;
}

/**
 * A text field that filters one column. For a filter that isn't text, such
 * as a select of statuses, use any control and call
 * `column.setFilterValue`.
 */
export function DataTableColumnFilter<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({
  column: given,
  debounce = 0,
  className,
  ...props
}: DataTableColumnFilterProps<TFeatures, TData>) {
  const { labels } = useDataTableView("DataTableColumnFilter");
  const header = useHeader();
  const column = (given as AnyColumn | undefined) ?? header?.column;
  if (!column) {
    throw new Error(
      "DataTableColumnFilter needs a column, or to be inside a column's header.",
    );
  }
  const available =
    typeof column.getCanFilter === "function" && column.getCanFilter();
  const value = available ? String(column.getFilterValue() ?? "") : "";
  const [text, change] = useDebounced(
    value,
    // An empty filter is taken off, so the column doesn't count as filtered.
    (next) => column.setFilterValue(next === "" ? undefined : next),
    debounce,
  );
  if (!available) return null;
  return (
    <Input
      type="search"
      aria-label={labels.filterColumn(columnLabel(column))}
      className={cx("nuv-data-table__column-filter", className)}
      {...props}
      value={text}
      onChange={(event) => change(event.target.value)}
    />
  );
}

export interface DataTableColumnChooserProps {
  className?: string;
}

/**
 * A button that opens a list of the columns, each with a tick that shows
 * or hides it. Columns with `enableHiding: false` aren't in the list. It
 * needs `columnVisibilityFeature`, and shows nothing without it.
 */
export function DataTableColumnChooser({
  className,
}: DataTableColumnChooserProps) {
  const { table, labels } = useDataTableView("DataTableColumnChooser");
  if (!supports.visibility(table)) return null;
  const columns = table.getAllLeafColumns().filter(canHide);
  if (columns.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          intent="secondary"
          size="sm"
          className={cx("nuv-data-table__chooser", className)}
        >
          {labels.columns}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(checked) => column.toggleVisibility(checked)}
            // The menu stays open, so several columns can be set in one go.
            onSelect={(event) => event.preventDefault()}
          >
            {columnLabel(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type DataTableToolbarProps = HTMLAttributes<HTMLDivElement>;

/**
 * The row of controls above the table. With no children it holds the
 * search field and the column chooser, each only if the table has the
 * feature for it, and is left out when it has neither.
 */
export function DataTableToolbar({
  className,
  children,
  ...props
}: DataTableToolbarProps) {
  const { table } = useDataTableView("DataTableToolbar");
  const standard =
    supports.globalFilter(table) ||
    (supports.visibility(table) && table.getAllLeafColumns().some(canHide));
  if (children == null && !standard) return null;
  return (
    <div className={cx("nuv-data-table__toolbar", className)} {...props}>
      {children ?? (
        <>
          <DataTableFilter />
          <span className="nuv-data-table__toolbar-gap" />
          <DataTableColumnChooser />
        </>
      )}
    </div>
  );
}
