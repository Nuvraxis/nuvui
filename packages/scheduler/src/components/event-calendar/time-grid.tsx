import { type CSSProperties, useMemo, useRef } from "react";
import { type DayKey, minutesOf } from "../../core/dates";
import { type PlacedEvent, type Segment, segmentsOn } from "../../core/events";
import { arrangeDay, packLanes } from "../../core/layout";
import { cx } from "../../utils/cx";
import { useIsomorphicLayoutEffect } from "../../utils/use-width";
import { useCalendar, type ViewProps } from "./context";
import { EventButton, keyOf } from "./event-button";
import { useGridKeys } from "./use-grid-keys";

/** The columns a bar across days covers, or `null` if none are shown. */
export function columnsOf(
  days: readonly DayKey[],
  placed: PlacedEvent,
): { first: number; last: number } | null {
  const first = days.findIndex((day) => day >= placed.firstDay);
  let last = -1;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if ((days[index] ?? "") <= placed.lastDay) {
      last = index;
      break;
    }
  }
  return first === -1 || last < first ? null : { first, last };
}

interface Clipped extends Segment {
  clippedStart: boolean;
  clippedEnd: boolean;
}

/** The day and week views: a column for each day, a row for each hour. */
export function TimeGrid({ days, placed, label }: ViewProps) {
  const { timeZone, today, now, format, labels, hours, scrollToHour, goToDay } =
    useCalendar();
  const grid = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [from, to] = hours;
  const hourList = useMemo(
    () => Array.from({ length: to - from }, (_, index) => from + index),
    [from, to],
  );
  const firstHour = Math.min(Math.max(scrollToHour, from), to - 1);

  const bars = useMemo(() => {
    const spans = placed
      .filter((item) => item.spansDays)
      .flatMap((item) => {
        const columns = columnsOf(days, item);
        return columns ? [{ item, ...columns }] : [];
      })
      .sort((a, b) => a.first - b.first || b.last - a.last);
    return packLanes(spans);
  }, [placed, days]);
  const lanes = Math.max(0, ...bars.map((bar) => bar.lane + 1));

  // Each day's timed events, cut to the hours shown and set side by side.
  const blocks = useMemo(
    () =>
      days.map((day) => {
        const clipped: Clipped[] = segmentsOn(placed, day, timeZone).flatMap(
          (segment) => {
            const startMinute = Math.min(
              Math.max(segment.startMinute, from * 60),
              to * 60,
            );
            const endMinute = Math.max(
              Math.min(segment.endMinute, to * 60),
              from * 60,
            );
            // Wholly in the hours left out. One with no length is kept
            // where it is, as long as that's shown.
            const hidden =
              segment.startMinute === segment.endMinute
                ? segment.startMinute < from * 60 ||
                  segment.startMinute > to * 60
                : startMinute >= endMinute;
            if (hidden) return [];
            return [
              {
                ...segment,
                startMinute,
                endMinute,
                clippedStart: startMinute > segment.startMinute,
                clippedEnd: endMinute < segment.endMinute,
              },
            ];
          },
        );
        return arrangeDay(clipped);
      }),
    [days, placed, timeZone, from, to],
  );

  const keys = useGridKeys(grid, 2 + hourList.length, days.length, () => [
    2 + firstHour - from,
    today ? Math.max(0, days.indexOf(today)) : 0,
  ]);

  // Opened at the hour asked for, and only when it's first drawn. Moving to
  // the next week leaves the scroll where it is: this view stays mounted.
  useIsomorphicLayoutEffect(() => {
    const row = grid.current?.querySelector<HTMLElement>(
      `[data-hour="${firstHour}"]`,
    );
    if (grid.current && row) {
      // A little above the row, so its hour's time isn't cut in half.
      grid.current.scrollTop =
        row.offsetTop - (head.current?.offsetHeight ?? 0) - 8;
    }
  }, []);

  const nowMinute = now ? minutesOf(now, timeZone) : -1;
  const todayColumn = now && today ? days.indexOf(today) : -1;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a table can't scroll its body under a fixed head, and isn't what a calendar is to a screen reader.
    <div
      ref={grid}
      role="grid"
      aria-label={label}
      aria-rowcount={2 + hourList.length}
      aria-colcount={days.length}
      className="nuv-event-calendar__time-grid"
      style={{ "--nuv-event-days": days.length } as CSSProperties}
      onKeyDown={keys.onKeyDown}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: rows of a grid, as above. */}
      <div ref={head} role="rowgroup" className="nuv-event-calendar__head">
        {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: a part of the grid that isn't a cell. The arrow keys move between the cells, which take the focus. */}
        <div role="row" className="nuv-event-calendar__row">
          <div aria-hidden="true" className="nuv-event-calendar__axis" />
          {days.map((day, column) => (
            // biome-ignore lint/a11y/useSemanticElements: as above.
            // biome-ignore lint/a11y/useFocusableInteractive: as above.
            <div
              key={day}
              role="columnheader"
              aria-current={day === today ? "date" : undefined}
              className={cx(
                "nuv-event-calendar__column-head",
                day === today && "nuv-event-calendar__column-head--today",
              )}
            >
              <button
                type="button"
                {...keys.cell(0, column)}
                tabIndex={keys.tabIndex(0, column)}
                aria-label={format.fullDay(day)}
                className="nuv-event-calendar__day-button"
                onClick={() => goToDay(day)}
              >
                <span className="nuv-event-calendar__weekday">
                  {format.weekday(day)}
                </span>
                <span className="nuv-event-calendar__date">
                  {format.date(day)}
                </span>
              </button>
            </div>
          ))}
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: as above. */}
        <div
          role="row"
          className="nuv-event-calendar__row nuv-event-calendar__row--all-day"
          style={{ "--nuv-event-lanes": lanes } as CSSProperties}
        >
          {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
          {/* biome-ignore lint/a11y/useFocusableInteractive: as above. */}
          <div
            role="rowheader"
            className="nuv-event-calendar__axis nuv-event-calendar__axis--all-day"
          >
            {labels.allDay}
          </div>
          {days.map((day, column) => (
            // biome-ignore lint/a11y/useSemanticElements: as above.
            <div
              key={day}
              role="gridcell"
              {...keys.cell(1, column)}
              tabIndex={keys.tabIndex(1, column)}
              aria-label={`${labels.allDay}, ${format.day(day)}`}
              data-spot-day={day}
              className="nuv-event-calendar__cell nuv-event-calendar__cell--all-day"
            >
              {bars
                .filter((bar) => bar.first === column)
                .map((bar) => (
                  <EventButton
                    key={keyOf(bar.item)}
                    placed={bar.item}
                    look="bar"
                    tabbable={keys.isActive(1, column)}
                    startsBefore={bar.item.firstDay < day}
                    endsAfter={bar.item.lastDay > (days[bar.last] ?? day)}
                    style={
                      {
                        "--nuv-event-lane": bar.lane,
                        "--nuv-event-span": bar.last - bar.first + 1,
                      } as CSSProperties
                    }
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
      <div role="rowgroup" className="nuv-event-calendar__body">
        {hourList.map((hour, index) => (
          // biome-ignore lint/a11y/useSemanticElements: as above.
          // biome-ignore lint/a11y/useFocusableInteractive: as above.
          <div
            key={hour}
            role="row"
            data-hour={hour}
            className="nuv-event-calendar__row nuv-event-calendar__row--hour"
          >
            {/* The time each row starts is said in each cell's name. */}
            <div
              aria-hidden="true"
              className="nuv-event-calendar__axis nuv-event-calendar__axis--hour"
            >
              <span
                className={cx(
                  "nuv-event-calendar__hour",
                  index === 0 && "nuv-event-calendar__hour--first",
                )}
              >
                {format.hour(hour)}
              </span>
            </div>
            {days.map((day, column) => {
              const row = 2 + index;
              const starting = (blocks[column] ?? []).filter(
                ({ item }) =>
                  Math.min(Math.floor(item.startMinute / 60), to - 1) === hour,
              );
              return (
                // biome-ignore lint/a11y/useSemanticElements: as above.
                <div
                  key={day}
                  role="gridcell"
                  {...keys.cell(row, column)}
                  tabIndex={keys.tabIndex(row, column)}
                  aria-label={`${format.day(day)}, ${format.hour(hour)}`}
                  data-spot-day={day}
                  data-spot-hour={hour}
                  className={cx(
                    "nuv-event-calendar__cell",
                    "nuv-event-calendar__cell--hour",
                    day === today && "nuv-event-calendar__cell--today",
                  )}
                >
                  {starting.map(({ item, column: lane, span, columns }) => (
                    <EventButton
                      key={keyOf(item.placed)}
                      placed={item.placed}
                      look="block"
                      tabbable={keys.isActive(row, column)}
                      startsBefore={item.startsBefore || item.clippedStart}
                      endsAfter={item.endsAfter || item.clippedEnd}
                      style={
                        {
                          "--nuv-event-offset":
                            (item.startMinute - hour * 60) / 60,
                          "--nuv-event-length":
                            (item.endMinute - item.startMinute) / 60,
                          "--nuv-event-column": lane,
                          "--nuv-event-span": span,
                          "--nuv-event-columns": columns,
                        } as CSSProperties
                      }
                    />
                  ))}
                  {column === todayColumn &&
                  Math.floor(nowMinute / 60) === hour ? (
                    <span
                      aria-hidden="true"
                      className="nuv-event-calendar__now"
                      style={
                        {
                          "--nuv-event-offset": (nowMinute - hour * 60) / 60,
                        } as CSSProperties
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
