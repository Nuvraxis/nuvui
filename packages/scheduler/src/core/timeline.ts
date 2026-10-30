import {
  addDays,
  addMonths,
  type DayKey,
  dayOf,
  daysBetween,
  daysFrom,
  endOfMonth,
  minutesOf,
  startOfMonth,
  startOfWeek,
} from "./dates";
import type { PlacedEvent } from "./events";
import { stackLanes } from "./layout";
import type { CalendarResource, ResourceIndex } from "./resources";

/**
 * What a column of the timeline is: an hour, a day, a week, a month or a
 * year.
 */
export type TimelineScale = "hours" | "days" | "weeks" | "months" | "years";

export const timelineScales: readonly TimelineScale[] = [
  "hours",
  "days",
  "weeks",
  "months",
  "years",
];

/**
 * How much each scale shows at once: days for `hours`, months for `days`
 * and `weeks`, and years for `months` and `years`.
 */
export const defaultSpans: Record<TimelineScale, number> = {
  hours: 3,
  days: 1,
  weeks: 3,
  months: 1,
  years: 10,
};

/** A column: an hour of a day, or a run of whole days. */
export interface TimelineColumn {
  first: DayKey;
  /** The last day it covers, included. */
  last: DayKey;
  /** The hour, on the hours scale. */
  hour?: number;
}

/**
 * Columns under one name in the header's top row: a day of hours, or a
 * month or a year of the rest. `day` is a day in it, for its name.
 */
export interface TimelineGroup {
  first: number;
  count: number;
  day: DayKey;
}

export interface TimelineAxis {
  scale: TimelineScale;
  columns: TimelineColumn[];
  groups: TimelineGroup[];
  /** The first and last day the columns cover. */
  first: DayKey;
  last: DayKey;
  /** The hours of each day shown on the hours scale, the last not included. */
  hours: readonly [number, number];
}

const yearOf = (day: DayKey) => Number(day.slice(0, 4));
const pad = (year: number) => String(year).padStart(4, "0");

/** The first day of the period a day is in. */
export function periodStart(
  scale: TimelineScale,
  day: DayKey,
  span: number,
): DayKey {
  switch (scale) {
    case "hours":
      return day;
    case "days":
    case "weeks":
      return startOfMonth(day);
    case "months":
      return `${day.slice(0, 4)}-01-01`;
    default:
      // A decade from a year ending in 0, or as many years as asked for.
      return `${pad(Math.floor(yearOf(day) / span) * span)}-01-01`;
  }
}

/** The first day of the period `by` periods on from the one starting `start`. */
export function shiftPeriod(
  scale: TimelineScale,
  start: DayKey,
  span: number,
  by: number,
): DayKey {
  switch (scale) {
    case "hours":
      return addDays(start, by * span);
    case "days":
    case "weeks":
      return addMonths(start, by * span);
    default:
      return addMonths(start, by * span * 12);
  }
}

// Consecutive columns grouped by what `key` gives each.
function groupBy(
  columns: readonly TimelineColumn[],
  key: (column: TimelineColumn) => string,
  day: (column: TimelineColumn) => DayKey,
): TimelineGroup[] {
  const groups: TimelineGroup[] = [];
  let current = "";
  columns.forEach((column, index) => {
    const name = key(column);
    const last = groups[groups.length - 1];
    if (last && name === current) last.count += 1;
    else groups.push({ first: index, count: 1, day: day(column) });
    current = name;
  });
  return groups;
}

/**
 * The columns of a period: `span` days of hours from `start`, or `span`
 * months of days or weeks, or `span` years of months, or `span` years.
 * A week belongs to the month its fourth day is in.
 */
