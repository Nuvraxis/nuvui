import type { IncomingMessage } from "node:http";
import { describe, expect, test, vi } from "vitest";
import { callerOf, createLimiter } from "./limit";

const request = (address: string, forwarded?: string) =>
  ({
    socket: { remoteAddress: address },
    headers: forwarded === undefined ? {} : { "x-forwarded-for": forwarded },
  }) as unknown as IncomingMessage;

describe("who a request is from", () => {
  test("with no proxy in front, the connection's address, whatever the header says", () => {
    expect(callerOf(request("10.0.0.5", "1.1.1.1"), 0)).toBe("10.0.0.5");
  });

  test("behind one proxy, the address it saw, and not what the caller wrote before it", () => {
    expect(callerOf(request("10.0.0.5", "6.6.6.6, 203.0.113.9"), 1)).toBe(
      "203.0.113.9",
    );
  });

  test("behind two, the address the outer one saw", () => {
    expect(
      callerOf(request("10.0.0.5", "6.6.6.6, 203.0.113.9, 10.1.1.1"), 2),
    ).toBe("203.0.113.9");
  });

  test("a header shorter than the proxies in front gives its first address", () => {
    expect(callerOf(request("10.0.0.5", "203.0.113.9"), 3)).toBe("203.0.113.9");
    expect(callerOf(request("10.0.0.5"), 1)).toBe("10.0.0.5");
  });
});

describe("the limit", () => {
  test("lets a caller make so many requests a minute, then refuses with a 429", async () => {
    const onLimited = vi.fn();
    const limit = createLimiter({
      perMinute: 2,
      trustedProxies: 0,
      onLimited,
      now: () => 0,
    });

    await expect(limit(request("a"))).resolves.toEqual({});
    await expect(limit(request("a"))).resolves.toEqual({});
    const refused = await limit(request("a")).catch((error: unknown) => error);

    expect(refused).toBeInstanceOf(Response);
    const response = refused as Response;
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32000, message: expect.stringContaining("60 seconds") },
    });
    expect(onLimited).toHaveBeenCalledTimes(1);
  });

  test("counts each caller on their own", async () => {
    const limit = createLimiter({
      perMinute: 1,
      trustedProxies: 0,
      now: () => 0,
    });

    await limit(request("a"));
    await expect(limit(request("b"))).resolves.toEqual({});
    await expect(limit(request("a"))).rejects.toBeInstanceOf(Response);
  });

  test("starts again when the caller's minute is over, and says how long is left", async () => {
    let time = 0;
    const limit = createLimiter({
      perMinute: 1,
      trustedProxies: 0,
      now: () => time,
    });

    await limit(request("a"));
    time = 45_000;
    const refused = (await limit(request("a")).catch(
      (error: unknown) => error,
    )) as Response;
    expect(refused.headers.get("Retry-After")).toBe("15");

    time = 60_000;
    await expect(limit(request("a"))).resolves.toEqual({});
  });
});
