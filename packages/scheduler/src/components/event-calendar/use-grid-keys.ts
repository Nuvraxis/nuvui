import { type KeyboardEvent, type RefObject, useState } from "react";

/**
 * Moving around a grid of days with the arrow keys. One cell at a time is
 * in the tab order, and what's in it after it, so Tab goes into a cell's
 * events and then on out of the grid, rather than through every hour of
 * the week. Cells are marked with `data-row` and `data-column`.
 */
export function useGridKeys(
  grid: RefObject<HTMLElement | null>,
  rows: number,
  columns: number,
  initial: () => [number, number],
) {
  const [active, setActive] = useState(initial);
  // Rows and columns can drop: a week shown with its weekends left out.
  const row = Math.min(active[0], rows - 1);
  const column = Math.min(active[1], columns - 1);

  const focus = (nextRow: number, nextColumn: number) => {
    setActive([nextRow, nextColumn]);
    grid.current
      ?.querySelector<HTMLElement>(
        `[data-row="${nextRow}"][data-column="${nextColumn}"]`,
      )
      ?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-row][data-column]",
    );
    if (!cell || !grid.current?.contains(cell)) return;
    const at = [Number(cell.dataset.row), Number(cell.dataset.column)] as const;
    // The days run the other way in a page written right to left.
    const ahead = getComputedStyle(grid.current).direction === "rtl" ? -1 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [at[0] - 1, at[1]],
      ArrowDown: [at[0] + 1, at[1]],
      ArrowLeft: [at[0], at[1] - ahead],
      ArrowRight: [at[0], at[1] + ahead],
      Home: [at[0], 0],
      End: [at[0], columns - 1],
    };
    const next = moves[event.key];
    if (!next || event.altKey || event.metaKey) return;
    event.preventDefault();
    focus(
      Math.max(0, Math.min(rows - 1, next[0])),
      Math.max(0, Math.min(columns - 1, next[1])),
    );
  };

  return {
    onKeyDown,
    isActive: (r: number, c: number) => r === row && c === column,
    tabIndex: (r: number, c: number) => (r === row && c === column ? 0 : -1),
    cell: (r: number, c: number) => ({
      "data-row": r,
      "data-column": c,
      onFocus: (event: { target: EventTarget; currentTarget: EventTarget }) => {
        // A click on a cell, or Tab back to it, makes it the one in the
        // tab order.
        if (event.target === event.currentTarget) setActive([r, c]);
      },
    }),
  };
}
