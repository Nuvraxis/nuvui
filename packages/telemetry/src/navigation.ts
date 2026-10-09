// A navigation inside the app starts in one place and ends in another:
// Next calls a hook in instrumentation-client.ts when it starts, and a
// component sees the new address when it's rendered. The start is left as
// a mark on the browser's own performance timeline, so the two don't have
// to share anything else.
const mark = "nuvui.navigation";

/** Call when a navigation inside the app starts. */
export function markNavigation(type?: string): void {
  try {
    // One at a time. A navigation that never changed the address, such as
    // one to a heading on the same page, leaves a mark nobody took.
    performance.clearMarks(mark);
    performance.mark(mark, { detail: type });
  } catch {
    // A browser without marks has nothing to measure with.
  }
}

/**
 * How long ago the navigation that was marked started, in milliseconds,
 * and takes the mark away. Undefined when none was marked, as on the first
 * page, which the browser loaded.
 */
export function takeNavigation():
  | { duration: number; type: string | undefined }
  | undefined {
  try {
    const started = performance.getEntriesByName(mark, "mark").at(-1);
    if (!started) return undefined;
    performance.clearMarks(mark);
    const { detail } = started as PerformanceMark;
    return {
      duration: performance.now() - started.startTime,
      type: typeof detail === "string" ? detail : undefined,
    };
  } catch {
    return undefined;
  }
}

/**
 * Calls back once the browser has painted what was just rendered. Returns
 * a function that calls it off.
 *
 * The first frame is the one the change is drawn in, and a callback in it
 * runs before the drawing. The second runs after.
 */
export function afterPaint(callback: () => void): () => void {
  let second = 0;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(callback);
  });
  return () => {
    cancelAnimationFrame(first);
    cancelAnimationFrame(second);
  };
}
