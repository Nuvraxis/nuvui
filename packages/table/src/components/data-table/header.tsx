"use client";

import { useDirection } from "@nuvui/react/direction";
import type { Column, RowData, TableFeatures } from "@tanstack/react-table";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "../../utils/cx";
import { useShiftClick } from "../../utils/use-shift-click";
import {
  type AnyColumn,
  type AnyHeader,
  canSort,
  columnLabel,
  sorted,
  useDataTableView,
  useHeader,
} from "./context";

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  return (
    <svg
      aria-hidden="true"
      className="nuv-data-table__sort-icon"
      data-direction={direction || undefined}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Both arrows while there's no sort, and the one that applies after. */}
      {direction !== "desc" ? <path d="M5 6.5l3-3 3 3" /> : null}
      {direction !== "asc" ? <path d="M5 9.5l3 3 3-3" /> : null}
    </svg>
  );
}

export interface DataTableColumnHeaderProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's column
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's column
  TData extends RowData = any,
> {
  /**
   * The column this is the heading of. Inside a column's `header` it's
   * found without being passed.
   */
  // biome-ignore lint/suspicious/noExplicitAny: a column of any value
  column?: Column<TFeatures, TData, any>;
  /** The heading. Without it, the column's own label is used. */
  children?: ReactNode;
  className?: string;
}

/**
 * A column's heading. When the column can be sorted it's a button that
 * sorts by it: ascending, then descending, then not at all. Shift and a
 * click adds the column to a sort by several.
 *
 * A column whose `header` is a string gets this without asking.
 */
export function DataTableColumnHeader<
  TFeatures extends TableFeatures,
  TData extends RowData,
>({
  column: given,
  children,
  className,
}: DataTableColumnHeaderProps<TFeatures, TData>) {
  // Read so the button follows the table's state.
  useDataTableView("DataTableColumnHeader");
  const click = useShiftClick();
  const header = useHeader();
  const column = (given as AnyColumn | undefined) ?? header?.column;
  if (!column) {
    throw new Error(
      "DataTableColumnHeader needs a column, or to be inside a column's header.",
    );
  }
  const content = children ?? columnLabel(column);

  if (!canSort(column)) {
    return (
      <span className={cx("nuv-data-table__heading", className)}>
        {content}
      </span>
    );
  }

  const direction = sorted(column);
  const index = column.getSortIndex();
  const several = (column.table.atoms.sorting?.get().length ?? 0) > 1;
  return (
    <button
      type="button"
      className={cx("nuv-data-table__sort", className)}
      data-sorted={direction || undefined}
      {...click.props}
      // TanStack reads Shift from the event to decide between a new sort and
      // one more column in the sort. The event is handed on with the Shift
      // that was really held.
      onClick={(event) => {
        const shiftKey = click.shift(event);
        column.getToggleSortingHandler()?.(
          shiftKey === event.shiftKey ? event : { ...event, shiftKey },
        );
      }}
      // Shift and a click would otherwise select the text between this
      // heading and the last thing clicked.
      onMouseDown={(event) => {
        if (event.shiftKey) event.preventDefault();
      }}
    >
      <span className="nuv-data-table__heading">{content}</span>
      <SortIcon direction={direction} />
      {direction && several ? (
        <span className="nuv-data-table__sort-index" aria-hidden="true">
          {index + 1}
        </span>
      ) : null}
    </button>
  );
}

const step = 16;
const bigStep = 64;

/**
 * The grip at the edge of a heading that changes the column's width. The
 * data table puts one on every column that can be resized.
 */
export function DataTableResizeHandle({ header }: { header: AnyHeader }) {
  const { labels } = useDataTableView("DataTableResizeHandle");
  const direction = useDirection();
  const { column } = header;
  const size = column.getSize();
  const min = column.columnDef.minSize ?? 20;
  const max = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER;

  const resize = (next: number) =>
    column.table.setColumnSizing((old: Record<string, number>) => ({
      ...old,
      [column.id]: Math.min(Math.max(next, min), max),
    }));

  // TanStack's handler follows a mouse or a finger. The keyboard is ours.
  const onKeyDown = (event: KeyboardEvent) => {
    const amount = event.shiftKey ? bigStep : step;
    const wider = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const narrower = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === wider) resize(size + amount);
    else if (event.key === narrower) resize(size - amount);
    else if (event.key === "Home") resize(min);
    else if (event.key === "Enter") column.resetSize();
    else return;
    event.preventDefault();
  };

  const start = header.getResizeHandler();
  return (
    // biome-ignore lint/a11y/useSemanticElements: an hr can't be dragged
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={labels.resizeColumn(columnLabel(column))}
      aria-valuenow={Math.round(size)}
      aria-valuemin={min}
      aria-valuemax={max === Number.MAX_SAFE_INTEGER ? undefined : max}
      tabIndex={0}
      className="nuv-data-table__resize"
      data-resizing={column.getIsResizing() ? "" : undefined}
      onMouseDown={start}
      onTouchStart={start}
      onDoubleClick={() => column.resetSize()}
      onKeyDown={onKeyDown}
    />
  );
}
