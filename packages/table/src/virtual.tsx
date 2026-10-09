"use client";

// The virtual table is an entry of its own because it needs
// @tanstack/react-virtual, which is an optional peer. An app that doesn't
// use this entry doesn't need that package installed.
import type { RowData, TableFeatures } from "@tanstack/react-table";
import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
} from "@tanstack/react-virtual";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  ContentFrame,
  type DataTableContentOwnProps,
  type DataTableName,
  type RowRenderOptions,
} from "./components/data-table/content";
import { type AnyRow, useDataTableView } from "./components/data-table/context";
import {
  DataTableLayout,
  type DataTableProps,
} from "./components/data-table/data-table";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface DataTableVirtualOwnProps {
  /**
   * How tall the table may get before its rows scroll. A number is pixels.
   * The window of rows is cut to this, so it has to be set.
   * @default 480
   */
  height?: number | string;
  /**
   * A guess at a row's height in pixels, used for rows that haven't been
   * drawn yet. Each row is measured when it is.
   * @default 40
   */
  estimateRowHeight?: number;
  /**
   * How many rows to draw beyond each edge of what's in view.
   * @default 10
   */
  overscan?: number;
}

export type DataTableVirtualContentProps<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
> = DataTableContentOwnProps<TFeatures, TData> &
  DataTableVirtualOwnProps &
  DataTableName;

function Spacer({ height, columns }: { height: number; columns: number }) {
  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: a row can't take focus
    <tr aria-hidden="true" className="nuv-data-table__spacer">
      <td
        colSpan={columns}
        style={{ blockSize: height, padding: 0, border: 0 }}
      />
    </tr>
  );
}

function VirtualRows({
  rows,
  renderRow,
  headerRows,
  container,
  estimateRowHeight,
  overscan,
}: {
  rows: AnyRow[];
  renderRow: (row: AnyRow, options?: RowRenderOptions) => ReactNode;
  headerRows: number;
  container: HTMLDivElement | null;
  estimateRowHeight: number;
  overscan: number;
}) {
  const { table } = useDataTableView("DataTableVirtualContent");
  const [headerHeight, setHeaderHeight] = useState(0);

  // The row that holds keyboard focus stays in the page when it scrolls out
  // of view. Taken out, focus would fall to the page, and the next Tab
  // would start from the top of the document. Where focus is gets read at
  // the moment the window of rows moves, which is the only moment a row
  // can be dropped.
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      const active =
        typeof document === "undefined" ? null : document.activeElement;
      if (!active || !container?.contains(active)) return indexes;
      const row = active.closest("tr[data-index]");
      const focused = row ? Number(row.getAttribute("data-index")) : -1;
      if (focused < 0 || focused >= range.count || indexes.includes(focused)) {
        return indexes;
      }
      return [...indexes, focused].sort((a, b) => a - b);
    },
    [container],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => container,
    estimateSize: () => estimateRowHeight,
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan,
    rangeExtractor,
    // The rows start under the header, not at the top of the box.
    scrollMargin: headerHeight,
    // An open row's panel is a row of its own right after it. It counts
    // toward the height of the row it belongs to.
    // Whole pixels, as the virtualizer's own measuring gives. A height that's
    // a fraction off the guess counts as a change, and each change behind
    // the view moves the scroll position to make up for it. With every row
    // doing that as it's first drawn, a key press that scrolls somewhere
    // else can be undone a moment later.
    measureElement: (element) => {
      const panel = element.nextElementSibling;
      const extra = panel?.classList.contains("nuv-data-table__detail-row")
        ? (panel as HTMLElement).offsetHeight
        : 0;
      return (element as HTMLElement).offsetHeight + extra;
    },
  });

  useIsomorphicLayoutEffect(() => {
    const head = container?.querySelector("thead");
    if (!head) return;
    const measure = () => setHeaderHeight(head.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(head);
    return () => observer.disconnect();
  }, [container]);

  // Opening or closing a row's panel changes its height without the row
  // itself changing size, so nothing would measure it again.
  const open = table.atoms.expanded?.get();
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when a panel opens or closes
  useEffect(() => {
    const box = container;
    if (!box) return;
    for (const row of box.querySelectorAll("tr[data-index]")) {
      virtualizer.measureElement(row);
    }
  }, [open]);

  const items = virtualizer.getVirtualItems();
  // More than any table has. A cell can span more columns than there are.
  const span = 1000;
  const total = virtualizer.getTotalSize();

  // The rows are in the page in their usual flow, with an empty row standing
  // in for each run that isn't drawn. That keeps them real table rows, with
  // the columns lined up by the browser.
  const parts: ReactNode[] = [];
  let end = headerHeight;
  for (const item of items) {
    const row = rows[item.index];
    if (!row) continue;
    if (item.start > end) {
      parts.push(
        <Spacer
          key={`gap-${item.index}`}
          height={item.start - end}
          columns={span}
        />,
      );
    }
    parts.push(
      renderRow(row, {
        rowProps: {
          ref: virtualizer.measureElement,
          "data-index": item.index,
          "aria-rowindex": headerRows + item.index + 1,
        },
      }),
    );
    end = item.end;
  }
  const rest = total + headerHeight - end;
  if (rest > 0) {
    parts.push(<Spacer key="gap-end" height={rest} columns={span} />);
  }
  return parts;
}

/**
 * The table with only the rows in view drawn, for thousands of rows at
 * once. It takes what `DataTableContent` takes, and a height to scroll in.
 * The header stays in view unless `stickyHeader` is `false`.
 *
 * A screen reader is told how many rows there are and where each one is,
 * since it can't count the ones that aren't in the page.
 */
export function DataTableVirtualContent<
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TFeatures extends TableFeatures = any,
  // biome-ignore lint/suspicious/noExplicitAny: any table's rows
  TData extends RowData = any,
>({
  height = 480,
  estimateRowHeight = 40,
  overscan = 10,
  stickyHeader = true,
  ...props
}: DataTableVirtualContentProps<TFeatures, TData>) {
  const { table } = useDataTableView("DataTableVirtualContent");
  // In state and not a ref: the rows are drawn inside the box, so their
  // effects run before a ref to it is set, and would find nothing to
  // watch scroll. Setting state draws them again once the box is there.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const headerRows = table.getHeaderGroups().length;
  return (
    <ContentFrame
      {...(props as DataTableVirtualContentProps)}
      stickyHeader={stickyHeader}
      containerRef={setContainer}
      containerProps={{ style: { maxBlockSize: height } }}
      tableProps={{
        "aria-rowcount": headerRows + table.getRowModel().rows.length,
      }}
    >
      {(rows, renderRow) => (
        <VirtualRows
          rows={rows}
          renderRow={renderRow}
          headerRows={headerRows}
          container={container}
          estimateRowHeight={estimateRowHeight}
          overscan={overscan}
        />
      )}
    </ContentFrame>
  );
}

export type DataTableVirtualProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
> = DataTableProps<TFeatures, TData> & DataTableVirtualOwnProps;

/**
 * `DataTable` with only the rows in view drawn. Use it for a table of
 * thousands of rows that are all loaded. It usually goes without
 * pagination: leave `rowPaginationFeature` out, or pass
 * `pagination={false}`.
 */
export function DataTableVirtual<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(props: DataTableVirtualProps<TFeatures, TData>) {
  return (
    <DataTableLayout
      {...props}
      content={(content) => (
        <DataTableVirtualContent<TFeatures, TData>
          {...(content as DataTableVirtualContentProps<TFeatures, TData>)}
        />
      )}
    />
  );
}
