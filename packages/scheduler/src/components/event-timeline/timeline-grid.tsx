import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { dayOf, isWeekend, minutesOf } from "../../core/dates";
import type { Spot } from "../../core/edit";
import type { PlacedEvent } from "../../core/events";
import type { CalendarResource } from "../../core/resources";
import {
  barsOf,
  columnOf,
  eventsByRow,
  positionOf,
  spotIn,
  type TimelineAxis,
  type TimelineColumn,
  type TimelineRow,
} from "../../core/timeline";
import { cx } from "../../utils/cx";
import { useIsomorphicLayoutEffect } from "../../utils/use-width";
import { useCalendar } from "../event-calendar/context";
import { colorOf, EventButton, keyOf } from "../event-calendar/event-button";

/**
 * The least a bar takes, in pixels: 24 drawn, so a short one can still be
 * pressed, and the gap at each end.
 */
const shortest = 26;
/** Above and below a row's lanes, in pixels. */
const rowPadding = 4;
/** Rows and columns drawn past each edge of the view, so a scroll shows them. */
const overscanRows = 400;
const overscanColumns = 3;

interface Sizes {
  /** The narrowest a column is, from the scale's CSS variable. */
  column: number;
  /** A lane of bars, from the CSS variable. */
  pitch: number;
  /** The resources' column. */
  resources: number;
  /** The header's rows. */
  head: number;
  /** What's seen of the grid. */
  width: number;
  height: number;
}

// What's drawn before the browser measures, and what the server draws.
const guessed: Sizes = {
  column: 44,
  pitch: 28,
  resources: 192,
  head: 72,
  width: 1024,
  height: 560,
};

const isRtl = (element: Element) =>
  getComputedStyle(element).direction === "rtl";

/**
 * The spot under a point: a column's day, and on the hours scale its
 * minute, read from how far across the cell the point is, and the row's
 * resource. Nothing under the resources' column or the header.
 */
export function timelineSpotAt(axis: TimelineAxis) {
  return (root: HTMLElement, x: number, y: number): Spot | null => {
    for (const element of document.elementsFromPoint(x, y)) {
      if (!(element instanceof HTMLElement) || !root.contains(element)) {
        continue;
      }
      if (
        element.classList.contains("nuv-event-timeline__resource") ||
        element.classList.contains("nuv-event-timeline__head")
      ) {
        return null;
      }
      const column = element.dataset.spotColumn;
      if (column === undefined) continue;
      // A bar runs on past the cell it's in, which is given as being under
      // the point too. The point has to be in the cell's own box.
      const box = element.getBoundingClientRect();
      if (x < box.left || x >= box.right || y < box.top || y >= box.bottom) {
        continue;
      }
      const across = isRtl(element) ? box.right - x : x - box.left;
      const spot = spotIn(axis, Number(column), across / box.width);
      if (!spot) return null;
      return { ...spot, resource: element.dataset.spotResource || null };
    }
    return null;
  };
}

/** Near an edge of the grid while an event is dragged, it scrolls that way. */
export function scrollTimeline(root: HTMLElement, x: number, y: number) {
  const grid = root.querySelector<HTMLElement>(".nuv-event-timeline__grid");
  if (!grid) return;
  const box = grid.getBoundingClientRect();
  const head =
    grid.querySelector(".nuv-event-timeline__head")?.getBoundingClientRect()
      .bottom ?? box.top;
  const corner = grid
    .querySelector(".nuv-event-timeline__corner")
    ?.getBoundingClientRect();
  const rtl = isRtl(grid);
  // The time runs between the resources' column and the far edge.
  const left = rtl ? box.left : (corner?.right ?? box.left);
  const right = rtl ? (corner?.left ?? box.right) : box.right;
  const edge = 32;
  if (y > head && y < head + edge) grid.scrollTop -= 12;
  else if (y < box.bottom && y > box.bottom - edge) grid.scrollTop += 12;
  if (x > left && x < left + edge) grid.scrollLeft -= 12;
  else if (x < right && x > right - edge) grid.scrollLeft += 12;
}

interface TimelineGridProps {
  axis: TimelineAxis;
  rows: readonly TimelineRow[];
  placed: readonly PlacedEvent[];
  /** The grid's name for screen readers: the period it shows. */
  label: string;
  collapsed: readonly string[];
  onCollapsedChange: (collapsed: string[]) => void;
  renderResource: ((resource: CalendarResource) => ReactNode) | undefined;
  /** The row the event picked up from the keyboard is in, if one is. */
  pickedRow: string | null | undefined;
}

