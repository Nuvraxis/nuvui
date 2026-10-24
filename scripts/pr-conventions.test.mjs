// Run with `pnpm test:scripts`.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  addedLines,
  commentBody,
  findingsFor,
  marker,
  packagesIn,
} from "./pr-conventions.mjs";

// A file as GitHub's API lists it, with a patch that adds `lines`.
const changed = (filename, lines = [], status = "modified") => ({
  filename,
  status,
  patch: `@@ -1,0 +1,${lines.length} @@\n${lines.map((line) => `+${line}`).join("\n")}`,
});

const ids = (files, options) =>
  findingsFor(files, options).map((finding) => finding.id);

describe("addedLines", () => {
  test("numbers the lines a patch adds as the new file has them", () => {
    const patch = [
      "@@ -10,4 +10,5 @@ function x() {",
      " kept",
      "-gone",
      "+new one",
      "+new two",
      " kept",
      "\\ No newline at end of file",
      "@@ -40,2 +41,2 @@",
      " kept",
      "+later",
    ].join("\n");
    assert.deepEqual(addedLines(patch), [
      { line: 11, text: "new one" },
      { line: 12, text: "new two" },
      { line: 42, text: "later" },
    ]);
    assert.deepEqual(addedLines(undefined), []);
  });
});

describe("findingsFor", () => {
  test("a change to what a package publishes needs a changeset, tests and maybe the docs", () => {
    const files = [changed("packages/ui/src/components/button/button.tsx")];
    assert.deepEqual(ids(files), ["changeset", "tests", "docs"]);
  });

  test("says nothing once the changeset, a test and the docs page are there", () => {
    const files = [
      changed("packages/ui/src/components/button/button.tsx"),
      changed("packages/ui/src/components/button/button.test.tsx"),
      changed("apps/docs/content/docs/components/button.mdx"),
      changed("skills/nuvui/reference/components/button.md"),
      changed(".changeset/brave-buttons.md", [], "added"),
    ];
    assert.deepEqual(ids(files), []);
  });

  test("a private package needs tests but no changeset, and generated code neither", () => {
    assert.deepEqual(
      ids([changed("packages/telemetry/src/index.ts")], {
        packages: new Map([
          ["telemetry", { name: "@nuvui/telemetry", private: true }],
        ]),
      }),
      ["tests"],
    );
    assert.deepEqual(
      ids([changed("packages/icons/src/generated/arrow.ts")]),
      [],
    );
    // The changesets' own README is no changeset.
    assert.ok(
      ids([
        changed("packages/table/src/full.ts"),
        changed(".changeset/README.md"),
      ]).includes("changeset"),
    );
  });

  test("a docs page or a block's manifest without the skill written again", () => {
    assert.deepEqual(ids([changed("apps/docs/content/docs/forms.mdx")]), [
      "skill",
    ]);
    assert.deepEqual(
      ids([changed("apps/showcase/src/blocks/sign-in/block.json")]),
      ["skill"],
    );
    // Pages the skill leaves out, and the menu's order, aren't in it.
    assert.deepEqual(
      ids([
        changed("apps/docs/content/docs/agents.mdx"),
        changed("apps/docs/content/docs/mcp.mdx"),
        changed("apps/docs/content/docs/meta.json"),
      ]),
      [],
    );
  });

  test("a new component without its sections in the shared tests", () => {
    const files = [
      changed("packages/ui/src/components/rating/rating.tsx", [], "added"),
      changed("packages/ui/src/components/rating/rating.test.tsx", [], "added"),
      changed("packages/ui/test/touch.test.tsx"),
      changed("apps/docs/content/docs/components/rating.mdx", [], "added"),
      changed("skills/nuvui/reference/components/rating.md", [], "added"),
      changed(".changeset/rating.md", [], "added"),
    ];
    const [finding] = findingsFor(files);
    assert.equal(finding?.id, "new-component");
    assert.deepEqual(finding?.places, [
      "packages/ui/test/density.test.tsx",
      "packages/ui/test/forced-colors.test.tsx",
    ]);
  });

  test("a new block that isn't in the list", () => {
    const files = [
      changed("apps/showcase/src/blocks/invoice/block.json", [], "added"),
      changed("skills/nuvui/blocks.md"),
    ];
    assert.deepEqual(ids(files), ["block"]);
    assert.deepEqual(
      ids([...files, changed("apps/showcase/src/lib/blocks.ts")]),
      [],
    );
  });

  test("npm, npx and yarn in what's added, and not a mention of the npm registry", () => {
    const [finding] = findingsFor([
      changed("README.md", [
        "Install it with npm install @nuvui/react.",
        "Published on npm, at npmjs.com.",
        "Run npx shadcn add it.",
        "pnpm add @nuvui/react",
      ]),
    ]);
    assert.equal(finding?.id, "pnpm");
    assert.deepEqual(finding?.places, ["README.md:1", "README.md:3"]);
  });

  test("not a sentence that names them, and not code that's about them", () => {
    assert.deepEqual(
      ids([
        changed("CLAUDE.md", ["Never npm, npx or yarn, in a command."]),
        changed("scripts/check.mjs", ['const bad = "npm install x";']),
      ]),
      [],
    );
    assert.deepEqual(
      ids([
        changed(".github/workflows/ci.yml", ["      - run: npm ci"]),
        changed("apps/Dockerfile", ["RUN npx tsc"]),
      ]),
      ["pnpm"],
    );
  });

  test("an action named by a tag, and not one named by a commit", () => {
    const [finding] = findingsFor([
      changed(".github/workflows/ci.yml", [
        "      - uses: actions/checkout@v4",
        "      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0",
        "      - uses: ./.github/actions/local",
      ]),
    ]);
    assert.equal(finding?.id, "actions");
    assert.deepEqual(finding?.places, [".github/workflows/ci.yml:1"]);
  });

  test("em dashes, emoji and selling words in prose and comments, and not in code", () => {
    const finding = findingsFor([
      changed("apps/docs/content/docs/forms.mdx", [
        "A form — with fields.",
        "A blazing fast table.",
        "Plain words. \u{1F680}",
        "Nothing wrong here.",
      ]),
      changed("packages/ui/src/utils/cx.ts", [
        "// A powerful helper.",
        'const dash = "—";',
      ]),
      changed("apps/docs/content/docs/emoji/emoji-picker.mdx", [
        "Pick \u{1F600}.",
      ]),
      changed("packages/ui/CHANGELOG.md", ["A robust release — yes."]),
    ]).find((each) => each.id === "writing");
    assert.deepEqual(finding?.places, [
      "apps/docs/content/docs/forms.mdx:1 (em dash)",
      'apps/docs/content/docs/forms.mdx:2 ("blazing")',
      "apps/docs/content/docs/forms.mdx:3 (emoji)",
      'packages/ui/src/utils/cx.ts:1 ("powerful")',
    ]);
  });

  test("an environment file, and not its example", () => {
    const files = [
      changed(".env.local", [], "added"),
      changed("apps/ask/.env", [], "added"),
      changed(".env.example", [], "added"),
    ];
    const [finding] = findingsFor(files);
    assert.equal(finding?.id, "env");
    assert.deepEqual(finding?.places, [".env.local", "apps/ask/.env"]);
  });
});

