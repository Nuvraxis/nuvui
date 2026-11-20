import { addDays, type DayKey } from "./dates";

/** Days from `from` to `to`, both included. */
export interface DayRange {
  from: DayKey;
  to: DayKey;
}

/**
 * The ranges, sorted, with those that overlap or touch made one. Days are
 * whole, so a range that ends the day before another starts runs into it.
 */
export function mergeRanges(ranges: readonly DayRange[]): DayRange[] {
  const sorted = ranges
    .filter((range) => range.from <= range.to)
    .sort((a, b) => a.from.localeCompare(b.from));
  const merged: DayRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.from <= addDays(last.to, 1)) {
      if (range.to > last.to) last.to = range.to;
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

/** The parts of `want` that none of `have` covers, in order. */
export function missingRanges(
  want: DayRange,
  have: readonly DayRange[],
): DayRange[] {
  if (want.from > want.to) return [];
  const missing: DayRange[] = [];
  let from = want.from;
  for (const range of mergeRanges(have)) {
    if (range.to < from) continue;
    if (range.from > want.to) break;
    if (range.from > from) {
      missing.push({ from, to: addDays(range.from, -1) });
    }
    from = addDays(range.to, 1);
    if (from > want.to) return missing;
  }
  missing.push({ from, to: want.to });
  return missing;
}

/** Whether two ranges share a day. */
export function overlaps(a: DayRange, b: DayRange): boolean {
  return a.from <= b.to && b.from <= a.to;
}
