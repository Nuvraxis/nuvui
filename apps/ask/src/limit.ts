export { callerOf } from "../../mcp/src/limit.ts";

const minute = 60_000;

export type Verdict = { ok: true } | { ok: false; retryAfter: number };

/**
 * Counts each caller's questions in the current minute. It's per pod: with
 * several replicas, a caller's limit is this times their number. The edge's
 * own rate limit is what stops a flood; this keeps one visitor from using
 * up the pod.
 */
export function createLimiter({
  perMinute,
  now = Date.now,
}: {
  perMinute: number;
  now?: () => number;
}) {
  const windows = new Map<string, { start: number; count: number }>();

  return (caller: string): Verdict => {
    const time = now();
    // A caller seen once is forgotten when its minute is over.
    if (windows.size > 10_000) {
      for (const [key, window] of windows) {
        if (time - window.start >= minute) windows.delete(key);
      }
    }
    let window = windows.get(caller);
    if (!window || time - window.start >= minute) {
      window = { start: time, count: 0 };
      windows.set(caller, window);
    }
    window.count += 1;
    if (window.count <= perMinute) return { ok: true };
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((window.start + minute - time) / 1000)),
    };
  };
}

/**
 * How many questions are being answered at once. Each one holds a call to
 * the model open, so past `max` the next is turned away rather than kept
 * waiting.
 */
export function createGate(max: number) {
  let open = 0;
  return {
    get open() {
      return open;
    },
    /** A function that lets go of the place, or nothing when they're all taken. */
    enter(): (() => void) | undefined {
      if (open >= max) return undefined;
      open += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        open -= 1;
      };
    },
  };
}
