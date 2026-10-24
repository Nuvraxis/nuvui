// Reads what a pull request changes and says, in one comment on it, which
// of the repository's conventions it may have missed and what to do about
// each. It only advises: lint, typecheck, the tests, the build and
// check:skill are what can fail a pull request, and this repeats none of
// them. It covers what CONTRIBUTING.md asks of a pull request that no other
// check sees: a changeset, tests, the docs, how things are written.
//
// Run by .github/workflows/pr-conventions.yml. It reads the pull request
// through GitHub's API and never runs its code. File names and lines come
// from a pull request, which for a fork is a stranger's, so each goes into
// the comment as code, cut to a length.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { argv, env } from "node:process";
import { pathToFileURL } from "node:url";
import { plain } from "./e2e-comment.mjs";

/** The first line of every comment this writes. It's how the comment is found again. */
export const marker = "<!-- nuvui-pr-conventions -->";

const guide = "https://github.com/Nuvraxis/nuvui/blob/main/CONTRIBUTING.md";

// The places a finding lists. More than this and the comment says how many
// more there are.
const mostPlaces = 8;

/**
 * The lines a unified diff adds, with their numbers in the new file.
 *
 * @param {string | undefined} patch
 * @returns {{ line: number, text: string }[]}
 */
export function addedLines(patch) {
  const added = [];
  let line = 0;
  for (const row of (patch ?? "").split("\n")) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row);
    if (hunk) {
      line = Number(hunk[1]);
      continue;
    }
    if (row.startsWith("+")) {
      added.push({ line, text: row.slice(1) });
      line += 1;
    } else if (!row.startsWith("-") && !row.startsWith("\\")) {
      line += 1;
    }
  }
  return added;
}

const isTest = (file) =>
  /\.test\.(?:ts|tsx|mjs)$/.test(file) || /^packages\/[^/]+\/test\//.test(file);

// What a package builds or fetches, and isn't written by a person.
const isGenerated = (file) =>
  /^packages\/[^/]+\/src\/(?:generated|data)\//.test(file) ||
  /^packages\/icons\/svg\//.test(file);

const packageOf = (file) => /^packages\/([^/]+)\//.exec(file)?.[1];

// Prose a person writes. A changelog is written by Changesets, the skill's
// reference by a script, and an AGENTS.md block by Next or Turborepo.
const isProse = (file) =>
  /\.(?:md|mdx)$/.test(file) &&
  !/(?:^|\/)CHANGELOG\.md$/.test(file) &&
  !/(?:^|\/)AGENTS\.md$/.test(file) &&
  !file.startsWith("skills/nuvui/reference/") &&
  file !== "NuvUIAIAgent.md";

const isCode = (file) => /\.(?:ts|tsx|mts|mjs|js|scss|css)$/.test(file);

