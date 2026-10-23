import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { verifyTurnstile } from "./turnstile.ts";

const answering =
  (body: unknown, status = 200, sent: { body?: string } = {}) =>
  async (_url: string | URL | Request, init?: RequestInit) => {
    sent.body = String(init?.body);
    return new Response(JSON.stringify(body), { status });
  };

describe("verifyTurnstile", () => {
  test("is a yes when Cloudflare says so, and sends the secret, the token and the address", async () => {
    const sent: { body?: string } = {};
    const passed = await verifyTurnstile({
      secret: "s",
      token: "t",
      remoteIp: "203.0.113.7",
      fetch: answering({ success: true }, 200, sent),
    });
    assert.equal(passed, true);
    assert.equal(sent.body, "secret=s&response=t&remoteip=203.0.113.7");
  });

  test("is a no for a no, an error, or no answer", async () => {
    assert.equal(
      await verifyTurnstile({
        secret: "s",
        token: "t",
        fetch: answering({ success: false }),
      }),
      false,
    );
    assert.equal(
      await verifyTurnstile({
        secret: "s",
        token: "t",
        fetch: answering({}, 500),
      }),
      false,
    );
    assert.equal(
      await verifyTurnstile({
        secret: "s",
        token: "t",
        fetch: async () => {
          throw new Error("offline");
        },
      }),
      false,
    );
  });
});
