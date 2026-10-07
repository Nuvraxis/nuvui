"use client";

import { Button } from "@nuvui/react/button";
import { Checkbox } from "@nuvui/react/checkbox";
import type { Row, RowData, TableFeatures } from "@tanstack/react-table";
import {
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";
import { cx } from "../../utils/cx";
import { useShiftClick } from "../../utils/use-shift-click";
import {
  type AnyRow,
  canExpand,
  expanded,
  supports,
  useCell,
  useDataTableView,
} from "./context";

// Shift and a click selects the text between two clicks before it does
// anything else.
const keepText = (event: MouseEvent) => {
  if (event.shiftKey) event.preventDefault();
};

export interface DataTableSelectAllProps {
  className?: string;
}

/**
 * The checkbox in the heading of the selection column. In a table with
 * pages it selects the rows on the page. Without pages, all of them. It
 * shows a dash while some are selected and not all.
 */
export function DataTableSelectAll({ className }: DataTableSelectAllProps) {
  const { table, labels } = useDataTableView("DataTableSelectAll");
  if (!supports.selection(table)) return null;

  const paged = supports.pagination(table);
  const all = paged
    ? table.getIsAllPageRowsSelected()
    : table.getIsAllRowsSelected();
  const some = paged
    ? table.getIsSomePageRowsSelected()
    : table.getIsSomeRowsSelected();
  const none = table.getRowModel().rows.length === 0;

  return (
    <Checkbox
      className={className}
      data-nuv-select-all=""
      aria-label={paged ? labels.selectPage : labels.selectAll}
      disabled={none}
      // TanStack's "some" includes "all" since version 9.
      checked={all ? true : some ? "indeterminate" : false}
      onClick={() =>
        paged
          ? table.toggleAllPageRowsSelected(!all)
          : table.toggleAllRowsSelected(!all)
      }
    />
  );
}

export interface DataTableSelectRowProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's row
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's row
  TData extends RowData = any,
> {
  /** The row. Inside a column's `cell` it's found without being passed. */
  row?: Row<TFeatures, TData>;
  className?: string;
}

/**
 * A row's checkbox. Shift and a click selects every row from the last one
 * clicked to this one.
 */
export function DataTableSelectRow<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({ row: given, className }: DataTableSelectRowProps<TFeatures, TData>) {
  const { labels, rowName } = useDataTableView("DataTableSelectRow");
  const click = useShiftClick();
  const cell = useCell();
  const row = (given as AnyRow | undefined) ?? cell?.row;
  if (!row) {
    throw new Error(
      "DataTableSelectRow needs a row, or to be inside a column's cell.",
    );
  }
  if (typeof row.getIsSelected !== "function") return null;

  const checked = row.getIsSelected();
  return (
    <Checkbox
      className={className}
      aria-label={labels.selectRow(rowName(row))}
      disabled={!row.getCanSelect()}
      checked={
        checked ? true : row.getIsSomeSelected() ? "indeterminate" : false
      }
      onMouseDown={keepText}
      {...click.props}
      // TanStack's handler is written for a native checkbox and reads
      // event.target.checked. This one is a button, so it's handed what
      // the handler reads. Going through the handler, and not straight to
      // toggleSelected, is what makes Shift select a range.
      onClick={(event) =>
        row.getToggleSelectedHandler()({
          target: { checked: !checked },
          shiftKey: click.shift(event),
        })
      }
    />
  );
}

export interface DataTableExpandToggleProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's row
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's row
  TData extends RowData = any,
> {
  /** The row. Inside a column's `cell` it's found without being passed. */
  row?: Row<TFeatures, TData>;
  className?: string;
}

/**
 * The button that opens and closes a row: its detail panel, or the rows
 * under it. In a tree it's indented by how deep the row is, and a row with
 * nothing under it gets a gap of the same width, so the text after it
 * lines up.
 */
export function DataTableExpandToggle<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({ row: given, className }: DataTableExpandToggleProps<TFeatures, TData>) {
  const { labels, rowName } = useDataTableView("DataTableExpandToggle");
  const cell = useCell();
  const row = (given as AnyRow | undefined) ?? cell?.row;
  if (!row) {
    throw new Error(
      "DataTableExpandToggle needs a row, or to be inside a column's cell.",
    );
  }

  // How deep the row is in a tree. The stylesheet turns it into a margin.
  const indent = { "--nuv-data-table-depth": row.depth } as CSSProperties;
  if (!canExpand(row)) {
    return (
      <span
        className={cx("nuv-data-table__expand-gap", className)}
        style={indent}
      />
    );
  }

  const open = expanded(row);
  const name = rowName(row);
  return (
    <button
      type="button"
      className={cx("nuv-data-table__expand", className)}
      style={indent}
      aria-expanded={open}
      aria-label={open ? labels.collapseRow(name) : labels.expandRow(name)}
      onClick={row.getToggleExpandedHandler()}
    >
      <svg
        aria-hidden="true"
        className="nuv-data-table__expand-icon"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4l4 4-4 4" />
      </svg>
    </button>
  );
}

export interface DataTableBulkActionsProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The actions, usually buttons. As a function it's given the selected
   * rows that are loaded. With a server doing the paging those are only
   * the ones on this page: use `table.getSelectedRowIds()` for all of them.
   */
  children?: ReactNode | ((rows: Row<TFeatures, TData>[]) => ReactNode);
}

/**
 * A bar that's there while rows are selected. It says how many, holds the
 * actions you give it, and has a button that clears the selection.
 */
export function DataTableBulkActions<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({
  children,
  className,
  ...props
}: DataTableBulkActionsProps<TFeatures, TData>) {
  const { table, labels } = useDataTableView("DataTableBulkActions");
  const bar = useRef<HTMLDivElement>(null);
  const heldFocus = useRef(false);
  const available = supports.selection(table);
  const count = available ? table.getSelectedRowIds().length : 0;

  // The bar goes when the last row is deselected, often by a button inside
  // it. Focus would go with it and land on the page. It's sent to the
  // table's first checkbox, or to the table.
  useLayoutEffect(() => {
    if (count > 0 || !heldFocus.current) return;
    heldFocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const root = bar.current?.closest(".nuv-data-table");
    const target =
      root?.querySelector<HTMLElement>(
        "[data-nuv-select-all]:not(:disabled)",
      ) ?? root?.querySelector<HTMLElement>(".nuv-table-container");
    if (!target) return;
    if (!target.hasAttribute("tabindex") && target.tagName === "DIV") {
      target.setAttribute("tabindex", "-1");
    }
    target.focus();
  }, [count]);

  if (!available) return null;
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would need a legend on show
    <div
      ref={bar}
      role="group"
      aria-label={labels.bulkActions}
      className={cx("nuv-data-table__bulk", className)}
      hidden={count === 0}
      onFocus={() => {
        heldFocus.current = true;
      }}
      onBlur={(event) => {
        // Leaving for somewhere else on the page. When the bar is hidden
        // with focus in it there's no somewhere else, and the mark stays.
        if (event.relatedTarget) heldFocus.current = false;
      }}
      {...props}
    >
      {count > 0 ? (
        <>
          <span className="nuv-data-table__bulk-count">
            {labels.selected(count)}
          </span>
          <div className="nuv-data-table__bulk-actions">
            {typeof children === "function"
              ? children(
                  table.getSelectedRowModel().rows as unknown as Row<
                    TFeatures,
                    TData
                  >[],
                )
              : children}
          </div>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => table.resetRowSelection(true)}
          >
            {labels.clearSelection}
          </Button>
        </>
      ) : null}
    </div>
  );
}