// The first row whose bottom is past `y`, by the rows' tops.
function rowAt(tops: readonly number[], heights: readonly number[], y: number) {
  let low = 0;
  let high = tops.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((tops[middle] ?? 0) + (heights[middle] ?? 0) <= y) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * The resources down the side and the columns across, as a grid. Only the
 * rows and columns in view, and a few past them, are drawn, with the cell
 * in the tab order and an event picked up from the keyboard drawn too
 * wherever they are.
 */
export function TimelineGrid({
  axis,
  rows,
  placed,
  label,
  collapsed,
  onCollapsedChange,
  renderResource,
  pickedRow,
}: TimelineGridProps) {
  const {
    timeZone,
    today,
    now,
    format,
    labels,
    color,
    resources,
    scrollToHour,
    edit,
  } = useCalendar();
  const grid = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState(guessed);
  const [measured, setMeasured] = useState(false);
  const [scroll, setScroll] = useState({ left: 0, top: 0 });
  const { columns } = axis;
  const count = columns.length;

  // Measured on the page, and again as it changes size. The server can't
  // measure, and draws with a guess.
  useIsomorphicLayoutEffect(() => {
    const node = grid.current;
    if (!node) return;
    const measure = () => {
      const probe = node
        .querySelector(".nuv-event-timeline__probe")
        ?.getBoundingClientRect();
      const corner = node.querySelector(".nuv-event-timeline__corner");
      const head = node.querySelector<HTMLElement>(".nuv-event-timeline__head");
      setSizes({
        column: probe?.width || guessed.column,
        pitch: probe?.height || guessed.pitch,
        resources: corner?.getBoundingClientRect().width ?? guessed.resources,
        head: head?.offsetHeight ?? guessed.head,
        width: node.clientWidth,
        height: node.clientHeight,
      });
      setMeasured(true);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [axis.scale, axis.groups.length]);

  // A browser reports a scroll once a frame at most, so it needs no pacing.
  const onScroll = () => {
    const node = grid.current;
    if (node) {
      setScroll({ left: Math.abs(node.scrollLeft), top: node.scrollTop });
    }
  };

  // Columns fill the width when there's room, and scroll when there isn't.
  const width = Math.max(sizes.column, (sizes.width - sizes.resources) / count);

  // Every row's bars, so a row is as tall as its lanes wherever it's
  // scrolled to.
  const laid = useMemo(() => {
    const byRow = eventsByRow(placed, rows, resources);
    return rows.map((row) =>
      barsOf(axis, byRow.get(row.id ?? "") ?? [], timeZone, shortest / width),
    );
  }, [placed, rows, resources, axis, timeZone, width]);
  const heights = laid.map(
    ({ lanes }) => Math.max(1, lanes) * sizes.pitch + rowPadding,
  );
  const tops: number[] = [];
  let total = 0;
  for (const height of heights) {
    tops.push(total);
    total += height;
  }

  // The cell in the tab order: the row header is column 0.
  const todayColumn = today ? columnOf(axis, today) : -1;
  const [active, setActive] = useState<[number, number]>(() => [
    0,
    Math.max(0, todayColumn) + 1,
  ]);
  const activeRow = Math.min(active[0], Math.max(0, rows.length - 1));
  const activeColumn = Math.min(active[1], count);
  const isActive = (row: number, column: number) =>
    row === activeRow && column === activeColumn;
  const focusAfter = useRef<[number, number] | null>(null);
  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    grid.current
      ?.querySelector<HTMLElement>(
        `[data-row="${target[0]}"][data-column="${target[1]}"]`,
      )
      ?.focus();
  });

  // Opened at now, when it's shown, or at the hour asked for on the hours
  // scale, each time the scale or the period changes.
  const opened = useRef("");
  useIsomorphicLayoutEffect(() => {
    const node = grid.current;
    const key = `${axis.scale}:${axis.first}:${count}`;
    if (!node || !measured || opened.current === key) return;
    opened.current = key;
    let at = 0;
    if (now && today && today >= axis.first && today <= axis.last) {
      at = positionOf(axis, today, minutesOf(now, timeZone)).at;
    } else if (axis.scale === "hours") {
      at = Math.min(Math.max(scrollToHour - axis.hours[0], 0), count);
    }
    // A column before it, so what's just gone is in view too.
    const left = Math.max(0, (at - 1) * width);
    node.scrollLeft = isRtl(node) ? -left : left;
    setActive(([row]) => [row, Math.min(Math.floor(at), count - 1) + 1]);
  });

  // What's in view, and a little past it.
  const firstColumn = Math.max(
    0,
    Math.floor(scroll.left / width) - overscanColumns,
  );
  const lastColumn = Math.min(
    count - 1,
    Math.ceil((scroll.left + sizes.width - sizes.resources) / width) +
      overscanColumns,
  );
  const firstRow = rowAt(tops, heights, scroll.top - overscanRows);
  const lastRow = rowAt(
    tops,
    heights,
    scroll.top + sizes.height - sizes.head + overscanRows,
  );

  // The event picked up from the keyboard, wherever it's moved to.
  const pickedAt = (() => {
    if (edit.picked === null || pickedRow === undefined) return null;
    const row = rows.findIndex((item) => item.id === pickedRow);
    const bar = laid[row]?.bars.find(
      (item) => item.placed.event.id === edit.picked,
    );
    return bar ? ([row, Math.floor(bar.start)] as const) : null;
  })();

  const shownRows = new Set<number>();
  for (let row = firstRow; row <= lastRow && row < rows.length; row += 1) {
    shownRows.add(row);
  }
  const shownColumns = new Set<number>();
  for (let column = firstColumn; column <= lastColumn; column += 1) {
    shownColumns.add(column);
  }
  if (rows.length > 0) shownRows.add(activeRow);
  if (activeColumn > 0) shownColumns.add(activeColumn - 1);
  if (pickedAt) {
    shownRows.add(pickedAt[0]);
    shownColumns.add(Math.min(Math.max(pickedAt[1], 0), count - 1));
  }
  const rowList = [...shownRows].sort((a, b) => a - b);
  const columnList = [...shownColumns].sort((a, b) => a - b);

  const headRows = axis.groups.length > 0 ? 2 : 1;
  const groupStarts = new Set(axis.groups.map((group) => group.first));

  const columnName = (column: TimelineColumn) => {
    switch (axis.scale) {
      case "hours":
        return `${format.day(column.first)}, ${format.hour(column.hour ?? 0)}`;
      case "days":
        return format.day(column.first);
      case "weeks":
        return labels.timeRange(
          format.day(column.first),
          format.day(column.last),
        );
      case "months":
        return format.month(column.first);
      default:
        return format.year(column.first);
    }
  };

  const columnHead = (column: TimelineColumn) => {
    switch (axis.scale) {
      case "hours":
        return format.hour(column.hour ?? 0);
      case "days":
        return (
          <>
            <span className="nuv-event-timeline__weekday">
              {format.weekday(column.first)}
            </span>
            <span className="nuv-event-timeline__date">
              {format.date(column.first)}
            </span>
          </>
        );
      case "weeks":
        return format.shortDay(column.first);
      case "months":
        return format.shortMonth(column.first);
      default:
        return format.year(column.first);
    }
  };

  const groupName = (day: string) =>
    axis.scale === "hours"
      ? format.day(day)
      : axis.scale === "months"
        ? format.year(day)
        : format.month(day);

  const nowAt =
    now && today && today >= axis.first && today <= axis.last
      ? positionOf(axis, dayOf(now, timeZone), minutesOf(now, timeZone))
      : null;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-row][data-column]",
    );
    const node = grid.current;
    if (!cell || !node?.contains(cell) || event.altKey || event.metaKey) {
      return;
    }
    const row = Number(cell.dataset.row);
    const column = Number(cell.dataset.column);
    // The columns run the other way in a page written right to left.
    const ahead = isRtl(node) ? -1 : 1;
    const page = Math.max(1, lastRow - firstRow - 1);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, column],
      ArrowDown: [row + 1, column],
      ArrowLeft: [row, column - ahead],
      ArrowRight: [row, column + ahead],
      PageUp: [row - page, column],
      PageDown: [row + page, column],
      Home: event.ctrlKey ? [0, 1] : [row, 1],
      End: event.ctrlKey ? [rows.length - 1, count] : [row, count],
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    const target: [number, number] = [
      Math.max(0, Math.min(rows.length - 1, next[0])),
      Math.max(0, Math.min(count, next[1])),
    ];
    setActive(target);
    focusAfter.current = target;
  };

  const tabIndex = (row: number, column: number) =>
    isActive(row, column) ? 0 : -1;
  const cell = (row: number, column: number) => ({
    "data-row": row,
    "data-column": column,
    onFocus: (event: { target: EventTarget; currentTarget: EventTarget }) => {
      // A click on a cell, or Tab back to it, makes it the one in the
      // tab order.
      if (event.target === event.currentTarget) setActive([row, column]);
    },
  });

  const toggle = (id: string) =>
    onCollapsedChange(
      collapsed.includes(id)
        ? collapsed.filter((item) => item !== id)
        : [...collapsed, id],
    );

  const contentWidth = `calc(var(--nuv-event-resources) + ${count * width}px)`;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a table can't draw only the rows and columns in view, and keep its head and first column fixed as it scrolls both ways.
    <div
      ref={grid}
      role="grid"
      aria-label={label}
      aria-rowcount={headRows + rows.length}
      aria-colcount={1 + count}
      className="nuv-event-timeline__grid"
      style={
        {
          "--nuv-event-column": `${width}px`,
          scrollPaddingBlockStart: sizes.head,
          scrollPaddingInlineStart: sizes.resources,
        } as CSSProperties
      }
      onKeyDown={onKeyDown}
      onScroll={onScroll}
    >
      <span aria-hidden="true" className="nuv-event-timeline__probe" />
      {/* biome-ignore lint/a11y/useSemanticElements: rows of a grid, as above. */}
      <div
        role="rowgroup"
        className="nuv-event-timeline__head"
        style={{ inlineSize: contentWidth }}
      >
        {axis.groups.length > 0 ? (
          // biome-ignore lint/a11y/useSemanticElements: as above.
          // biome-ignore lint/a11y/useFocusableInteractive: a part of the grid that isn't a cell. The arrow keys move between the cells, which take the focus.
          <div
            role="row"
            aria-rowindex={1}
            className="nuv-event-timeline__head-row nuv-event-timeline__head-row--groups"
          >
            <div aria-hidden="true" className="nuv-event-timeline__corner" />
            {axis.groups
              .filter(
                (group) =>
                  group.first <= lastColumn &&
                  group.first + group.count > firstColumn,
              )
              .map((group) => (
                // biome-ignore lint/a11y/useSemanticElements: as above.
                // biome-ignore lint/a11y/useFocusableInteractive: as above.
                <div
                  key={group.first}
                  role="columnheader"
                  aria-colindex={2 + group.first}
                  aria-colspan={group.count}
                  aria-current={
                    axis.scale === "hours" && group.day === today
                      ? "date"
                      : undefined
                  }
                  className="nuv-event-timeline__group"
                  style={
                    {
                      "--nuv-event-at": group.first,
                      "--nuv-event-length": group.count,
                    } as CSSProperties
                  }
                >
                  <span className="nuv-event-timeline__group-name">
                    {groupName(group.day)}
                  </span>
                </div>
              ))}
          </div>
        ) : null}
        {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: as above. */}
        <div
          role="row"
          aria-rowindex={headRows}
          className="nuv-event-timeline__head-row"
        >
          {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
          {/* biome-ignore lint/a11y/useFocusableInteractive: as above. */}
          <div
            role="columnheader"
            aria-colindex={1}
            className="nuv-event-timeline__corner"
          >
            {labels.resources}
          </div>
          {columnList.map((index) => {
            const column = columns[index] as TimelineColumn;
            const current = axis.scale !== "hours" && index === todayColumn;
            return (
              // biome-ignore lint/a11y/useSemanticElements: as above.
              // biome-ignore lint/a11y/useFocusableInteractive: as above.
              <div
                key={index}
                role="columnheader"
                aria-colindex={2 + index}
                aria-label={columnName(column)}
                aria-current={current ? "date" : undefined}
                className={cx(
                  "nuv-event-timeline__column-head",
                  current && "nuv-event-timeline__column-head--today",
                  groupStarts.has(index) &&
                    index > 0 &&
                    "nuv-event-timeline__column-head--group-start",
                )}
                style={{ "--nuv-event-at": index } as CSSProperties}
              >
                {columnHead(column)}
              </div>
            );
          })}
        </div>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
      <div
        role="rowgroup"
        className="nuv-event-timeline__body"
        style={{ blockSize: total, inlineSize: contentWidth }}
      >
        {nowAt && !nowAt.clipped ? (
          <span
            aria-hidden="true"
            className="nuv-event-timeline__now"
            style={{ "--nuv-event-at": nowAt.at } as CSSProperties}
          />
        ) : null}
        {rowList.map((index) => {
          const row = rows[index] as TimelineRow;
          const rowId = row.id;
          const resource = row.resource;
          const title = resource?.title ?? labels.unassigned;
          const open = rowId === null || !collapsed.includes(rowId);
          const bars = laid[index]?.bars ?? [];
          // Each bar is drawn in the first column drawn that it covers.
          const home = new Map<number, typeof bars>();
          for (const bar of bars) {
            const column = columnList.find(
              (each) => each + 1 > bar.start && each < bar.start + bar.length,
            );
            if (column === undefined) continue;
            const list = home.get(column);
            if (list) list.push(bar);
            else home.set(column, [bar]);
          }
          const swatch = rowId
            ? (resources.get(rowId)?.settings.color ?? color ?? "1")
            : null;
          return (
            // biome-ignore lint/a11y/useSemanticElements: as above.
            // biome-ignore lint/a11y/useFocusableInteractive: as above.
            <div
              key={rowId ?? ""}
              role="row"
              aria-rowindex={headRows + 1 + index}
              className="nuv-event-timeline__row"
              style={{
                insetBlockStart: tops[index],
                blockSize: heights[index],
              }}
            >
              {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
              <div
                role="rowheader"
                aria-colindex={1}
                aria-label={title}
                className="nuv-event-timeline__resource"
                style={{ "--nuv-event-depth": row.depth } as CSSProperties}
                {...(row.parent ? null : cell(index, 0))}
                tabIndex={row.parent ? undefined : tabIndex(index, 0)}
              >
                {row.parent && rowId ? (
                  <button
                    type="button"
                    {...cell(index, 0)}
                    tabIndex={tabIndex(index, 0)}
                    className="nuv-event-timeline__fold"
                    aria-label={labels.resourcesIn(title)}
                    aria-expanded={open}
                    onClick={() => toggle(rowId)}
                  >
                    <svg
                      aria-hidden="true"
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
                ) : (
                  <span className="nuv-event-timeline__fold-space" />
                )}
                {swatch ? (
                  <span
                    aria-hidden="true"
                    className="nuv-event-timeline__swatch"
                    style={
                      { "--nuv-event-color": colorOf(swatch) } as CSSProperties
                    }
                  />
                ) : null}
                <span className="nuv-event-timeline__resource-name">
                  {resource && renderResource
                    ? renderResource(resource)
                    : title}
                </span>
              </div>
              {columnList.map((columnIndex) => {
                const column = columns[columnIndex] as TimelineColumn;
                const gridColumn = columnIndex + 1;
                const tabbable = isActive(index, gridColumn);
                return (
                  // biome-ignore lint/a11y/useSemanticElements: as above.
                  <div
                    key={columnIndex}
                    role="gridcell"
                    aria-colindex={2 + columnIndex}
                    aria-label={`${title}, ${columnName(column)}`}
                    {...cell(index, gridColumn)}
                    tabIndex={tabIndex(index, gridColumn)}
                    data-spot-day={column.first}
                    data-spot-hour={column.hour}
                    data-spot-column={columnIndex}
                    data-spot-resource={rowId ?? ""}
                    className={cx(
                      "nuv-event-timeline__cell",
                      axis.scale !== "hours" &&
                        columnIndex === todayColumn &&
                        "nuv-event-timeline__cell--today",
                      axis.scale === "days" &&
                        isWeekend(column.first) &&
                        "nuv-event-timeline__cell--weekend",
                      groupStarts.has(columnIndex) &&
                        columnIndex > 0 &&
                        "nuv-event-timeline__cell--group-start",
                    )}
                    style={{ "--nuv-event-at": columnIndex } as CSSProperties}
                  >
                    {(home.get(columnIndex) ?? []).map((bar) => (
                      <EventButton
                        key={keyOf(bar.placed)}
                        placed={bar.placed}
                        look="bar"
                        row={rowId}
                        className="nuv-event-timeline__event"
                        tabbable={tabbable}
                        startsBefore={bar.startsBefore}
                        endsAfter={bar.endsAfter}
                        style={
                          {
                            "--nuv-event-start": bar.start - columnIndex,
                            "--nuv-event-length": bar.length,
                            "--nuv-event-lane": bar.lane,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
