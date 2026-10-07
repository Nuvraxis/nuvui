"use client";

import { Button } from "@nuvui/react/button";
import { Skeleton } from "@nuvui/react/skeleton";
import type { Row, RowData, TableFeatures } from "@tanstack/react-table";
import {
  type CSSProperties,
  Fragment,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import { cx } from "../../utils/cx";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import {
  type AnyColumn,
  type AnyHeader,
  type AnyRow,
  type AnyTable,
  anyFilter,
  canResize,
  columnLabel,
  columnMeta,
  expanded,
  leafColumns,
  pinned,
  selected,
  sorted,
  supports,
  tableContexts,
  useDataTableView,
} from "./context";
import { DataTableColumnHeader, DataTableResizeHandle } from "./header";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** A table has to have a name. One of these gives it one. */
export type DataTableName =
  | {
      /** The table's name, shown under it. */
      caption: ReactNode;
      "aria-label"?: undefined;
      "aria-labelledby"?: undefined;
    }
  | { caption?: undefined; "aria-label": string; "aria-labelledby"?: undefined }
  | {
      caption?: undefined;
      "aria-label"?: undefined;
      /** The id of a heading that's already on the page. */
      "aria-labelledby": string;
    };

export interface DataTableContentOwnProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
> {
  /**
   * Keep the caption for screen readers and show nothing.
   * @default false
   */
  captionHidden?: boolean;
  /**
   * Keep the header row in view while the rows scroll. Give the table a
   * height to scroll in with `--nuv-table-container-max-height`.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Shade every second row.
   * @default false
   */
  striped?: boolean;
  /**
   * `"auto"` sizes each column to what's in it. `"fixed"` gives each column
   * the width TanStack holds for it, which needs `columnSizingFeature`, and
   * puts a grip on every column that can be resized.
   * @default "auto"
   */
  layout?: "auto" | "fixed";
  /**
   * What a row shows under itself when it's open. With this set, a row can
   * be opened if `getRowCanExpand` says so.
   */
  renderDetail?: (row: Row<TFeatures, TData>) => ReactNode;
  /** Shown in place of rows when there are none. */
  empty?: ReactNode;
  /**
   * How many placeholder rows to show while the first rows load.
   * @default the page size, up to 10
   */
  loadingRows?: number;
  className?: string;
}

export type DataTableContentProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
> = DataTableContentOwnProps<TFeatures, TData> & DataTableName;

interface Pin {
  side: "start" | "end";
  index: number;
  edge: boolean;
}

// Where each pinned column sits among the pinned columns on its side,
// counted from that side's edge of the table.
function pins(columns: AnyColumn[]): Map<string, Pin> {
  const result = new Map<string, Pin>();
  const start = columns.filter((column) => pinned(column) === "start");
  const end = columns.filter((column) => pinned(column) === "end").reverse();
  start.forEach((column, index) => {
    result.set(column.id, {
      side: "start",
      index,
      edge: index === start.length - 1,
    });
  });
  end.forEach((column, index) => {
    result.set(column.id, {
      side: "end",
      index,
      edge: index === end.length - 1,
    });
  });
  return result;
}

// A group of columns sticks where its outermost column does: its first when
// pinned to the start, its last when pinned to the end.
function headerPin(column: AnyColumn, pinMap: Map<string, Pin>) {
  const leaves = column.getLeafColumns();
  const first = pinMap.get(leaves[0]?.id ?? "");
  if (first?.side !== "end") return first;
  return pinMap.get(leaves[leaves.length - 1]?.id ?? "");
}

const pinStyle = (pin: Pin | undefined): CSSProperties | undefined =>
  pin
    ? {
        [pin.side === "start" ? "insetInlineStart" : "insetInlineEnd"]:
          `var(--nuv-data-table-pin-${pin.side}-${pin.index}, 0px)`,
      }
    : undefined;

// A pinned column sticks at the combined width of the pinned columns before
// it. Those widths are whatever the browser laid out, so they're measured,
// and measured again when one changes. They're written to the table as
// custom properties: no cell is rendered again for it.
function usePinOffsets(table: RefObject<HTMLTableElement | null>, key: string) {
  useIsomorphicLayoutEffect(() => {
    const element = table.current;
    if (!element || !key) return;
    const cells = [
      ...element.querySelectorAll<HTMLElement>("thead [data-pin]"),
    ];
    const measure = () => {
      for (const side of ["start", "end"]) {
        const ordered = cells
          .filter((cell) => cell.dataset.pin === side)
          .sort(
            (a, b) => Number(a.dataset.pinIndex) - Number(b.dataset.pinIndex),
          );
        let offset = 0;
        for (const cell of ordered) {
          element.style.setProperty(
            `--nuv-data-table-pin-${side}-${cell.dataset.pinIndex}`,
            `${offset}px`,
          );
          offset += cell.getBoundingClientRect().width;
        }
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    for (const cell of cells) observer.observe(cell);
    return () => observer.disconnect();
  }, [key]);
}

const ariaSort = (column: AnyColumn) => {
  const direction = sorted(column);
  // One column at a time may say it's the sort. With several, it's the first.
  if (!direction || column.getSortIndex() > 0) return undefined;
  return direction === "asc" ? "ascending" : "descending";
};

function HeaderCell({
  header,
  table,
  pin,
  resizable,
  footer = false,
}: {
  header: AnyHeader;
  table: AnyTable;
  pin: Pin | undefined;
  resizable: boolean;
  footer?: boolean;
}) {
  const { column } = header;
  const leaf = column.columns.length === 0;
  const meta = columnMeta(column);
  const template = footer ? column.columnDef.footer : column.columnDef.header;

  let content: ReactNode = null;
  if (footer) {
    content = header.isPlaceholder ? null : (
      <table.FlexRender footer={header} />
    );
  } else if (typeof template === "string") {
    content = template ? (
      <DataTableColumnHeader column={column}>{template}</DataTableColumnHeader>
    ) : null;
  } else if (template) {
    content = <table.FlexRender header={header} />;
  }

  const shared = {
    colSpan: header.colSpan > 1 ? header.colSpan : undefined,
    align: meta.align,
    pinned: pin?.side,
    pinnedEdge: pin?.edge,
    style: pinStyle(pin),
  };

  let cell: ReactNode;
  if (footer) {
    cell = <TableCell {...shared}>{content}</TableCell>;
  } else if (content === null || meta.control) {
    // A heading with no text, or one that's only a checkbox, isn't the
    // heading of anything. As a th, a screen reader would read every cell
    // under it with an empty name in front.
    cell = (
      <TableCell
        {...shared}
        rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
        className={cx(
          "nuv-table__head",
          meta.control && "nuv-data-table__cell--control",
        )}
        data-pin={leaf ? pin?.side : undefined}
        data-pin-index={leaf ? pin?.index : undefined}
      >
        {content}
      </TableCell>
    );
  } else {
    const handle = leaf && resizable && canResize(column);
    cell = (
      <TableHead
        {...shared}
        rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
        aria-sort={leaf ? ariaSort(column) : undefined}
        // The grip has a name of its own, and a heading is named by what's
        // in it. Left alone, every cell under this one would be read out
        // as "Name Resize Name".
        aria-label={handle ? columnLabel(column) : undefined}
        // A pinned heading is already positioned, which is all the grip needs.
        className={cx(handle && !pin && "nuv-data-table__head--resizable")}
        data-pin={leaf ? pin?.side : undefined}
        data-pin-index={leaf ? pin?.index : undefined}
      >
        {content}
        {handle ? <DataTableResizeHandle header={header} /> : null}
      </TableHead>
    );
  }

  // A table from the bound hook has TanStack's own wrapper, which also
  // hands the registered components to the column's `header`.
  if (table.AppHeader) {
    const Wrapper = (footer && table.AppFooter) || table.AppHeader;
    return <Wrapper header={header}>{() => cell}</Wrapper>;
  }
  return (
    <tableContexts.headerContext.Provider value={header}>
      {cell}
    </tableContexts.headerContext.Provider>
  );
}

function BodyCell({
  row,
  column,
  table,
  pin,
  rowHeader,
}: {
  row: AnyRow;
  column: AnyColumn;
  table: AnyTable;
  pin: Pin | undefined;
  rowHeader: boolean;
}) {
  const cell = row.getAllCellsByColumnId()[column.id];
  if (!cell) return null;
  const meta = columnMeta(column);
  const element = (
    <TableCell
      rowHeader={rowHeader}
      align={meta.align}
      pinned={pin?.side}
      pinnedEdge={pin?.edge}
      style={pinStyle(pin)}
      className={cx(meta.control && "nuv-data-table__cell--control")}
    >
      <table.FlexRender cell={cell} />
    </TableCell>
  );
  if (table.AppCell) {
    return <table.AppCell cell={cell}>{() => element}</table.AppCell>;
  }
  return (
    <tableContexts.cellContext.Provider value={cell}>
      {element}
    </tableContexts.cellContext.Provider>
  );
}

export interface RowRenderOptions {
  /** Attributes for the row's own `tr`. */
  rowProps?: HTMLAttributes<HTMLTableRowElement> & {
    ref?: (element: HTMLTableRowElement | null) => void;
    "data-index"?: number;
    "aria-rowindex"?: number;
  };
}

/**
 * What the two tables share: the box, the headings, the footer, and what's
 * shown when there are no rows. The rows themselves are drawn by `children`,
 * which is where a plain table and a virtual one differ.
 */
export function ContentFrame({
  caption,
  captionHidden = false,
  stickyHeader = false,
  striped = false,
  layout = "auto",
  renderDetail,
  empty,
  loadingRows,
  className,
  containerRef,
  containerProps,
  tableProps,
  children,
  ...name
}: DataTableContentOwnProps & {
  caption?: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  containerRef?: Ref<HTMLDivElement>;
  containerProps?: HTMLAttributes<HTMLDivElement>;
  tableProps?: HTMLAttributes<HTMLTableElement> & { "aria-rowcount"?: number };
  children: (
    rows: AnyRow[],
    renderRow: (row: AnyRow, options?: RowRenderOptions) => ReactNode,
    headerRows: number,
  ) => ReactNode;
}) {
  const { table, labels, rowHeader, loading, error, onRetry } =
    useDataTableView("DataTableContent");
  const element = useRef<HTMLTableElement>(null);
  const captionId = useId();

  const headerGroups = table.getHeaderGroups();
  const columns = leafColumns(table);
  const pinMap = supports.pinning(table)
    ? pins(columns)
    : new Map<string, Pin>();
  usePinOffsets(
    element,
    [...pinMap].map(([id, pin]) => `${id}:${pin.side}`).join(","),
  );

  const sized = layout === "fixed" && supports.sizing(table);
  const resizable = sized && supports.resizing(table);
  const rows = table.getRowModel().rows;
  const hasFooter = table
    .getAllLeafColumns()
    .some((column) => column.columnDef.footer);

  const renderRow = (row: AnyRow, options: RowRenderOptions = {}) => {
    const open = renderDetail !== undefined && expanded(row);
    // One keyed piece per row. As a bare pair, a row would be told apart by
    // its place in the list, and be made again whenever a row before it
    // came or went: focus inside it would be lost.
    return (
      <Fragment key={row.id}>
        <TableRow selected={selected(row)} {...options.rowProps}>
          {columns.map((column) => (
            <BodyCell
              key={column.id}
              row={row}
              column={column}
              table={table}
              pin={pinMap.get(column.id)}
              rowHeader={column.id === rowHeader}
            />
          ))}
        </TableRow>
        {open ? (
          <TableRow className="nuv-data-table__detail-row">
            <TableCell
              colSpan={columns.length}
              className="nuv-data-table__detail"
            >
              {renderDetail(row)}
            </TableCell>
          </TableRow>
        ) : null}
      </Fragment>
    );
  };

  // One cell across the whole table, for what's said in place of rows.
  const message = (content: ReactNode, alert = false) => (
    <TableRow className="nuv-data-table__message-row">
      <TableCell
        colSpan={columns.length}
        className="nuv-data-table__message"
        role={alert ? "alert" : undefined}
      >
        {content}
      </TableCell>
    </TableRow>
  );

  let body: ReactNode;
  if (error) {
    body = message(
      <>
        <span>{error === true ? labels.error : error}</span>
        {onRetry ? (
          <Button intent="secondary" size="sm" onClick={onRetry}>
            {labels.retry}
          </Button>
        ) : null}
      </>,
      true,
    );
  } else if (rows.length > 0) {
    body = children(rows, renderRow, headerGroups.length);
  } else if (loading) {
    const pageSize = table.atoms.pagination?.get().pageSize;
    const count = loadingRows ?? Math.min(pageSize ?? 5, 10);
    body = Array.from({ length: count }, (_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have nothing else
      <TableRow key={index} className="nuv-data-table__loading-row">
        {columns.map((column) => (
          <TableCell
            key={column.id}
            className={cx(
              columnMeta(column).control && "nuv-data-table__cell--control",
            )}
          >
            <Skeleton shape="text" />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (anyFilter(table)) {
    body = message(
      <>
        <span>{labels.noMatches}</span>
        <Button
          intent="secondary"
          size="sm"
          onClick={() => {
            if (supports.columnFilters(table)) table.resetColumnFilters(true);
            if (supports.globalFilter(table)) table.setGlobalFilter("");
          }}
        >
          {labels.clearFilters}
        </Button>
      </>,
    );
  } else {
    body = message(empty ?? labels.empty);
  }

  const labelledBy = caption != null ? captionId : name["aria-labelledby"];
  return (
    <TableContainer
      ref={containerRef}
      aria-label={name["aria-label"]}
      aria-labelledby={labelledBy}
      {...containerProps}
      className={cx(
        "nuv-data-table__container",
        className,
        containerProps?.className,
      )}
    >
      <Table
        ref={element}
        stickyHeader={stickyHeader}
        striped={striped}
        layout={layout}
        aria-label={name["aria-label"]}
        aria-labelledby={caption != null ? undefined : name["aria-labelledby"]}
        aria-busy={loading || undefined}
        // In a fixed layout the table is exactly as wide as its columns add
        // up to. Stretched to fill the box, every column would be wider
        // than the width a resize just gave it.
        style={sized ? { inlineSize: table.getTotalSize() } : undefined}
        {...tableProps}
      >
        {caption != null ? (
          <TableCaption id={captionId} visuallyHidden={captionHidden}>
            {caption}
          </TableCaption>
        ) : null}
        {sized ? (
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={{ inlineSize: column.getSize() }} />
            ))}
          </colgroup>
        ) : null}
        <TableHeader>
          {headerGroups.map((group, index) => (
            <TableRow
              key={group.id}
              // Rows are only numbered where some aren't in the page.
              aria-rowindex={
                tableProps?.["aria-rowcount"] !== undefined
                  ? index + 1
                  : undefined
              }
            >
              {group.headers.map((header) =>
                // A column with no group above it is one cell as tall as
                // the header. TanStack marks the cells it covers with 0.
                header.rowSpan === 0 ? null : (
                  <HeaderCell
                    key={header.id}
                    header={header}
                    table={table}
                    pin={headerPin(header.column, pinMap)}
                    resizable={resizable}
                  />
                ),
              )}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>{body}</TableBody>
        {hasFooter ? (
          <TableFooter>
            <TableRow>
              {(table.getFooterGroups()[0]?.headers ?? []).map((header) => (
                <HeaderCell
                  key={header.id}
                  header={header}
                  table={table}
                  pin={pinMap.get(header.column.id)}
                  resizable={false}
                  footer
                />
              ))}
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </TableContainer>
  );
}

/**
 * The table itself: the headings, the rows, and what's shown when there
 * are no rows. `DataTable` puts this between the toolbar and the
 * pagination bar. Use it yourself, inside `DataTableRoot`, to lay those
 * out differently.
 */
export function DataTableContent<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
>(props: DataTableContentProps<TFeatures, TData>) {
  return (
    <ContentFrame {...(props as DataTableContentProps)}>
      {(rows, renderRow) => rows.map((row) => renderRow(row))}
    </ContentFrame>
  );
}
