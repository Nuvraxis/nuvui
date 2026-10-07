// Installs the packed packages into the apps in fixtures/ and builds them.
// fixtures/README.md says what this is for.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const keep = process.argv.includes("--keep");
const work = mkdtempSync(join(tmpdir(), "nuvui-consumers-"));

// pnpm is a .cmd file on Windows, which only runs through a shell.
function pnpm(args, cwd) {
  execFileSync("pnpm", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

// Every file under a folder whose name ends in one of the extensions.
function files(dir, ...extensions) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext)),
    )
    .map((entry) => join(entry.parentPath, entry.name));
}

const read = (paths) =>
  paths.map((path) => readFileSync(path, "utf8")).join("\n");

// Every package that gets published, by the folder it's in.
const published = {
  "@nuvui/react": "ui",
  "@nuvui/date-picker": "date-picker",
  "@nuvui/table": "table",
};

function expect(app, what, passed) {
  if (!passed) throw new Error(`${app}: ${what}`);
  console.log(`test-consumers: ${app}: ${what}: yes`);
}

const fixtures = {
  vite(dir) {
    const css = read(files(join(dir, "dist"), ".css"));
    expect("vite", "the build has a stylesheet", css.length > 0);
    expect("vite", "it has the component styles", css.includes(".nuv-button"));
    expect("vite", "it has the tokens", css.includes("--color-primary"));
    expect("vite", "it has the preset", css.includes("data-preset=ink"));
    expect(
      "vite",
      "it has the date picker's styles",
      css.includes(".nuv-calendar"),
    );

    const script = read(files(join(dir, "dist"), ".js"));
    expect(
      "vite",
      "the script has the components",
      script.includes("nuv-dialog"),
    );
    expect(
      "vite",
      "the script has the calendar",
      script.includes("nuv-calendar__day"),
    );
    // The app imports one locale, German. Hungarian for Sunday is in the
    // script only if every other locale came along with it.
    expect(
      "vite",
      "the script has the one locale that was imported",
      script.includes("Sonntag"),
    );
    expect(
      "vite",
      "the script has none of the other locales",
      !script.includes("vasárnap"),
    );
    expect(
      "vite",
      "it has the table's styles",
      css.includes(".nuv-data-table"),
    );
    expect(
      "vite",
      "the script has the data table",
      script.includes("nuv-data-table__sort"),
    );
    // The app's hook has sorting and nothing else. This is a property that
    // only TanStack's row selection feature sets, and a bundler can't
    // rename a property.
    expect(
      "vite",
      "the script has none of the table features that weren't asked for",
      !script.includes("_lastSelectedRowId"),
    );
  },

  next(dir) {
    const html = read([join(dir, "out", "index.html")]);
    expect(
      "next",
      "the server rendered a button from a server component",
      // The two attributes, in whichever order React wrote them.
      /<a\s(?=[^>]*class="nuv-button)(?=[^>]*href="#next")/.test(html),
    );
    expect(
      "next",
      "the server rendered the client components",
      html.includes('role="switch"') && html.includes('aria-haspopup="dialog"'),
    );
    expect(
      "next",
      "the server rendered the date field, with its date",
      /<input\s(?=[^>]*name="due")(?=[^>]*value="2026-10-15")/.test(html) &&
        html.includes('value="10/15/2026"'),
    );
    expect(
      "next",
      "the server rendered the calendar's month, and no day as today",
      html.includes("October 2026") && !html.includes("Today,"),
    );

    expect(
      "next",
      "the server rendered the table's elements from a server component",
      /<th\s(?=[^>]*scope="row")(?=[^>]*class="nuv-table__cell nuv-table__cell--row-header")[^>]*>Team</.test(
        html,
      ),
    );
    expect(
      "next",
      "the server rendered the data table, sorted, with its rows named",
      html.indexOf(">Ada Lovelace<") < html.indexOf(">Cleo Park<") &&
        html.includes('aria-sort="ascending"') &&
        html.includes('aria-label="Select Ada Lovelace"'),
    );

    const css = read(files(join(dir, "out"), ".css"));
    expect(
      "next",
      "it has the table's styles",
      css.includes(".nuv-data-table"),
    );
    expect("next", "it has the component styles", css.includes(".nuv-button"));
    expect("next", "it has the preset", css.includes("data-preset=ink"));
    expect(
      "next",
      "it has the date picker's styles",
      css.includes(".nuv-calendar"),
    );
  },
};

let failed = false;
try {
  // Each package into a folder of its own, so there's no guessing which
  // tarball is whose.
  const tarballs = {};
  for (const [name, folder] of Object.entries(published)) {
    console.log(`test-consumers: packing ${name}`);
    const to = join(work, "packed", folder);
    pnpm(["--filter", name, "pack", "--pack-destination", to], root);
    const tarball = readdirSync(to).find((file) => file.endsWith(".tgz"));
    if (!tarball)
      throw new Error(`pnpm pack didn't write a tarball of ${name}`);
    tarballs[name] = pathToFileURL(join(to, tarball)).href;
  }

  for (const [name, check] of Object.entries(fixtures)) {
    const dir = join(work, name);
    cpSync(join(root, "fixtures", name), dir, { recursive: true });

    const manifest = join(dir, "package.json");
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    for (const [dependency, tarball] of Object.entries(tarballs)) {
      pkg.dependencies[dependency] = tarball;
    }
    writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);

    console.log(`test-consumers: ${name}: installing`);
    // Outside the repository there is no workspace to find, but say so
    // anyway: this install has to be the one a stranger would get.
    pnpm(["install", "--ignore-workspace", "--no-frozen-lockfile"], dir);
    console.log(`test-consumers: ${name}: checking types`);
    pnpm(["run", "typecheck"], dir);
    console.log(`test-consumers: ${name}: building`);
    pnpm(["run", "build"], dir);
    check(dir);
  }
  console.log("test-consumers: both apps install, type-check and build");
} catch (error) {
  failed = true;
  console.error(`test-consumers failed: ${error.message}`);
} finally {
  if (keep) console.log(`test-consumers: kept ${work}`);
  else rmSync(work, { recursive: true, force: true });
}

if (failed) process.exit(1);
