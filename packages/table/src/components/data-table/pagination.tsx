"use client";

import { Button } from "@nuvui/react/button";
import { NativeSelect } from "@nuvui/react/native-select";
import { type HTMLAttributes, type ReactNode, useId } from "react";
import { cx } from "../../utils/cx";
import { supports, useDataTableView } from "./context";

const paths = {
  first: "M11 4l-4 4 4 4M5 4v8",
  previous: "M10 4l-4 4 4 4",
  next: "M6 4l4 4-4 4",
  last: "M5 4l4 4-4 4M11 4v8",
};

function PageButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: keyof typeof paths;
  label: string;
  disabled: boolean;
  onClick: () => void;
}): ReactNode {
  return (
    <Button
      intent="ghost"
      size="sm"
      className="nuv-data-table__page-button"
      aria-label={label}
      // Not `disabled`: a button that disables itself under the keyboard
      // drops focus onto the page. "Next" does exactly that on the page
      // before the last.
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      <svg
        aria-hidden="true"
        className="nuv-data-table__page-icon"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[icon]} />
      </svg>
    </Button>
  );
}

export interface DataTablePaginationOwnProps {
  /**
   * The choices for rows per page. The size the table has now is added if
   * it isn't one of them. Pass an empty list to leave the select out.
   * @default [10, 20, 50, 100]
   */
  pageSizes?: number[];
}

export interface DataTablePaginationProps
  extends DataTablePaginationOwnProps,
    HTMLAttributes<HTMLDivElement> {}

const defaultSizes = [10, 20, 50, 100];

/**
 * The bar under the table: rows per page, which rows are showing out of
 * how many, and buttons for the first, previous, next and last page. It
 * needs `rowPaginationFeature`, and shows nothing without it.
 */
export function DataTablePagination({
  pageSizes = defaultSizes,
  className,
  ...props
}: DataTablePaginationProps) {
  const { table, labels } = useDataTableView("DataTablePagination");
  const id = useId();
  if (!supports.pagination(table)) return null;

  const { pageIndex, pageSize } = table.atoms.pagination.get();
  const total = table.getRowCount();
  const pages = Math.max(table.getPageCount(), 1);
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const sizes = pageSizes.includes(pageSize)
    ? pageSizes
    : [...pageSizes, pageSize].sort((a, b) => a - b);
  const back = table.getCanPreviousPage();
  const forward = table.getCanNextPage();

  return (
    // A group and not a nav: these are a table's controls, not links to
    // other places, and a page with two tables would have two landmarks of
    // the same name.
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would need a legend on show
    <div
      role="group"
      aria-label={labels.pagination}
      className={cx("nuv-data-table__pagination", className)}
      {...props}
    >
      {pageSizes.length > 0 ? (
        <div className="nuv-data-table__page-size">
          <label htmlFor={id} className="nuv-data-table__page-size-label">
            {labels.rowsPerPage}
          </label>
          <NativeSelect
            id={id}
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      <span className="nuv-data-table__page-range">
        {labels.pageRange(from, to, total)}
      </span>
      <div className="nuv-data-table__pages">
        <PageButton
          icon="first"
          label={labels.firstPage}
          disabled={!back}
          onClick={() => table.firstPage()}
        />
        <PageButton
          icon="previous"
          label={labels.previousPage}
          disabled={!back}
          onClick={() => table.previousPage()}
        />
        <span className="nuv-data-table__page">
          {labels.page(pageIndex + 1, pages)}
        </span>
        <PageButton
          icon="next"
          label={labels.nextPage}
          disabled={!forward}
          onClick={() => table.nextPage()}
        />
        <PageButton
          icon="last"
          label={labels.lastPage}
          disabled={!forward}
          onClick={() => table.lastPage()}
        />
      </div>
    </div>
  );
}
