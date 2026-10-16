import type { IncomingMessage } from "node:http";

export interface LimitOptions {
  /** How many requests one caller may make in a minute. */
  perMinute: number;
  /**
   * How many proxies in front of the server add to `X-Forwarded-For`, such
   * as a CDN and an ingress. With none, the caller is the address the
   * connection came from.
   */
  trustedProxies: number;
  /** Called each time a request is refused. */
  onLimited?: () => void;
  now?: () => number;
}

const minute = 60_000;

/**
 * Who a request is from. Each proxy adds the address it was reached from to
 * the end of `X-Forwarded-For`, and a caller can write anything at its
 * start. So the address taken is the one the outermost trusted proxy saw,
 * counted from the end.
 */
export function callerOf(request: IncomingMessage, trustedProxies: number) {
  const direct = request.socket?.remoteAddress ?? "unknown";
  if (trustedProxies <= 0) return direct;
  const header = request.headers["x-forwarded-for"];
  const chain = (Array.isArray(header) ? header.join(",") : (header ?? ""))
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (chain.length === 0) return direct;
  return chain[Math.max(0, chain.length - trustedProxies)] ?? direct;
}

/**
 * Counts each caller's requests in the current minute, and refuses the
 * ones over the limit with a 429. It's per process: with several replicas,
 * a caller's limit is this times their number.
 */
export function createLimiter({
  perMinute,
  trustedProxies,
  onLimited,
  now = Date.now,
}: LimitOptions) {
  const windows = new Map<string, { start: number; count: number }>();

  return async (request: IncomingMessage) => {
    const time = now();
    // A caller seen once is forgotten when its minute is over.
    if (windows.size > 10_000) {
      for (const [key, window] of windows) {
        if (time - window.start >= minute) windows.delete(key);
      }
    }

    const caller = callerOf(request, trustedProxies);
    let window = windows.get(caller);
    if (!window || time - window.start >= minute) {
      window = { start: time, count: 0 };
      windows.set(caller, window);
    }
    window.count += 1;

    if (window.count > perMinute) {
      onLimited?.();
      const wait = Math.max(
        1,
        Math.ceil((window.start + minute - time) / 1000),
      );
      throw new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32000,
            message: `Too many requests. Try again in ${wait} seconds.`,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(wait),
          },
        },
      );
    }
    // What FastMCP keeps as the session's sign-in. There's none to keep.
    return {};
  };
}
