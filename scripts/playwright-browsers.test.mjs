// Run with `pnpm test:scripts`.
import assert from "node:assert/strict";
import path from "node:path";
import { describe, test } from "node:test";
import { allInstalled, locations } from "./playwright-browsers.mjs";

// What `playwright install --dry-run` prints, cut to two browsers.
const printed = `Chrome for Testing 153.0.8010.12 (playwright chromium v1243)
  Install location:    /home/runner/.cache/ms-playwright/chromium-1243
  Download url:        https://cdn.playwright.dev/builds/cft/153.0.8010.12/linux64/chrome-linux64.zip

WebKit 26.6 (playwright webkit v2359)
  Install location:    /home/runner/.cache/ms-playwright/webkit-2359\r
  Download url:        https://cdn.playwright.dev/dbazure/download/playwright/builds/webkit/2359/webkit-ubuntu-24.04.zip
  Download fallback 1: https://playwright.download.prss.microsoft.com/x.zip
`;

describe("locations", () => {
  test("finds each folder, and nothing else", () => {
    assert.deepEqual(locations(printed), [
      "/home/runner/.cache/ms-playwright/chromium-1243",
      "/home/runner/.cache/ms-playwright/webkit-2359",
    ]);
  });

  test("finds none in something else", () => {
    assert.deepEqual(locations("playwright: command not found"), []);
  });
});

describe("allInstalled", () => {
  const folders = locations(printed);
  const done = (folder) => path.join(folder, "INSTALLATION_COMPLETE");

  test("is yes when every folder has a finished install", () => {
    const there = new Set(folders.map(done));
    assert.equal(
      allInstalled(folders, (file) => there.has(file)),
      true,
    );
  });

  test("is no when one is missing, or was left half done", () => {
    const there = new Set([done(folders[0]), folders[1]]);
    assert.equal(
      allInstalled(folders, (file) => there.has(file)),
      false,
    );
  });

  test("is no when there was nothing to look for", () => {
    assert.equal(
      allInstalled([], () => true),
      false,
    );
  });
});