const isComment = (text) => /^\s*(?:\/\/|\/\*|\*|<!--|\{\/\*)/.test(text);

// What reads like an advertisement, which the docs leave out.
const selling =
  /\b(?:blazing(?:ly)?|seamless(?:ly)?|effortless(?:ly)?|powerful|robust|cutting-edge|world-class|best-in-class|revolutionary|supercharge[ds]?|game-chang\w*|lightning-fast|delightful|stunning|amazing|awesome|state-of-the-art|next-generation)\b/i;

// A command for another package manager. "npm, npx or yarn" names them,
// and isn't one.
const otherManagers =
  /\b(?:npm (?:install|i|ci|run|add|exec|init)\b|npx (?!(?:or|and)\b)[\w@./-]|yarn (?:add|install|run|dlx)\b)/;

// Where a command is written: the docs, a workflow, a manifest's scripts,
// a shell script, a Dockerfile. Code that's about commands, such as this
// file, is left alone.
const holdsCommands = (file) =>
  /\.(?:md|mdx|ya?ml|json|sh)$/.test(file) || /(?:^|\/)Dockerfile$/.test(file);

/**
 * What the pull request may have missed.
 *
 * @param {{ filename: string, status: string, patch?: string }[]} files
 * @param {{ packages?: Map<string, { name: string, private: boolean }> }} [options]
 *   The workspace's packages by folder, as `packagesIn` reads them.
 * @returns {{ id: string, title: string, todo: string, places: string[] }[]}
 */
export function findingsFor(files, { packages = new Map() } = {}) {
  // A package the workspace doesn't have yet is new in this pull request,
  // and taken to be published.
  const hidden = (folder) => packages.get(folder)?.private === true;
  const named = (folders) =>
    folders
      .map((folder) => `\`${plain(packages.get(folder)?.name ?? folder, 40)}\``)
      .join(", ");
  const names = files.map((file) => file.filename);
  const has = (test) => names.some(test);
  const findings = [];
  const add = (id, title, todo, places = []) =>
    findings.push({ id, title, todo, places });

  // Code a package ships, written by a person.
  const shipped = names.filter(
    (file) =>
      /^packages\/[^/]+\/src\//.test(file) &&
      !isTest(file) &&
      !isGenerated(file),
  );
  const published = shipped.filter((file) => !hidden(packageOf(file)));

  if (
    published.length > 0 &&
    !has((file) => /^\.changeset\/(?!README\.md$)[^/]+\.md$/.test(file))
  ) {
    add(
      "changeset",
      "No changeset",
      `This changes what ${named([...new Set(published.map(packageOf))])} publishes. Run \`pnpm changeset\`, pick the bump, and write a sentence or two from the point of view of someone using the library. Before 1.0 a breaking change is a minor bump and says what to do about it. [Changesets](${guide}#changesets)`,
    );
  }

  const untested = [...new Set(shipped.map(packageOf))].filter(
    (pkg) => !has((file) => packageOf(file) === pkg && isTest(file)),
  );
  if (untested.length > 0) {
    add(
      "tests",
      "No tests changed",
      `The source of ${named(untested)} changed, and none of its tests did. Add or change a test for what's different. A component's tests run in Chromium, Firefox and WebKit with the real styles, and cover rendering, every prop, the keyboard, axe in every theme, the focus ring and the touch size. [Adding a component](${guide}#adding-a-component)`,
    );
  }

  const components = published.filter((file) =>
    /^packages\/[^/]+\/src\/components\/.+\.(?:tsx|scss)$/.test(file),
  );
  if (
    components.length > 0 &&
    !has((file) => /^apps\/docs\/(?:content|examples)\//.test(file))
  ) {
    add(
      "docs",
      "The docs weren't changed",
      `A component's code or styles changed. If what it does, a prop, a CSS variable or a class name changed, change its page under \`apps/docs/content/docs/\` too. A prop's JSDoc comment is what the page shows. [Changing a component](${guide}#changing-a-component)`,
      components,
    );
  }

  // The skill is written from the docs' pages and examples, but not from
  // the menu's order, the changelog, or the pages about the skill and the
  // MCP server, which it leaves out.
  const skillSources = names.filter(
    (file) =>
      (/^apps\/docs\/content\/.+\.mdx$/.test(file) &&
        !/\/docs\/(?:agents|mcp|changelog)\.mdx$/.test(file)) ||
      /^apps\/docs\/examples\//.test(file) ||
      /^apps\/showcase\/src\/blocks\/[^/]+\/block\.json$/.test(file),
  );
  if (skillSources.length > 0 && !has((file) => file.startsWith("skills/"))) {
    add(
      "skill",
      "The agent skill may be behind",
      "Docs pages, examples or a block's manifest changed, and nothing under `skills/` did. Run `pnpm build` and then `pnpm skill`, and keep what it writes. `pnpm check:skill` fails in CI when it's behind. Never edit a file under `skills/nuvui/reference/`: change the docs page it's written from. [The agent skill](" +
        guide +
        "#the-agent-skill)",
      skillSources,
    );
  }

  const added = files.filter((file) => file.status === "added");
  const newComponents = added
    .map((file) =>
      /^packages\/ui\/src\/components\/([^/]+)\/\1\.tsx$/.exec(file.filename),
    )
    .filter(Boolean)
    .map((match) => match[1]);
  if (newComponents.length > 0) {
    const shared = [
      "packages/ui/test/touch.test.tsx",
      "packages/ui/test/density.test.tsx",
      "packages/ui/test/forced-colors.test.tsx",
    ].filter((file) => !names.includes(file));
    if (shared.length > 0) {
      add(
        "new-component",
        "A new component, without the shared tests",
        `${newComponents.map((c) => `\`${plain(c, 40)}\``).join(", ")} is new. Each component also has a section in the tests that cut across them: the 44 pixel size on a touch screen, the denser size if density changes it, and forced colors. Add what applies to the files below, and to \`translation.mdx\` for any text it writes itself. [Adding a component](${guide}#adding-a-component)`,
        shared,
      );
    }
  }

  const newBlocks = added
    .map((file) =>
      /^apps\/showcase\/src\/blocks\/([^/]+)\/block\.json$/.exec(file.filename),
    )
    .filter(Boolean)
    .map((match) => match[1]);
  if (
    newBlocks.length > 0 &&
    !names.includes("apps/showcase/src/lib/blocks.ts")
  ) {
    add(
      "block",
      "A new block that isn't listed",
      `${newBlocks.map((b) => `\`${plain(b, 40)}\``).join(", ")} has a manifest, and \`apps/showcase/src/lib/blocks.ts\` wasn't changed. Add the manifest to the list there: the pages, the search, the registry and the tests all read it. [Adding a block](${guide}#adding-a-block)`,
    );
  }

  const managers = [];
  const actions = [];
  const writing = [];
  for (const file of files) {
    const name = file.filename;
    if (/(?:^|\/)(?:pnpm-lock\.yaml|CHANGELOG\.md)$/.test(name)) continue;
    const workflow = /^\.github\/(?:workflows|actions)\//.test(name);
    const prose = isProse(name);
    const code = isCode(name);
    // The emoji picker's pages show emoji, which is what they're about.
    const emojiPage = name.startsWith("apps/docs/content/docs/emoji/");
    for (const { line, text } of addedLines(file.patch)) {
      const at = `${name}:${line}`;
      if (holdsCommands(name) && otherManagers.test(text)) managers.push(at);
      if (workflow) {
        const uses = /^\s*-?\s*uses:\s*([^\s#]+)/.exec(text)?.[1];
        if (
          uses &&
          !uses.startsWith("./") &&
          !uses.startsWith("docker://") &&
          !/@[0-9a-f]{40}$/.test(uses)
        ) {
          actions.push(at);
        }
      }
      if (prose || (code && isComment(text))) {
        const why = [];
        if (text.includes("—")) why.push("em dash");
        if (!emojiPage && /\p{Extended_Pictographic}/u.test(text))
          why.push("emoji");
        const word = selling.exec(text)?.[0];
        if (word) why.push(`"${word.toLowerCase()}"`);
        if (why.length > 0) writing.push(`${at} (${why.join(", ")})`);
      }
    }
  }

  if (managers.length > 0) {
    add(
      "pnpm",
      "npm, npx or yarn",
      "The repository uses pnpm for everything, and so does every command in its docs. Write `pnpm add`, `pnpm install`, `pnpm run` and `pnpm dlx` instead. [Setup](" +
        guide +
        "#setup)",
      managers,
    );
  }

  if (actions.length > 0) {
    add(
      "actions",
      "An action named by a tag",
      "Each action in a workflow is named by a commit, with its version in a comment after it, such as `uses: actions/checkout@<40 characters> # v7.0.1`. Dependabot proposes the next one. [Pull requests](" +
        guide +
        "#pull-requests)",
      actions,
    );
  }

  if (writing.length > 0) {
    add(
      "writing",
      "How it's written",
      "Docs, comments, test names and changesets are plain sentences that say what a thing does, with nothing that reads like an advertisement. They have no em dashes and no emoji: use a comma, a colon, brackets or two sentences. [Writing](" +
        guide +
        "#writing)",
      writing,
    );
  }

  const secrets = added
    .map((file) => file.filename)
    .filter((file) => /(?:^|\/)\.env(?:\.(?!example$)[^/]*)?$/.test(file));
  if (secrets.length > 0) {
    add(
      "env",
      "An environment file",
      "These are where tokens and keys are kept, and git ignores them so they stay on your machine. Take them out of the pull request, and if one holds a real token, revoke it: it's been pushed.",
      secrets,
    );
  }

  return findings;
}

/**
 * The comment, for the findings and the commit they're about.
 *
 * @param {{ id: string, title: string, todo: string, places: string[] }[]} findings
 * @param {string} sha
 */
export function commentBody(findings, sha) {
  const commit = /^[0-9a-f]{40}$/.test(sha) ? ` (${sha.slice(0, 7)})` : "";
  if (findings.length === 0) {
    return [
      marker,
      `### Conventions${commit}`,
      "",
      "Nothing here looks like it misses one of the conventions in CONTRIBUTING.md now.",
    ].join("\n");
  }
  const parts = [
    marker,
    `### Conventions${commit}`,
    "",
    `A look at what this pull request changes, against [CONTRIBUTING.md](${guide}). It can be wrong, and it doesn't block the merge: a reviewer decides. Each point says what to do.`,
  ];
  for (const finding of findings) {
    parts.push("", `**${finding.title}.** ${finding.todo}`);
    const shown = finding.places.slice(0, mostPlaces);
    for (const place of shown) parts.push(`- \`${plain(place, 160)}\``);
    if (finding.places.length > shown.length) {
      parts.push(`- and ${finding.places.length - shown.length} more`);
    }
  }
  parts.push(
    "",
    "This comment is written again on every push, and says so once everything here is done.",
  );
  return parts.join("\n");
}

/**
 * The workspace's packages, by folder: each one's name, and whether it's
 * kept from npm.
 *
 * @param {string} root
 * @returns {Map<string, { name: string, private: boolean }>}
 */
export function packagesIn(root) {
  const dir = path.join(root, "packages");
  const found = new Map();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const manifest = JSON.parse(
        readFileSync(path.join(dir, entry.name, "package.json"), "utf8"),
      );
      found.set(entry.name, {
        name: String(manifest.name ?? entry.name),
        private: manifest.private === true,
      });
    } catch {}
  }
  return found;
}