export function axisOf(
  scale: TimelineScale,
  start: DayKey,
  span: number,
  weekStartsOn: number,
  hours: readonly [number, number],
): TimelineAxis {
  const count = Math.max(1, Math.floor(span));
  const [from, to] = hours;
  let columns: TimelineColumn[];
  let groups: TimelineGroup[];
  switch (scale) {
    case "hours": {
      const days = daysFrom(start, addDays(start, count - 1));
      columns = days.flatMap((day) =>
        Array.from({ length: to - from }, (_, index) => ({
          first: day,
          last: day,
          hour: from + index,
        })),
      );
      groups = days.map((day, index) => ({
        first: index * (to - from),
        count: to - from,
        day,
      }));
      break;
    }
    case "days": {
      const last = endOfMonth(addMonths(start, count - 1));
      columns = daysFrom(start, last).map((day) => ({ first: day, last: day }));
      groups = groupBy(
        columns,
        (column) => column.first.slice(0, 7),
        (column) => column.first,
      );
      break;
    }
    case "weeks": {
      const last = endOfMonth(addMonths(start, count - 1));
      columns = [];
      for (
        let week = startOfWeek(start, weekStartsOn);
        week <= last;
        week = addDays(week, 7)
      ) {
        columns.push({ first: week, last: addDays(week, 6) });
      }
      const middle = (column: TimelineColumn) => addDays(column.first, 3);
      groups = groupBy(columns, (column) => middle(column).slice(0, 7), middle);
      break;
    }
    case "months": {
      columns = Array.from({ length: count * 12 }, (_, index) => {
        const first = addMonths(start, index);
        return { first, last: endOfMonth(first) };
      });
      groups = groupBy(
        columns,
        (column) => column.first.slice(0, 4),
        (column) => column.first,
      );
      break;
    }
    default: {
      const year = yearOf(start);
      columns = Array.from({ length: count }, (_, index) => ({
        first: `${pad(year + index)}-01-01`,
        last: `${pad(year + index)}-12-31`,
      }));
      groups = [];
    }
  }
  return {
    scale,
    columns,
    groups,
    first: columns[0]?.first ?? start,
    last: columns[columns.length - 1]?.last ?? start,
    hours,
  };
}

/** The column a day is in, or -1 when it's outside the axis. */
export function columnOf(axis: TimelineAxis, day: DayKey): number {
  if (day < axis.first || day > axis.last) return -1;
  if (axis.scale === "hours") {
    return daysBetween(axis.first, day) * (axis.hours[1] - axis.hours[0]);
  }
  // The last column that starts on or before the day.
  let low = 0;
  let high = axis.columns.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((axis.columns[middle]?.first ?? "") <= day) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * Where a time on the clock shown falls, in columns from the start of the
 * axis, and whether it had to be moved to be there: it's before or after
 * the days shown, or in the hours left out.
 */
export function positionOf(
  axis: TimelineAxis,
  day: DayKey,
  minute: number,
): { at: number; clipped: boolean } {
  const total = axis.columns.length;
  if (day < axis.first) return { at: 0, clipped: true };
  if (day > axis.last) return { at: total, clipped: true };
  if (axis.scale === "hours") {
    const [from, to] = axis.hours;
    const perDay = to - from;
    const into = minute / 60 - from;
    const shown = Math.min(Math.max(into, 0), perDay);
    return {
      at: daysBetween(axis.first, day) * perDay + shown,
      clipped: shown !== into,
    };
  }
  const index = columnOf(axis, day);
  const column = axis.columns[index];
  if (!column) return { at: 0, clipped: true };
  const length = daysBetween(column.first, column.last) + 1;
  return {
    at: index + (daysBetween(column.first, day) + minute / 1440) / length,
    clipped: false,
  };
}

/**
 * Where a moment that ends something falls. Midnight is the end of the
 * day before, so an event that ends then doesn't reach into the next.
 */
export function endPositionOf(
  axis: TimelineAxis,
  day: DayKey,
  minute: number,
): { at: number; clipped: boolean } {
  return minute === 0
    ? positionOf(axis, addDays(day, -1), 1440)
    : positionOf(axis, day, minute);
}

/**
 * The day, and the minute on the hours scale, a fraction of the way into
 * a column.
 */
export function spotIn(
  axis: TimelineAxis,
  column: number,
  fraction: number,
): { day: DayKey; minute: number | null } | null {
  const found = axis.columns[column];
  if (!found) return null;
  const into = Math.min(Math.max(fraction, 0), 1);
  if (found.hour !== undefined) {
    return {
      day: found.first,
      minute: found.hour * 60 + Math.min(into, 59 / 60) * 60,
    };
  }
  const length = daysBetween(found.first, found.last) + 1;
  return {
    day: addDays(found.first, Math.min(Math.floor(into * length), length - 1)),
    minute: null,
  };
}

/** A row of the timeline: a resource, or the events that have none. */
export interface TimelineRow {
  /** The resource's id, or `null` for the row of events with none. */
  id: string | null;
  resource: CalendarResource | null;
  /** How many resources it's inside. */
  depth: number;
  /** It has resources inside it, which can fold away. */
  parent: boolean;
}

/**
 * The resources as rows, each followed by those inside it unless it's
 * folded.
 */
export function rowsOf(
  resources: readonly CalendarResource[],
  collapsed: ReadonlySet<string>,
): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const walk = (list: readonly CalendarResource[], depth: number) => {
    for (const resource of list) {
      const children = resource.children ?? [];
      rows.push({
        id: resource.id,
        resource,
        depth,
        parent: children.length > 0,
      });
      if (!collapsed.has(resource.id)) walk(children, depth + 1);
    }
  };
  walk(resources, 0);
  return rows;
}

