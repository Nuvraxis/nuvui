import { expect, test } from "vitest";

// Every test outside touch.test.tsx takes a mouse for granted: controls are
// their denser size and hover styles apply. If the browser stops reporting
// one, the tests that measure a size fail, and this one says why.
test("the browser reports a mouse", () => {
  expect(matchMedia("(pointer: fine)").matches).toBe(true);
  expect(matchMedia("(hover: hover)").matches).toBe(true);
});
