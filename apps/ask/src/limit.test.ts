import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createGate, createLimiter } from "./limit.ts";

describe("createLimiter", () => {
  test("lets a caller ask as many as the limit in a minute, then says when to try again", () => {
    let time = 0;
    const limit = createLimiter({ perMinute: 2, now: () => time });
    assert.deepEqual(limit("a"), { ok: true });
    assert.deepEqual(limit("a"), { ok: true });
    time = 15_000;
    assert.deepEqual(limit("a"), { ok: false, retryAfter: 45 });
    // Another caller has a minute of their own.
    assert.deepEqual(limit("b"), { ok: true });
  });

  test("starts again once the minute is over", () => {
    let time = 0;
    const limit = createLimiter({ perMinute: 1, now: () => time });
    limit("a");
    assert.equal(limit("a").ok, false);
    time = 60_000;
    assert.equal(limit("a").ok, true);
  });
});

describe("createGate", () => {
  test("lets in as many as it's given, and one more once one leaves", () => {
    const gate = createGate(2);
    const first = gate.enter();
    const second = gate.enter();
    assert.ok(first && second);
    assert.equal(gate.enter(), undefined);
    first();
    // Letting go twice frees one place, not two.
    first();
    assert.equal(gate.open, 1);
    assert.ok(gate.enter());
    assert.equal(gate.enter(), undefined);
  });
});
