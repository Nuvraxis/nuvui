// Writes the end-to-end tests' failures into a comment on the pull request,
// and keeps that one comment up to date from run to run.
//
// Run by .github/workflows/e2e-report.yml after the E2E workflow finishes.
// The reports it reads were written by a pull request's own code, which for
// a fork is a stranger's. Nothing from a report is run, and every piece of
// text from one goes into the comment as code, cut to a length, so it can't
// mention anyone, link anywhere or draw anything.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { argv, env } from "node:process";
import { pathToFileURL } from "node:url";

/** The first line of every comment this writes. It's how the comment is found again. */
export const marker = "<!-- nuvui-e2e-report -->";

// A comment can be 65,536 characters. This many tests is far inside that,
// and more than anyone reads.
const mostTests = 40;

// Colors a terminal draws, which Playwright puts in its messages.
// biome-ignore lint/suspicious/noControlCharactersInRegex: the escape character is what's being looked for
const colors = /\u001b\[[0-9;]*m/g;

/**
 * Text from a report, made safe to show: one line, no terminal colors, no
 * backticks to end the code it's put in, and no longer than `most`.
 *
 * @param {unknown} text
 * @param {number} most
 */
export function plain(text, most) {
  const line = String(text ?? "")
    .replace(colors, "")
    .replace(/`/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return line.length > most ? `${line.slice(0, most - 1)}…` : line;
}

/**
 * The tests in one of Playwright's JSON reports that failed, and how many
 * only passed when tried again.
 *
 * @param {any} report
 * @returns {{ failed: { file: string, line: number, title: string, project: string, error: string }[], flaky: number }}
 */
export function failuresIn(report) {
  const failed = [];
  let flaky = 0;

  const walk = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status === "flaky") flaky += 1;
        if (test.status !== "unexpected") continue;
        const last = (test.results ?? []).at(-1);
        failed.push({
          file: plain(spec.file ?? suite.file, 120),
          line: Number(spec.line) || 0,
          title: plain([...titles, spec.title].join(" › "), 200),
          project: plain(test.projectName, 40),
          // The first line says what was expected. The rest is the call
          // log, which is in the run.
          error: plain(String(last?.error?.message ?? "").split("\n")[0], 200),
        });
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child, child.title ? [...titles, child.title] : titles);
    }
  };
  // The outermost suites are the files, whose names are already kept. The
  // ones inside them are the groups a test is in.
  for (const suite of report?.suites ?? []) walk(suite, []);

  return { failed, flaky };
}

/**
 * The comment.
 *
 * @param {object} run
 * @param {{ app: string, failed: ReturnType<typeof failuresIn>["failed"], flaky: number }[]} run.apps
 * @param {{ name: string, url: string }[]} run.jobs The jobs that failed.
 * @param {string} run.url
 * @param {string} run.attempt
 * @param {string} run.sha
 */
export function commentBody({ apps, jobs, url, attempt, sha }) {
  const total = apps.reduce((sum, app) => sum + app.failed.length, 0);
  const flaky = apps.reduce((sum, app) => sum + app.flaky, 0);
  const where = `[The run](${url}), attempt ${Number(attempt) || 1}, on \`${plain(sha, 40).slice(0, 7)}\`.`;
  const lines = [marker];

  if (total === 0 && jobs.length === 0) {
    lines.push("### E2E: everything passed", "", where);
    if (flaky > 0) {
      lines.push("", `${flaky} passed only when tried again.`);
    }
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    total > 0
      ? `### E2E: ${total} ${total === 1 ? "test" : "tests"} failed`
      : "### E2E: a job failed before its tests could report",
    "",
    where,
  );

  let room = mostTests;
  for (const app of apps) {
    if (app.failed.length === 0) continue;
    // One line for a test, with every browser setup it failed in.
    const tests = new Map();
    for (const failure of app.failed) {
      const key = `${failure.file}:${failure.line} ${failure.title}`;
      const test = tests.get(key) ?? { ...failure, projects: [] };
      test.projects.push(failure.project);
      tests.set(key, test);
    }
    lines.push("", `**${plain(app.app, 20)}**: ${tests.size} of its tests`, "");
    for (const test of tests.values()) {
      if (room === 0) break;
      room -= 1;
      lines.push(
        `- \`${test.file}:${test.line}\` \`${test.title}\``,
        `  - In: ${test.projects.map((name) => `\`${name}\``).join(", ")}`,
      );
      if (test.error) lines.push(`  - \`${test.error}\``);
    }
  }
  if (room === 0) {
    lines.push(
      "",
      `Only the first ${mostTests} are listed. The run has the rest.`,
    );
  }

  if (jobs.length > 0) {
    lines.push("", "**Jobs that failed**", "");
    for (const job of jobs) {
      lines.push(
        `- [${plain(job.name, 80).replace(/[[\]]/g, "")}](${job.url})`,
      );
    }
  }
  if (flaky > 0) {
    lines.push("", `${flaky} more passed only when tried again.`);
  }
  lines.push(
    "",
    "To run the jobs that failed again, comment `retry:failed`. To run all of them again, `retry:all`.",
  );
  return `${lines.join("\n")}\n`;
}

