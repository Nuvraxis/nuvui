/** Where a timed event sits across its day, in columns. */
export interface Arranged<T> {
  item: T;
  /** The first column it takes, from 0. */
  column: number;
  /** How many columns it takes. */
  span: number;
  /** How many columns its group of overlapping events has. */
  columns: number;
}

interface Timed {
  startMinute: number;
  endMinute: number;
}

/**
 * Events that overlap side by side. Each group of events that overlap one
 * another, directly or through others, is split into as many columns as
 * it needs. An event takes the first column free when it starts, then
 * widens into the columns beside it that stay free for as long as it
 * lasts.
 *
 * `minimum` is the shortest an event is drawn, in minutes, so that two
 * short events one after the other don't cover each other.
 */
export function arrangeDay<T extends Timed>(
  items: readonly T[],
  minimum = 30,
): Arranged<T>[] {
  const end = (item: T) => Math.max(item.endMinute, item.startMinute + minimum);
  const sorted = [...items].sort(
    (a, b) => a.startMinute - b.startMinute || end(b) - end(a),
  );

  const result: Arranged<T>[] = [];
  let group: { item: T; column: number }[] = [];
  let groupEnd = -1;

  const close = () => {
    const columns = Math.max(0, ...group.map((placed) => placed.column + 1));
    for (const placed of group) {
      let span = 1;
      while (
        placed.column + span < columns &&
        !group.some(
          (other) =>
            other.column === placed.column + span &&
            other.item.startMinute < end(placed.item) &&
            placed.item.startMinute < end(other.item),
        )
      ) {
        span += 1;
      }
      result.push({ item: placed.item, column: placed.column, span, columns });
    }
    group = [];
  };

  for (const item of sorted) {
    if (item.startMinute >= groupEnd) {
      close();
      groupEnd = -1;
    }
    // The first column whose events have all ended by now.
    let column = 0;
    while (
      group.some(
        (placed) =>
          placed.column === column && end(placed.item) > item.startMinute,
      )
    ) {
      column += 1;
    }
    group.push({ item, column });
    groupEnd = Math.max(groupEnd, end(item));
  }
  close();
  return result;
}

/** Where a bar across days sits: its row, and the columns it covers. */
export interface Laned<T> {
  item: T;
  lane: number;
  /** The first and last column it covers, both included. */
  first: number;
  last: number;
}

/**
 * Bars across a row of days, each in the first lane that's free for all
 * the days it covers. They're taken in the order given, so the caller
 * decides which come first.
 */
export function packLanes<T>(
  items: readonly { item: T; first: number; last: number }[],
): Laned<T>[] {
  // The last column taken in each lane so far.
  const lanes: number[] = [];
  return items.map(({ item, first, last }) => {
    let lane = lanes.findIndex((taken) => taken < first);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = last;
    return { item, lane, first, last };
  });
}

/**
 * Bars along a row, each in the first lane where the bar before it has
 * ended by the time it starts. `start` and `end` can be anywhere between
 * columns. They're taken in the order given.
 */
export function stackLanes<T>(
  items: readonly { item: T; start: number; end: number }[],
): { item: T; lane: number }[] {
  // Where each lane is taken up to so far.
  const lanes: number[] = [];
  return items.map(({ item, start, end }) => {
    let lane = lanes.findIndex((taken) => taken <= start);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = end;
    return { item, lane };
  });
}

/**
 * Runs of columns where a bar is shown, given how many lanes each column
 * has room for. A bar in a lane past a column's room is left out of that
 * column and counted in its "more".
 */
export function visibleRuns(
  laned: { lane: number; first: number; last: number },
  room: readonly number[],
): { first: number; last: number }[] {
  const runs: { first: number; last: number }[] = [];
  for (let column = laned.first; column <= laned.last; column += 1) {
    if (laned.lane >= (room[column] ?? 0)) continue;
    const previous = runs[runs.length - 1];
    if (previous && previous.last === column - 1) previous.last = column;
    else runs.push({ first: column, last: column });
  }
  return runs;
}