/**
 * The events in each row, by the row's id: an event is in the row of each
 * of its resources that's shown, and one with no resource the timeline
 * knows is in the row for none, `""`. One whose resources are all folded
 * away isn't in any.
 */
export function eventsByRow(
  placed: readonly PlacedEvent[],
  rows: readonly TimelineRow[],
  index: ResourceIndex,
): Map<string, PlacedEvent[]> {
  const shown = new Set(rows.map((row) => row.id ?? ""));
  const byRow = new Map<string, PlacedEvent[]>();
  const add = (row: string, item: PlacedEvent) => {
    if (!shown.has(row)) return;
    const list = byRow.get(row);
    if (list) list.push(item);
    else byRow.set(row, [item]);
  };
  for (const item of placed) {
    const known = (item.event.resourceIds ?? []).filter((id) => index.has(id));
    if (known.length === 0) add("", item);
    for (const id of new Set(known)) add(id, item);
  }
  return byRow;
}

/** An event as a bar along its row. */
export interface TimelineBar {
  placed: PlacedEvent;
  /** Where it starts, in columns from the start of the axis. */
  start: number;
  /** How many columns long it's drawn, never less than the shortest. */
  length: number;
  lane: number;
  /** It starts before what's shown: an earlier day, or an hour left out. */
  startsBefore: boolean;
  endsAfter: boolean;
}

/**
 * The bars of a row's events, each in the first lane free along the time
 * it covers. `shortest` is the least a bar is drawn, in columns, so one
 * with no length can still be seen and pressed. An event that's wholly in
 * hours left out isn't drawn.
 */
export function barsOf(
  axis: TimelineAxis,
  placed: readonly PlacedEvent[],
  timeZone: string,
  shortest: number,
): { bars: TimelineBar[]; lanes: number } {
  const [from, to] = axis.hours;
  const hourly = axis.scale === "hours";
  const total = axis.columns.length;
  const items = placed.flatMap((item) => {
    // A whole day is the hours shown of it, so it isn't cut by them.
    const start = item.allDay
      ? positionOf(axis, item.firstDay, hourly ? from * 60 : 0)
      : positionOf(
          axis,
          dayOf(item.start, timeZone),
          minutesOf(item.start, timeZone),
        );
    const end = item.allDay
      ? positionOf(axis, item.lastDay, hourly ? to * 60 : 1440)
      : endPositionOf(
          axis,
          dayOf(item.end, timeZone),
          minutesOf(item.end, timeZone),
        );
    const lasts = item.end.getTime() > item.start.getTime();
    if (lasts ? end.at <= start.at : start.clipped) return [];
    if (start.at >= total || end.at <= 0) return [];
    return [
      {
        item,
        start: start.at,
        end: start.at + Math.max(end.at - start.at, shortest),
        startsBefore: start.clipped,
        endsAfter: end.clipped,
      },
    ];
  });
  items.sort(
    (a, b) =>
      a.start - b.start ||
      b.end - a.end ||
      a.item.event.title.localeCompare(b.item.event.title),
  );
  const laned = stackLanes(items.map((bar) => ({ ...bar, item: bar })));
  return {
    bars: laned.map(({ item: bar, lane }) => ({
      placed: bar.item,
      start: bar.start,
      length: bar.end - bar.start,
      lane,
      startsBefore: bar.startsBefore,
      endsAfter: bar.endsAfter,
    })),
    lanes: Math.max(0, ...laned.map((bar) => bar.lane + 1)),
  };
}
