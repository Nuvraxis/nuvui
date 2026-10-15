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
  "@nuvui/charts": "charts",
  "@nuvui/barcodes": "barcodes",
  "@nuvui/chat": "chat",
  "@nuvui/kanban": "kanban",
  "@nuvui/editor": "editor",
  "@nuvui/emoji": "emoji",
  "@nuvui/map": "map",
  "@nuvui/icons": "icons",
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
    expect("vite", "it has the charts' styles", css.includes(".nuv-chart"));
    expect(
      "vite",
      "the script has the chart's tooltip",
      script.includes("nuv-chart__tooltip"),
    );
    expect("vite", "it has the codes' styles", css.includes(".nuv-barcode"));
    expect("vite", "it has the chat's styles", css.includes(".nuv-message"));
    expect("vite", "it has the board's styles", css.includes(".nuv-kanban"));
    expect(
      "vite",
      "it has the picker's styles",
      css.includes(".nuv-emoji-picker"),
    );
    expect(
      "vite",
      "it has the reaction, from its own entry, and its styles",
      css.includes(".nuv-emoji-reaction") &&
        script.includes("nuv-emoji-reaction__count"),
    );
    expect("vite", "it has the map's styles", css.includes(".nuv-map"));
    // MapLibre is asked for when a map is first drawn, so it's in the
    // build, in a file of its own. Its worker is another, which the app
    // asked Vite for the address of.
    expect(
      "vite",
      "the script has the map, and MapLibre for it to load",
      script.includes("nuv-map__canvas") &&
        script.includes("maplibregl-canvas"),
    );
    expect(
      "vite",
      "the build has MapLibre's worker, as a file of its own",
      files(join(dir, "dist"), ".mjs").some((file) =>
        file.includes("maplibre-gl-worker"),
      ),
    );
    expect(
      "vite",
      "the script has the picker, and the list of emoji it loads",
      script.includes("nuv-emoji-picker__viewport") &&
        script.includes("grinning face"),
    );
    expect(
      "vite",
      "it has the editor's styles",
      css.includes(".nuv-rich-text-editor"),
    );
    expect(
      "vite",
      "the script has the editor's text",
      script.includes("nuv-rich-text-editor__content"),
    );
    expect(
      "vite",
      "the script has the board's card",
      script.includes("nuv-kanban__handle"),
    );
    expect(
      "vite",
      "the script has the message and the prompt box",
      script.includes("nuv-message__content") &&
        script.includes("nuv-prompt-input__textarea"),
    );
    expect(
      "vite",
      "the script has the barcode and the QR code",
      script.includes("nuv-barcode__bars") &&
        script.includes("nuv-qrcode__squares"),
    );
    // Each icon is a module of its own, named in its code. The app imports
    // one, and the set has another 316 that a bundler should leave out.
    expect(
      "vite",
      "the script has the icon that was imported, and not one that wasn't",
      script.includes("ArrowRightIcon") && !script.includes("TrashIcon"),
    );
    const required = execFileSync(
      process.execPath,
      [
        "-e",
        `const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { ArrowRightIcon } = require("@nuvui/icons/sharp");
process.stdout.write(renderToStaticMarkup(createElement(ArrowRightIcon, { title: "Next" })));`,
      ],
      { cwd: dir, encoding: "utf8" },
    );
    expect(
      "vite",
      "an icon from the CommonJS build renders, in its style, with its name",
      required.includes('stroke-linecap="square"') &&
        required.includes('role="img"') &&
        required.includes("<title>Next</title>"),
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
      "the server rendered an icon from a server component, hidden beside its words",
      /<svg\s(?=[^>]*width="16")(?=[^>]*stroke="currentColor")(?=[^>]*aria-hidden="true")/.test(
        html,
      ),
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

    // A chart is drawn in the browser. What the server can render of one
    // is its box, with a color for each series, and the table of its
    // numbers.
    expect(
      "next",
      "the server rendered the chart's container, with a variable for each series",
      /<div\s(?=[^>]*class="nuv-chart")(?=[^>]*--chart-desktop:)(?=[^>]*--chart-mobile-fill:)/.test(
        html,
      ),
    );
    expect(
      "next",
      "the server rendered the chart's numbers as a table",
      /<table\s(?=[^>]*class="nuv-chart__table")(?=[^>]*aria-label="Visitors by month")/.test(
        html,
      ) && html.includes('<th scope="row">February</th><td>305</td>'),
    );

    expect(
      "next",
      "the server drew a barcode, with the check digit it worked out",
      /<svg\s(?=[^>]*class="nuv-barcode")(?=[^>]*data-type="ean13")(?=[^>]*aria-label="Item 5901234")/.test(
        html,
      ) &&
        /<path class="nuv-barcode__bars" d="M[^"]{200,}"/.test(html) &&
        />123457<\/text>/.test(html),
    );
    expect(
      "next",
      "the server drew a QR code",
      /<svg\s(?=[^>]*class="nuv-qrcode")(?=[^>]*data-version="2")/.test(html) &&
        /<path class="nuv-qrcode__squares" d="M4 4h7v1h-7z/.test(html),
    );

    expect(
      "next",
      "the server rendered a conversation, a message and the prompt box",
      /<div\s(?=[^>]*class="nuv-conversation__viewport")(?=[^>]*role="log")(?=[^>]*aria-label="Support")/.test(
        html,
      ) &&
        /<span class="nuv-message__label">Assistant(?:<!-- -->)?: <\/span>/.test(
          html,
        ) &&
        /<textarea\s(?=[^>]*class="nuv-prompt-input__textarea")(?=[^>]*aria-label="Message")/.test(
          html,
        ),
    );

    const css = read(files(join(dir, "out"), ".css"));
    expect("next", "it has the chat's styles", css.includes(".nuv-message"));
    expect("next", "it has the board's styles", css.includes(".nuv-kanban"));
    expect(
      "next",
      "it has the picker's styles",
      css.includes(".nuv-emoji-picker"),
    );
    expect("next", "it has the map's styles", css.includes(".nuv-map"));
    expect(
      "next",
      "the server rendered the map's box, saying the map is on its way",
      html.includes("nuv-map__canvas") && html.includes("Loading map"),
    );
    expect(
      "next",
      "the server rendered the picker's search box and the list it fills",
      html.includes("nuv-emoji-picker__search") &&
        html.includes("nuv-emoji-picker__viewport"),
    );
    expect(
      "next",
      "it has the editor's styles",
      css.includes(".nuv-rich-text-editor"),
    );
    expect(
      "next",
      "the server rendered the editor's toolbar and the field a form is sent",
      html.includes("nuv-rich-text-editor__toolbar") &&
        /<input\s(?=[^>]*type="hidden")(?=[^>]*name="notes")/.test(html),
    );
    expect(
      "next",
      "the server rendered the board from a client component of the app's",
      html.includes("nuv-kanban__handle"),
    );
    expect("next", "it has the codes' styles", css.includes(".nuv-barcode"));
    expect("next", "it has the charts' styles", css.includes(".nuv-chart"));
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

  // The same packages on React 18.2, the oldest React they say they work
  // with. Its types are React 18's too, so the type check is the first test.
  react18(dir) {
    const script = read(files(join(dir, "dist"), ".js"));
    expect(
      "react18",
      "the build has React 18.2 in it, and not another React",
      script.includes('"18.2.0"') && !/"19\.\d+\.\d+"/.test(script),
    );
    const css = read(files(join(dir, "dist"), ".css"));
    expect(
      "react18",
      "it has the component styles",
      css.includes(".nuv-button"),
    );

    // The app rendered by React 18's server renderer, which runs every
    // component's render on React 18.
    const render = pathToFileURL(join(dir, "dist-server", "render.js")).href;
    const html = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const { render } = await import(${JSON.stringify(render)}); process.stdout.write(render());`,
      ],
      { cwd: dir, encoding: "utf8" },
    );
    expect("react18", "the app renders to HTML", html.length > 1000);
    expect(
      "react18",
      "the data table rendered, sorted",
      html.indexOf(">Ada Lovelace<") < html.indexOf(">Cleo Park<") &&
        html.includes('aria-sort="ascending"'),
    );
    expect(
      "react18",
      "the controls in the form rendered, with the copies Radix sends",
      /<input\s(?=[^>]*type="checkbox")(?=[^>]*name="terms")/.test(html) &&
        /<select\s(?=[^>]*name="fruit")/.test(html) &&
        html.includes('role="switch"') &&
        /<input\s(?=[^>]*name="due")/.test(html),
    );
    expect(
      "react18",
      "the progress bar, the slider and the tabs rendered",
      /<\w+\s(?=[^>]*class="nuv-progress__indicator")(?=[^>]*inline-size:64%)/.test(
        html,
      ) &&
        html.includes("nuv-slider__thumb") &&
        html.includes('role="tablist"'),
    );
    expect(
      "react18",
      "the chart's container rendered, with a variable for its series",
      /<div\s(?=[^>]*class="nuv-chart")(?=[^>]*--chart-seats:)/.test(html),
    );
    expect(
      "react18",
      "the icon rendered, named, in the style of its entry",
      /<svg\s(?=[^>]*role="img")(?=[^>]*stroke-linecap="square")[^>]*><title>and go on<\/title>/.test(
        html,
      ),
    );
    expect(
      "react18",
      "the barcode and the QR code were drawn",
      html.includes("nuv-barcode__bars") &&
        html.includes("nuv-qrcode__squares"),
    );
    expect(
      "react18",
      "the message, the prompt box, the editor, the board, the picker and the map rendered",
      html.includes("nuv-message__content") &&
        html.includes("nuv-prompt-input__textarea") &&
        html.includes("nuv-rich-text-editor__toolbar") &&
        html.includes("nuv-kanban__handle") &&
        html.includes("nuv-emoji-picker__search") &&
        html.includes("Loading map"),
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
  console.log("test-consumers: the three apps install, type-check and build");
} catch (error) {
  failed = true;
  console.error(`test-consumers failed: ${error.message}`);
} finally {
  if (keep) console.log(`test-consumers: kept ${work}`);
  else rmSync(work, { recursive: true, force: true });
}

if (failed) process.exit(1);