// No shell: every argument is handed over as it is.
const gh = (...args) =>
  execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

function main() {
  const repo = env.REPO ?? "";
  const pull = env.PR_NUMBER ?? "";
  const sha = env.HEAD_SHA ?? "";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(pull)) {
    throw new Error("REPO and PR_NUMBER have to be set.");
  }

  const files = JSON.parse(
    gh("api", "--paginate", "--slurp", `repos/${repo}/pulls/${pull}/files`),
  ).flat();
  const findings = findingsFor(files, { packages: packagesIn(process.cwd()) });
  const body = commentBody(findings, sha);

  const existing = JSON.parse(
    gh("api", "--paginate", "--slurp", `repos/${repo}/issues/${pull}/comments`),
  )
    .flat()
    .find(
      (comment) =>
        comment.user?.type === "Bot" && comment.body?.startsWith(marker),
    );

  if (existing) {
    if (existing.body === body) {
      console.log(`The comment on #${pull} already says this.`);
      return;
    }
    gh(
      "api",
      "--method",
      "PATCH",
      `repos/${repo}/issues/comments/${existing.id}`,
      "-f",
      `body=${body}`,
    );
    console.log(`Updated the comment on #${pull}.`);
  } else if (findings.length > 0) {
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
    console.log("Nothing to say, and no earlier comment to put right.");
  }
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  main();
}
