import { Popover, PopoverContent, PopoverTrigger } from "@nuvui/react/popover";
import { type CSSProperties, useMemo, useRef, useState } from "react";
import type { DayKey } from "../../core/dates";
import { eventsOn, type PlacedEvent } from "../../core/events";
import { packLanes, visibleRuns } from "../../core/layout";
import { cx } from "../../utils/cx";
import { useIsomorphicLayoutEffect } from "../../utils/use-width";
import { useCalendar, type ViewProps } from "./context";
import { EventButton } from "./event-button";
import { columnsOf } from "./time-grid";
import { useGridKeys } from "./use-grid-keys";

interface MonthViewProps extends ViewProps {
  /** The month shown, as `yyyy-MM`. Days of the months either side are dimmed. */
  month: string;
  /** How many days each week shows: 7, or 5 without weekends. */
  perWeek: number;
}

function More({
  day,
  placed,
  count,
  lane,
  tabbable,
}: {
  day: DayKey;
  placed: readonly PlacedEvent[];
  count: number;
  lane: number;
  tabbable: boolean;
}) {
  const { format, labels } = useCalendar();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          tabIndex={tabbable ? 0 : -1}
          className="nuv-event-calendar__more"
          style={{ "--nuv-event-lane": lane } as CSSProperties}
        >
          {labels.more(count)}
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={format.day(day)}
        className="nuv-event-calendar__more-panel"
      >
        <p className="nuv-event-calendar__more-title">{format.day(day)}</p>
        <ul className="nuv-event-calendar__list">
          {eventsOn(placed, day).map((item) => (
            <li key={item.event.id}>
              <EventButton placed={item} look="item" tabbable />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** A month: a row for each week, with events as bars across their days. */
export function MonthView({
  days,
  placed,
  label,
  month,
  perWeek,
}: MonthViewProps) {
  const { today, format, labels, preferences, weekNumber, goToDay } =
    useCalendar();
  const grid = useRef<HTMLDivElement>(null);
  const weeks = useMemo(
    () =>
      Array.from({ length: Math.ceil(days.length / perWeek) }, (_, index) =>
        days.slice(index * perWeek, (index + 1) * perWeek),
      ),
    [days, perWeek],
  );

  // How many events fit in a day, measured on the page. The server can't
  // measure, and draws three.
  const [room, setRoom] = useState(3);
  useIsomorphicLayoutEffect(() => {
    const lanes = grid.current?.querySelector<HTMLElement>(
      ".nuv-event-calendar__lanes",
    );
    const probe = grid.current?.querySelector<HTMLElement>(
      ".nuv-event-calendar__probe",
    );
    if (!lanes || !probe) return;
    const measure = () => {
      const pitch = probe.getBoundingClientRect().height;
      if (pitch > 0) {
        setRoom(Math.max(1, Math.floor(lanes.clientHeight / pitch)));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(lanes);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(
    () =>
      weeks.map((week) => {
        const items = placed
          .flatMap((item) => {
            const columns = columnsOf(week, item);
            if (!columns) return [];
            // A timed event shorter than a day is a line on the day it
            // starts, even when it ends after midnight.
            if (!item.spansDays) {
              const first = week.indexOf(item.firstDay);
              return first === -1 ? [] : [{ item, first, last: first }];
            }
            return [{ item, ...columns }];
          })
          .sort(
            (a, b) =>
              a.first - b.first ||
              b.last - b.first - (a.last - a.first) ||
              Number(b.item.spansDays) - Number(a.item.spansDays) ||
              a.item.start.getTime() - b.item.start.getTime(),
          );
        const laned = packLanes(items);
        const count = week.map(
          (_, column) =>
            laned.filter((bar) => bar.first <= column && bar.last >= column)
              .length,
        );
        // A day with more than fits keeps its last lane for "3 more".
        const roomFor = count.map((total) => (total > room ? room - 1 : room));
        const runs = laned.flatMap((bar) =>
          visibleRuns(bar, roomFor).map((run) => ({ ...bar, ...run })),
        );
        const more = count.map(
          (total, column) =>
            total -
            runs.filter((run) => run.first <= column && run.last >= column)
              .length,
        );
        return { week, runs, more, roomFor };
      }),
    [weeks, placed, room],
  );

  const columns = perWeek + (preferences.showWeekNumbers ? 1 : 0);
  const keys = useGridKeys(grid, weeks.length, perWeek, () => {
    const index = today ? days.indexOf(today) : -1;
    return index === -1
      ? [0, 0]
      : [Math.floor(index / perWeek), index % perWeek];
  });

  return (
    // biome-ignore lint/a11y/useSemanticElements: a grid of days that the arrow keys move around, which a table isn't.
    <div
      ref={grid}
      role="grid"
      aria-label={label}
      aria-rowcount={weeks.length + 1}
      aria-colcount={columns}
      className={cx(
        "nuv-event-calendar__month",
        preferences.showWeekNumbers && "nuv-event-calendar__month--numbered",
      )}
      style={
        {
          "--nuv-event-days": perWeek,
          "--nuv-event-weeks": weeks.length,
        } as CSSProperties
      }
      onKeyDown={keys.onKeyDown}
    >
      <span aria-hidden="true" className="nuv-event-calendar__probe" />
      {/* biome-ignore lint/a11y/useSemanticElements: as above. */}
      {/* biome-ignore lint/a11y/useFocusableInteractive: a part of the grid that isn't a cell. The arrow keys move between the cells, which take the focus. */}
      <div role="row" className="nuv-event-calendar__weekdays">
        {preferences.showWeekNumbers ? (
          // biome-ignore lint/a11y/useSemanticElements: as above.
          // biome-ignore lint/a11y/useFocusableInteractive: as above.
          <div
            role="columnheader"
            aria-label={labels.week}
            className="nuv-event-calendar__week-number"
          />
        ) : null}
        {(weeks[0] ?? []).map((day) => (
          // biome-ignore lint/a11y/useSemanticElements: as above.
          // biome-ignore lint/a11y/useFocusableInteractive: as above.
          <div
            key={day}
            role="columnheader"
            aria-label={format.longWeekday(day)}
            className="nuv-event-calendar__weekday-head"
          >
            {format.weekday(day)}
          </div>
        ))}
      </div>
      {rows.map(({ week, runs, more, roomFor }, row) => (
        // biome-ignore lint/a11y/useSemanticElements: as above.
        // biome-ignore lint/a11y/useFocusableInteractive: as above.
        <div key={week[0]} role="row" className="nuv-event-calendar__week">
          {preferences.showWeekNumbers && week[0] ? (
            // biome-ignore lint/a11y/useSemanticElements: as above.
            // biome-ignore lint/a11y/useFocusableInteractive: as above.
            <div
              role="rowheader"
              aria-label={labels.weekNumber(weekNumber(week[0]))}
              className="nuv-event-calendar__week-number"
            >
              {weekNumber(week[0])}
            </div>
          ) : null}
          {week.map((day, column) => {
            const tabbable = keys.isActive(row, column);
            return (
              // biome-ignore lint/a11y/useSemanticElements: as above.
              <div
                key={day}
                role="gridcell"
                {...keys.cell(row, column)}
                tabIndex={keys.tabIndex(row, column)}
                aria-label={format.day(day)}
                aria-current={day === today ? "date" : undefined}
                data-outside={day.slice(0, 7) === month ? undefined : ""}
                className={cx(
                  "nuv-event-calendar__cell",
                  "nuv-event-calendar__cell--day",
                  day === today && "nuv-event-calendar__cell--today",
                )}
              >
                <button
                  type="button"
                  tabIndex={tabbable ? 0 : -1}
                  aria-label={format.fullDay(day)}
                  className="nuv-event-calendar__day-number"
                  onClick={() => goToDay(day)}
                >
                  {day.endsWith("-01")
                    ? format.shortDay(day)
                    : format.date(day)}
                </button>
                <div className="nuv-event-calendar__lanes">
                  {runs
                    .filter((run) => run.first === column)
                    .map((run) => (
                      <EventButton
                        key={run.item.event.id}
                        placed={run.item}
                        look={run.item.spansDays ? "bar" : "line"}
                        tabbable={tabbable}
                        startsBefore={run.item.firstDay < day}
                        endsAfter={run.item.lastDay > (week[run.last] ?? day)}
                        style={
                          {
                            "--nuv-event-lane": run.lane,
                            "--nuv-event-span": run.last - run.first + 1,
                          } as CSSProperties
                        }
                      />
                    ))}
                  {(more[column] ?? 0) > 0 ? (
                    <More
                      day={day}
                      placed={placed}
                      count={more[column] ?? 0}
                      lane={roomFor[column] ?? 0}
                      tabbable={tabbable}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
