// The agent skill is Markdown that points at other Markdown. A link that
// goes nowhere is a rule an agent is told to read and can't. Whether the
// skill matches the docs is another check, `pnpm check:skill`, which needs
// the packages built. This one needs nothing.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const repoDir = path.join(import.meta.dirname, "..");
const skillDir = path.join(repoDir, "skills", "nuvui");

function markdownIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const at = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownIn(at);
    return entry.name.endsWith(".md") ? [at] : [];
  });
}

// Links outside code blocks, to files and not to the web or to a heading
// on the same page.
function linksIn(file) {
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)]
    .map(([, target]) => target)
    .filter((target) => !/^(https?:|mailto:|#)/.test(target))
    .map((target) => target.replace(/#.*$/, ""));
}

const show = (file) => path.relative(repoDir, file).split(path.sep).join("/");

test("SKILL.md says what it is and when to load it", () => {
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const header = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skill)?.[1] ?? "";
  const name = /^name:\s*(.+)$/m.exec(header)?.[1];
  const description = /^description:\s*(.+)$/m.exec(header)?.[1] ?? "";

  // The installer and the agents both go by these two.
  assert.equal(name, "nuvui");
  assert.match(name, /^[a-z][a-z0-9-]*$/);
  assert.ok(description.length > 80, "the description says when to use it");
  assert.ok(description.length <= 1024, "agents cut a description off there");
  assert.match(description, /@nuvui/);
});

test("every link in the skill goes to a file that's there", () => {
  const broken = [];
  for (const file of markdownIn(skillDir)) {
    for (const target of linksIn(file)) {
      if (!existsSync(path.resolve(path.dirname(file), target))) {
        broken.push(`${show(file)} -> ${target}`);
      }
    }
  }
  assert.deepEqual(broken, []);
});

test("NuvUIAIAgent.md is the skill's first page, with links that work from the root", () => {
  const file = path.join(repoDir, "NuvUIAIAgent.md");
  const text = readFileSync(file, "utf8");

  assert.match(text, /^# nuvui$/m);
  // The header is the skill's, and means nothing here.
  assert.doesNotMatch(text, /^name: nuvui$/m);
  const targets = linksIn(file);
  assert.ok(targets.length > 5);
  for (const target of targets) {
    assert.ok(target.startsWith("skills/nuvui/"), target);
    assert.ok(existsSync(path.join(repoDir, target)), target);
  }
});

test("every rule file and reference list is linked from SKILL.md", () => {
  const linked = new Set(linksIn(path.join(skillDir, "SKILL.md")));
  const rules = readdirSync(path.join(skillDir, "rules")).map(
    (name) => `rules/${name}`,
  );

  for (const file of [
    ...rules,
    "reference.md",
    "blocks.md",
    "recipes.md",
    "tokens.md",
  ]) {
    assert.ok(linked.has(file), `${file} is linked from SKILL.md`);
  }
});

test("the evals are tasks with patterns that compile", () => {
  const { evals } = JSON.parse(
    readFileSync(path.join(skillDir, "evals", "evals.json"), "utf8"),
  );

  assert.ok(evals.length >= 5);
  assert.equal(new Set(evals.map((one) => one.id)).size, evals.length);
  for (const one of evals) {
    assert.ok(one.prompt.length > 20, one.id);
    assert.ok(one.project.includes("@nuvui/react"), one.id);
    for (const { pattern, why } of [...one.expect, ...(one.reject ?? [])]) {
      assert.doesNotThrow(() => new RegExp(pattern), `${one.id}: ${pattern}`);
      assert.ok(why.length > 10, `${one.id}: ${pattern} says why`);
    }
  }
});

test("the site's llms.txt lists the pages by their plain-text addresses", () => {
  const text = readFileSync(
    path.join(repoDir, "apps", "showcase", "public", "llms.txt"),
    "utf8",
  );

  assert.match(text, /^# nuvui$/m);
  assert.match(text, /docs\/llms\/components\/button\.md/);
  assert.match(text, /docs\/llms-full\.txt/);
});
