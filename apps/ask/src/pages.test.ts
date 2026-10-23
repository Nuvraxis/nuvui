import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { urlOf } from "./pages.ts";

describe("urlOf", () => {
  test("a page is at its path under /docs, and a folder's index at the folder", () => {
    assert.equal(urlOf("index"), "https://nuvui.nuvraxis.com/docs");
    assert.equal(
      urlOf("components/button"),
      "https://nuvui.nuvraxis.com/docs/components/button",
    );
    assert.equal(
      urlOf("kanban/index"),
      "https://nuvui.nuvraxis.com/docs/kanban",
    );
  });
});
