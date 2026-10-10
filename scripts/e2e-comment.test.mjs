// Run with `pnpm test:scripts`.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import {
  commentBody,
  failuresIn,
  marker,
  plain,
  readReports,
} from "./e2e-comment.mjs";

// The shape Playwright's JSON reporter writes: files, groups inside them,
// and each test once for every browser setup.
const report = {
  suites: [
    {
      title: "selection.spec.ts",
      file: "selection.spec.ts",
      specs: [],
      suites: [
        {
          title: "action bar page",
          file: "selection.spec.ts",
          specs: [
            {
              title: "the playground changes the bar and the code together",
              file: "selection.spec.ts",
              line: 211,
              tests: [
                {
                  projectName: "desktop",
                  status: "unexpected",
                  results: [
                    { status: "failed", error: { message: "first go" } },
                    {
                      status: "failed",
                      error: {
                        message:
                          "\u001b[31mError: strict mode violation\u001b[39m\nCall log:\n  - waiting",
                      },
                    },
                  ],
                },
                {
                  projectName: "firefox",
                  status: "unexpected",
                  results: [
                    { status: "failed", error: { message: "Error: no" } },
                  ],
                },
                { projectName: "webkit", status: "expected", results: [] },
              ],
            },
            {
              title: "the bar is there while something is selected",
              file: "selection.spec.ts",
              line: 157,
              tests: [
                { projectName: "desktop", status: "flaky", results: [] },
                { projectName: "mobile", status: "skipped", results: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const run = {
  url: "https://github.com/Nuvraxis/nuvui/actions/runs/1",
  attempt: "2",
  sha: "0123456789abcdef0123456789abcdef01234567",
};

describe("plain", () => {
  test("makes one line, with no colors and no backticks", () => {
    assert.equal(plain("\u001b[31ma `b`\n  c\u001b[39m", 50), "a 'b' c");
  });

  test("cuts what's too long", () => {
    assert.equal(plain("abcdefgh", 5), "abcd…");
    assert.equal(plain("abcde", 5), "abcde");
  });

  test("takes anything", () => {
    assert.equal(plain(undefined, 5), "");
    assert.equal(plain(12, 5), "12");
  });
});

describe("failuresIn", () => {
  test("finds the tests that failed, with their group, browser setup and last error", () => {
    const { failed, flaky } = failuresIn(report);

    assert.equal(flaky, 1);
    assert.deepEqual(failed, [
      {
        file: "selection.spec.ts",
        line: 211,
        title:
          "action bar page › the playground changes the bar and the code together",
        project: "desktop",
        error: "Error: strict mode violation",
      },
      {
        file: "selection.spec.ts",
        line: 211,
        title:
          "action bar page › the playground changes the bar and the code together",
        project: "firefox",
        error: "Error: no",
      },
    ]);
  });

  test("makes nothing of a report that isn't one", () => {
    assert.deepEqual(failuresIn(undefined), { failed: [], flaky: 0 });
    assert.deepEqual(failuresIn({}), { failed: [], flaky: 0 });
    assert.deepEqual(failuresIn({ suites: [{ specs: [{ tests: [{}] }] }] }), {
      failed: [],
      flaky: 0,
    });
  });
});

describe("commentBody", () => {
  test("lists a test once, with every browser setup it failed in", () => {
    const body = commentBody({
      ...run,
      apps: [{ app: "docs", ...failuresIn(report) }],
      jobs: [{ name: "docs 2 of 5", url: "https://github.com/x/y/job/3" }],
    });

    assert.ok(body.startsWith(`${marker}\n### E2E: 2 tests failed\n`));
    assert.match(body, /attempt 2, on `0123456`\./);
    assert.match(body, /\*\*docs\*\*: 1 of its tests/);
    assert.equal(body.match(/selection\.spec\.ts:211/g)?.length, 1);
    assert.match(body, / {2}- In: `desktop`, `firefox`/);
    assert.match(body, / {2}- `Error: strict mode violation`/);
    assert.match(
      body,
      /- \[docs 2 of 5\]\(https:\/\/github\.com\/x\/y\/job\/3\)/,
    );
    assert.match(body, /1 more passed only when tried again\./);
    assert.match(body, /comment `retry:failed`/);
  });

  test("says so when everything passed, and doesn't offer a retry", () => {
    const body = commentBody({ ...run, apps: [], jobs: [] });

    assert.match(body, /### E2E: everything passed/);
    assert.doesNotMatch(body, /retry:/);
  });

  test("a job that failed with no tests to show is still said", () => {
    const body = commentBody({
      ...run,
      apps: [],
      jobs: [{ name: "Build the site", url: "https://github.com/x/y/job/1" }],
    });

    assert.match(body, /### E2E: a job failed before its tests could report/);
    assert.match(body, /\[Build the site\]/);
    assert.match(body, /retry:failed/);
  });

  test("text from a report can't mention, link or draw", () => {
    const body = commentBody({
      ...run,
      apps: [
        {
          app: "docs",
          flaky: 0,
          failed: failuresIn({
            suites: [
              {
                file: "a.spec.ts",
                specs: [
                  {
                    title: "` @everyone [x](https://evil.example) <img src=x>",
                    file: "a.spec.ts",
                    line: 1,
                    tests: [
                      {
                        projectName: "desktop",
                        status: "unexpected",
                        results: [],
                      },
                    ],
                  },
                ],
              },
            ],
          }).failed,
        },
      ],
      jobs: [],
    });
    const line = body.split("\n").find((text) => text.includes("@everyone"));

    // All of it is inside one pair of backticks, with none of its own.
    assert.equal(
      line,
      "- `a.spec.ts:1` `' @everyone [x](https://evil.example) <img src=x>`",
    );
  });

  test("lists no more than forty tests", () => {
    const failed = Array.from({ length: 45 }, (_, index) => ({
      file: "a.spec.ts",
      line: index + 1,
      title: `test ${index + 1}`,
      project: "desktop",
      error: "",
    }));
    const body = commentBody({
      ...run,
      apps: [{ app: "docs", failed, flaky: 0 }],
      jobs: [],
    });

    assert.equal(body.match(/^- `a\.spec\.ts:/gm)?.length, 40);
    assert.match(body, /Only the first 40 are listed\./);
    assert.ok(body.length < 65_536);
  });
});

describe("readReports", () => {
  test("adds the slices of an app together, and passes over what isn't a report", () => {
    const folder = mkdtempSync(path.join(tmpdir(), "e2e-comment-"));
    const write = (name, text) => {
      mkdirSync(path.join(folder, name), { recursive: true });
      writeFileSync(path.join(folder, name, "results.json"), text);
    };
    write("e2e-report-docs-1", JSON.stringify(report));
    write("e2e-report-docs-2", JSON.stringify(report));
    write("e2e-report-showcase-1", JSON.stringify({ suites: [] }));
    write("e2e-report-showcase-2", "{ half a fi");
    write("something-else", JSON.stringify(report));
    mkdirSync(path.join(folder, "e2e-report-docs-3"));

    const apps = readReports(folder);

    assert.deepEqual(
      apps.map((app) => [app.app, app.failed.length, app.flaky]),
      [
        ["docs", 4, 2],
        ["showcase", 0, 0],
      ],
    );
  });

  test("a folder that isn't there has no reports", () => {
    assert.deepEqual(
      readReports(path.join(tmpdir(), "no-such-folder-here")),
      [],
    );
  });
});