/**
 * The reports in a folder of downloaded artifacts, one folder to a slice,
 * named `e2e-report-<app>-<slice>`. Slices of one app are added together.
 *
 * @param {string} folder
 */
export function readReports(folder) {
  const apps = new Map();
  if (!existsSync(folder)) return [];
  for (const name of readdirSync(folder).sort()) {
    const match = /^e2e-report-([a-z]+)-\d+$/.exec(name);
    const file = path.join(folder, name, "results.json");
    if (!match || !existsSync(file)) continue;
    let report;
    try {
      report = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      // A slice that was stopped part way leaves half a file. Its job is
      // in the list of jobs that failed.
      continue;
    }
    const app = apps.get(match[1]) ?? { app: match[1], failed: [], flaky: 0 };
    const { failed, flaky } = failuresIn(report);
    app.failed.push(...failed);
    app.flaky += flaky;
    apps.set(match[1], app);
  }
  return [...apps.values()];
}

// No shell: every argument is handed over as it is.
const gh = (...args) =>
  execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

function main() {
  const repo = env.REPO ?? "";
  const runId = env.RUN_ID ?? "";
  const attempt = env.RUN_ATTEMPT ?? "1";
  const sha = env.HEAD_SHA ?? "";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(runId)) {
    throw new Error("REPO and RUN_ID have to be set.");
  }

  // GitHub says which pull request a run was for, unless it came from a
  // fork. Then it's the open one whose newest commit is the run's.
  let pull = /^\d+$/.test(env.PR_NUMBER ?? "") ? env.PR_NUMBER : undefined;
  if (!pull && /^[0-9a-f]{40}$/.test(sha)) {
    const open = JSON.parse(
      gh(
        "pr",
        "list",
        "--repo",
        repo,
        "--state",
        "open",
        "--search",
        sha,
        "--json",
        "number,headRefOid",
      ),
    );
    pull = open.find((item) => item.headRefOid === sha)?.number;
  }
  if (!pull) {
    console.log(
      "No open pull request has this commit as its newest. Nothing to write.",
    );
    return;
  }

  const jobs = JSON.parse(
    gh(
      "api",
      "--paginate",
      "--slurp",
      `repos/${repo}/actions/runs/${runId}/attempts/${Number(attempt) || 1}/jobs`,
    ),
  )
    .flatMap((page) => page.jobs ?? [])
    .filter((job) => job.conclusion === "failure" && job.name !== "E2E")
    .map((job) => ({ name: job.name, url: job.html_url }));

  const body = commentBody({
    apps: readReports(env.REPORTS ?? "reports"),
    jobs,
    url: `https://github.com/${repo}/actions/runs/${runId}`,
    attempt,
    sha,
  });
  const passed = body.includes("### E2E: everything passed");

  const existing = JSON.parse(
    gh("api", "--paginate", "--slurp", `repos/${repo}/issues/${pull}/comments`),
  )
    .flat()
    .find(
      (comment) =>
        comment.user?.type === "Bot" && comment.body?.startsWith(marker),
    );

  if (existing) {
    gh(
      "api",
      "--method",
      "PATCH",
      `repos/${repo}/issues/comments/${existing.id}`,
      "-f",
      `body=${body}`,
    );
    console.log(`Updated the comment on #${pull}.`);
  } else if (!passed) {
    gh(
      "api",
      "--method",
      "POST",
      `repos/${repo}/issues/${pull}/comments`,
      "-f",
      `body=${body}`,
    );
    console.log(`Wrote a comment on #${pull}.`);
  } else {
    // A run that passed, on a pull request nothing was said on: nothing
    // to say.
    console.log(
      "Everything passed, and there's no earlier comment to put right.",
    );
  }
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  main();
}