describe("commentBody", () => {
  test("starts with the marker, says what to do, and shows a file name as code it can't escape", () => {
    const body = commentBody(
      [
        {
          id: "pnpm",
          title: "npm, npx or yarn",
          todo: "Use pnpm.",
          places: [
            "docs/`@someone`.md:1",
            ...Array.from({ length: 10 }, (_, i) => `a.md:${i}`),
          ],
        },
      ],
      "0123456789abcdef0123456789abcdef01234567",
    );
    assert.ok(body.startsWith(`${marker}\n### Conventions (0123456)`));
    assert.match(body, /\*\*npm, npx or yarn\.\*\* Use pnpm\./);
    assert.match(body, /- `docs\/'@someone'\.md:1`/);
    assert.match(body, /- and 3 more/);
  });

  test("says when nothing is left", () => {
    assert.match(commentBody([], ""), /Nothing here looks like it misses/);
  });
});

describe("packagesIn", () => {
  test("names this repository's packages, and says which are private", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const packages = packagesIn(root);
    assert.deepEqual(packages.get("ui"), {
      name: "@nuvui/react",
      private: false,
    });
    assert.equal(packages.get("tooling")?.private, true);
  });

  test("a finding names a package as people know it", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const [finding] = findingsFor(
      [changed("packages/ui/src/components/button/button.tsx")],
      { packages: packagesIn(root) },
    );
    assert.match(finding?.todo ?? "", /`@nuvui\/react` publishes/);
  });
});
