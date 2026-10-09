"use client";

import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export type TableContainerProps = HTMLAttributes<HTMLDivElement>;

/**
 * The box a table scrolls in. A table wider than the box scrolls sideways
 * inside it and leaves the page alone.
 *
 * While there's something to scroll, the box takes keyboard focus, so the
 * arrow keys can scroll it. Give it `aria-label` or `aria-labelledby` and
 * it's a region with that name for screen readers.
 */
export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  function TableContainer({ className, tabIndex, role, ...props }, ref) {
    const element = useRef<HTMLDivElement | null>(null);
    const [scrollable, setScrollable] = useState(false);

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        element.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    useEffect(() => {
      const node = element.current;
      if (!node || typeof ResizeObserver === "undefined") return;
      const measure = () =>
        setScrollable(
          node.scrollWidth > node.clientWidth ||
            node.scrollHeight > node.clientHeight,
        );
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      // The table can grow without the box changing size.
      for (const child of node.children) observer.observe(child);
      measure();
      return () => observer.disconnect();
    }, []);

    const named = props["aria-label"] || props["aria-labelledby"];
    return (
      <div
        ref={setRef}
        className={cx("nuv-table-container", className)}
        tabIndex={tabIndex ?? (scrollable ? 0 : undefined)}
        role={role ?? (scrollable && named ? "region" : undefined)}
        data-scrollable={scrollable ? "" : undefined}
        {...props}
      />
    );
  },
);

// Stripes are asked for on the table and drawn on the rows of its body.
const StripedContext = createContext(false);

export interface TableOwnProps {
  /**
   * Shade every second row of the body.
   * @default false
   */
  striped?: boolean;
  /**
   * Keep the header row in view while the body scrolls under it. It sticks
   * to the top of the nearest thing that scrolls: a `TableContainer` with a
   * height, or the page.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * `"auto"` sizes each column to what's in it. `"fixed"` takes each
   * column's width from its first row or its `col`, and is what a table
   * with set column widths needs.
   * @default "auto"
   */
  layout?: "auto" | "fixed";
}

export interface TableProps
  extends TableOwnProps,
    TableHTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    striped = false,
    stickyHeader = false,
    layout = "auto",
    className,
    ...props
  },
  ref,
) {
  return (
    <StripedContext.Provider value={striped}>
      <table
        ref={ref}
        className={cx(
          "nuv-table",
          stickyHeader && "nuv-table--sticky-header",
          layout === "fixed" && "nuv-table--fixed",
          className,
        )}
        {...props}
      />
    </StripedContext.Provider>
  );
});

export interface TableCaptionOwnProps {
  /**
   * Keep the caption for screen readers and show nothing. For a table whose
   * heading is already on the page above it.
   * @default false
   */
  visuallyHidden?: boolean;
}

export interface TableCaptionProps
  extends TableCaptionOwnProps,
    HTMLAttributes<HTMLTableCaptionElement> {}

/** The table's name. A screen reader reads it when it reaches the table. */
export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(function TableCaption({ visuallyHidden = false, className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      className={cx(
        "nuv-table__caption",
        visuallyHidden && "nuv-table__caption--hidden",
        className,
      )}
      {...props}
    />
  );
});

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      ref={ref}
      className={cx("nuv-table__header", className)}
      {...props}
    />
  );
});

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody({ className, ...props }, ref) {
    const striped = useContext(StripedContext);
    return (
      <tbody
        ref={ref}
        className={cx(
          "nuv-table__body",
          striped && "nuv-table__body--striped",
          className,
        )}
        {...props}
      />
    );
  },
);

export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  TableFooterProps
>(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      className={cx("nuv-table__footer", className)}
      {...props}
    />
  );
});

export interface TableRowOwnProps {
  /**
   * Mark the row as picked. It gets the selected background and
   * `data-state="selected"`.
   * @default false
   */
  selected?: boolean;
}

export interface TableRowProps
  extends TableRowOwnProps,
    HTMLAttributes<HTMLTableRowElement> {}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ selected = false, className, ...props }, ref) {
    return (
      <tr
        ref={ref}
        className={cx("nuv-table__row", className)}
        data-state={selected ? "selected" : undefined}
        {...props}
      />
    );
  },
);

export interface TableCellOwnProps {
  /**
   * Which side the content sits on. `"end"` is for numbers, so their digits
   * line up.
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /**
   * Keep the cell in view while the table scrolls sideways. Do it for every
   * cell of the column, the header's too. With one pinned column a side
   * that's all there is to it. With more, each one after the first needs an
   * `inset-inline-start` or `inset-inline-end` of its own.
   */
  pinned?: "start" | "end";
  /**
   * Draw the line that separates pinned columns from the ones that scroll.
   * For the last column pinned to the start and the first pinned to the end.
   * @default false
   */
  pinnedEdge?: boolean;
}

const cellClasses = (
  block: string,
  { align, pinned, pinnedEdge }: TableCellOwnProps,
) => [
  align && align !== "start" && `${block}--align-${align}`,
  pinned && `${block}--pinned-${pinned}`,
  pinned && pinnedEdge && `${block}--pinned-edge`,
];

export interface TableHeadProps
  extends TableCellOwnProps,
    Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> {}

/**
 * A column's heading. It's a `th` with `scope="col"`, which is what ties
 * every cell below it to its heading for a screen reader.
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead(
    { align, pinned, pinnedEdge, scope = "col", className, ...props },
    ref,
  ) {
    return (
      <th
        ref={ref}
        scope={scope}
        className={cx(
          "nuv-table__head",
          ...cellClasses("nuv-table__head", { align, pinned, pinnedEdge }),
          className,
        )}
        {...props}
      />
    );
  },
);

export interface TableCellProps
  extends TableCellOwnProps,
    Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> {
  /**
   * Make this cell the heading of its row: a `th` with `scope="row"`. Do it
   * for the cell that names the row, such as a person's name, and a screen
   * reader reads it with every other cell in the row.
   * @default false
   */
  rowHeader?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell(
    { align, pinned, pinnedEdge, rowHeader = false, className, ...props },
    ref,
  ) {
    const classes = cx(
      "nuv-table__cell",
      rowHeader && "nuv-table__cell--row-header",
      ...cellClasses("nuv-table__cell", { align, pinned, pinnedEdge }),
      className,
    );
    return rowHeader ? (
      <th ref={ref} scope="row" className={classes} {...props} />
    ) : (
      <td ref={ref} className={classes} {...props} />
    );
  },
);
