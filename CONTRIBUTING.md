# Contributing to nuvui

Thanks for taking the time. This page covers how to get the repository running, how the code is laid out, the conventions a change has to follow, and what a pull request needs before it can be merged.

Bug reports and ideas go in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Security problems go through [SECURITY.md](SECURITY.md), not the tracker. Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Setup

You need Node 22.18 or newer and pnpm 12. The exact pnpm version is in the `packageManager` field of the root `package.json`. Use pnpm for everything here, not npm or yarn.

```sh
pnpm install
pnpm playwright:install   # downloads the browsers the tests run in
```

The second command is needed once, and again whenever Playwright is upgraded. Without it, `pnpm test` fails because there's no browser to run in. It downloads Chromium, Firefox and WebKit.

## Commands

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Builds the packages in watch mode and serves the website at http://localhost:3001, with the docs under `/docs`. The docs app's own server is on port 3000, and the website passes `/docs` on to it. |
| `pnpm lint` | Biome for TypeScript and JSON, Stylelint for SCSS. |
| `pnpm lint:fix` | Lets Biome fix what it can, formatting included. |
| `pnpm typecheck` | TypeScript, in every workspace. |
| `pnpm test` | The component tests of every package in Chromium, Firefox and WebKit, and the theme generator's tests. About fourteen minutes. |
| `pnpm build` | Builds the theme generator and the packages, checks the result, then builds the docs and the website. `apps/showcase/out` is then the whole site: the website, with the docs copied in under `/docs`. |
| `pnpm test:e2e` | Builds first, then runs Playwright against the exported site, in five browser setups. The docs' tests run against the docs alone, and the website's against the two together. The two suites run one after the other: each already uses every core, and together they starve each other into timeouts. |
| `pnpm size` | Builds first, then checks each entry point against its size budget. |
| `pnpm check:package` | Checks what each package would publish: its `exports` map and its types. Run `pnpm build` first. |
| `pnpm check:licenses` | Fails on a dependency whose license isn't on the lists in `scripts/check-licenses.mjs`: a short one for what the published packages depend on, and a longer one for the tools. |
| `pnpm check:audit` | Fails on a dependency with a known vulnerability rated high or worse. What it leaves out is in `pnpm-workspace.yaml`, each with why. |
| `pnpm test:consumers` | Packs the packages and installs them into three apps: one on Vite, one on Next.js, and one on Vite with React 18.2. Run `pnpm build` first. |
| `pnpm skill` | Writes the agent skill's reference, `NuvUIAIAgent.md` and the site's `llms.txt` from the docs. Run `pnpm build` first, and keep what it writes. |
| `pnpm check:skill` | Fails if those files are behind the docs, or a component is on no docs page. CI runs it. |
| `pnpm icons:fetch` | Fetches the icons from their Figma file into `packages/icons`. It needs a Figma token: see [The icon package](#the-icon-package). |

To run part of a suite:

```sh
# One component's tests, or all of them in watch mode
pnpm --filter @nuvui/react exec vitest run src/components/dialog
pnpm --filter @nuvui/react test:watch

# One browser, which is much quicker while you're working on something.
# Set the variable the way your shell does it. This is a POSIX shell.
NUVUI_BROWSERS=chromium pnpm --filter @nuvui/react exec vitest run

# The same for an add-on package
NUVUI_BROWSERS=chromium pnpm --filter @nuvui/date-picker exec vitest run

# The end-to-end tests in Chrome only, on a desktop and on a phone. That's
# two of the five setups, and well under half the time. Run all five before
# a pull request, which is what CI does.
NUVUI_BROWSERS=chromium pnpm test:e2e

# One end-to-end file. It tests the files in apps/docs/out, so build first.
pnpm build
pnpm --filter @nuvui/docs exec playwright test e2e/overlays.spec.ts

# The same in one browser setup: desktop, mobile, firefox, webkit or mobile-webkit
pnpm --filter @nuvui/docs exec playwright test --project=firefox
```

## Layout

```
packages/ui                   the library, published as @nuvui/react
  src/components/<name>/      <name>.tsx, <name>.scss, <name>.test.tsx, index.ts
  src/direction/              DirectionProvider, which has no styles
  src/styles/                 tokens, mixins, the layer order, base styles,
                              and the styles that fields and floating panels share
  src/utils/                  small helpers shared by components
  scripts/build-css.mjs       says which stylesheets this package builds
  scripts/check-dist.mjs      says what to check in what was built
  test/                       the tests that cut across components
  .size-limit.json            the size budget of each entry point
packages/date-picker          an add-on, published as @nuvui/date-picker
  src/components/<name>/      the same four files as in the library
  src/locale.ts               the locales, passed on from react-day-picker
  src/utils/                  reading and writing dates, and the typed text
packages/table                an add-on, published as @nuvui/table
  src/components/table/       the styled table elements
  src/components/data-table/  the data table and its controls, one file each
  src/full.ts                 the hook with every feature, an entry of its own
  src/virtual.tsx             the virtual table, an entry of its own
packages/charts               an add-on, published as @nuvui/charts
  src/components/chart/       the container, tooltip, legend and table, one file each
packages/barcodes             an add-on, published as @nuvui/barcodes
  src/components/barcode/     the barcode, and encode.ts, which works out its bars
  src/components/qrcode/      the QR code, and encode.ts, which works out its squares
  src/save.ts                 a code on the page as an SVG or a PNG file, an entry of its own
  test/read.ts                reads a drawn code back, for the tests
packages/chat                 an add-on, published as @nuvui/chat
  src/components/<name>/      the same four files as in the library
  src/utils/                  a value kept here or by the caller
packages/kanban               an add-on, published as @nuvui/kanban
  src/components/kanban/      the board and its parts, in one file
packages/editor               an add-on, published as @nuvui/editor
  src/components/rich-text-editor/  the editor and its parts, in one file
packages/emoji                an add-on, published as @nuvui/emoji
  src/components/emoji-picker/  the picker
  src/data/                   the list of emoji, written by scripts/generate-data.mjs
packages/map                  an add-on, published as @nuvui/map
  src/components/map/         the map and its parts, in one file
packages/flow                 an add-on, published as @nuvui/flow
  src/components/flow/        the diagram: its geometry, its spatial index, its store and the component
  scripts/bench.mjs           times it on large diagrams, run by hand
packages/media                an add-on, published as @nuvui/media
  src/core/                   the store, what both players do with their media, sources and streams, WebVTT, the keys, the words, kept settings, peaks
  src/parts/                  the controls every player shares, the waveform and the shortcuts sheet
  src/components/video-player/  the video player
  src/components/audio-player/  the audio player
  src/components/media-transcript/  the transcript
  scripts/make-media.sh       makes the clips and sounds the docs, the blocks and the tests play
packages/icons                the icons, published as @nuvui/icons
  svg/                        each icon in each style, fetched from Figma
  manifest.json               every icon's name, component and category
  src/create-icon.ts          what every icon is made with
  src/generated/              a module for each icon, written by the build, not in git
packages/tooling              what every published package is built with, private
  tsdown.mjs                  the build
  build-css.mjs               compiles the SCSS, and copies the source into dist
  check-dist.mjs              fails the build if a package is put together wrong
  stylelint.mjs               the SCSS rules
  vitest.mjs                  the browser tests' setup
  test/                       test helpers: axe, contrast, themes, the viewport
packages/theme                the theme generator, private for now
  src/theme.ts                picks every color of a theme by measuring contrast
  src/css.ts                  writes a theme as CSS, SCSS or for Tailwind
  src/presets.ts              the five presets the library ships
  src/palette.ts              Tailwind's color scales, written by a script
apps/docs                     the documentation site (Next.js and Fumadocs)
  content/docs/               the pages, as MDX
  examples/<name>/            the examples the pages render and print
  components/                 previews, props tables, playgrounds, reference tables
  e2e/                        Playwright tests
apps/showcase                 the website (Next.js, SCSS and the library's tokens)
  src/app/                    its pages, the sitemap index, robots and share images
  src/components/             the header, the search, the theme control, the dashboard
  src/styles/                 its own styles, BEM with the prefix "site"
  scripts/add-docs.mjs        copies the built docs into its export, under /docs
  e2e/                        Playwright tests, of its pages and of where the two apps meet
apps/mcp                      the MCP server (FastMCP), answering from the skill and the blocks (private)
  src/sources.ts              reads its data from the repository when it's built
  src/server.ts               its tools
  Dockerfile                  builds its image
apps/Dockerfile               builds the site's image: both apps as static files, behind nginx
apps/nginx.conf               how that image serves them
apps/otel-collector.example.yaml  an example collector for what the pages send
scripts/check-site-image.mjs  asks a running container of that image for the site
scripts/check-mcp-image.mjs   asks a running container of the MCP server's image for its tools
scripts/make-icons.mjs        draws the favicon and the home screen icons from one SVG
scripts/serve-static.mjs      serves an exported site, for the e2e tests and for pnpm start
scripts/fix-next-export.mjs   puts right what Next's export gets wrong on Windows
packages/telemetry            sends the site's web vitals to an OpenTelemetry collector (private)
packages/typescript-config    shared tsconfig presets
fixtures                      two apps that install the packed packages
scripts/test-consumers.mjs    builds those two apps
.changeset                    release notes waiting for the next version
```

## How the library is built

A few decisions shape most changes. Each one has a reason, and a change that goes against one needs a better reason.

- **Components wrap Radix primitives.** Radix handles focus, keyboard behavior and ARIA. The library adds styles, sensible defaults and a smaller API.
- **Styles are plain CSS that the consumer imports.** No JavaScript file imports a stylesheet, so nothing needs a loader and everything works in server components.
- **Exports are flat.** It's `DialogContent`, not `Dialog.Content`. Reading a property off a client component fails inside a server component.
- **`"use client"` goes on line 1 of any file that uses state, effects or a Radix primitive that does.** A component that's only markup, like Button, has no directive and can render on the server. The build checks that the directive in `dist` matches the source.
- **Components use `forwardRef`,** because React 18 is supported and it doesn't pass `ref` as a prop.
- **A part that draws something of its own beside its children doesn't take `asChild`.** Type its props with `PartProps<typeof Primitive.Part>`, from `utils/part-props`, in place of `ComponentPropsWithoutRef`, and add it to the list in `utils/part-props.test.tsx`. Radix merges a part into its one child, and such a part has more than one.
- **Text a component writes itself has a prop,** with an English default and a comment that says "Translate it with the rest of your interface." Add the prop to `apps/docs/content/docs/translation.mdx`. A test fails if a default with that comment isn't on the page.
- **Dark mode is opt-in.** A page with no `data-theme` is light.
- **A theme is token values and nothing else.** No component reads a color, a border width or a control height that isn't a token. That's what lets one stylesheet restyle everything, and what lets the theme generator check a theme's contrast without rendering a component.

## Style conventions

Stylelint enforces the first five. The rest are checked in review and by the tests.

- **BEM, with the `nuv` prefix.** `.nuv-dialog`, `.nuv-dialog__title`, `.nuv-dialog--lg`. The prefix is written out, not interpolated from a variable, because Stylelint can't check a selector with `#{...}` in it.
- **Flat selectors.** Nesting is for states (`&:hover`, `&[data-state="open"]`) and at-rules only, and a selector has at most two parts. Radix renders overlays at the end of `<body>`, so a rule can't rely on where an element sits in the page.
- **No IDs in selectors.**
- **Custom properties are kebab-case.**
- **No color is written out in a component.** Not a name, not a hex value, not `rgb()` or `oklch()`. Colors come from tokens. `transparent` and the system colors that forced-colors mode needs are fine.
- **Every rule sits inside `@layer components`.** That's what lets a consumer override anything without fighting specificity.
- **Components read semantic tokens, never the raw scales.** `var(--color-primary)`, not `var(--color-blue-600)`. Then changing a theme means changing one list of tokens, and dark mode needs no rules in the component.
- **A component's own variables are fallbacks at the point of use.** Write `border-radius: var(--nuv-button-radius, var(--radius-md))` and never declare `--nuv-button-radius` anywhere. A consumer can then set it on `:root` or on any wrapper and it wins. The names follow `--nuv-<component>-<property>`.
- **The base size is the touch size.** Controls are 44 pixels by default, through the `touch-target` mixin. Denser sizes go inside the `fine-pointer` mixin, so they apply with a mouse or trackpad and nowhere else.
- **Sizes that several components share are tokens.** A control's height with a mouse is `--nuv-control-height-sm`, `-md` or `-lg`, which is what density changes. A border is `var(--nuv-border-width)` wide, and a disabled control fades to `var(--nuv-disabled-opacity)`. A size only one component has, such as a dialog's width, is that component's own variable with the number as its fallback.
- **Anything typed into uses the shared field styles.** `src/styles/_control.scss` has the box, the height, the 16 pixel text that keeps iOS from zooming, and the group that puts a button inside a field. A new kind of field includes those mixins with its own name, which gives it variables of its own.
- **Components that look alike share a partial, not a class.** `src/styles/_modal.scss` is behind Dialog, AlertDialog and Sheet, `_menu.scss` behind DropdownMenu, ContextMenu and Menubar, and `_floating.scss` behind every panel Radix places next to a trigger. Each mixin is the inside of one rule and takes the component's name, so the component still writes its own selectors and gets its own variables.
- **Disabled styles go by `:disabled` as well as `[data-disabled]`,** on anything that's a form control. Inside a `<fieldset disabled>` the browser disables a control without the component's own attribute being set.
- **A filled control's hover color moves away from its text.** Button's `filled-hover` mixin does it. Mixing in a fixed dark color makes dark text harder to read, and a theme decides whether the text is dark.
- **Mobile first.** Base styles are for the smallest screen. Larger screens are added with the `breakpoint` mixin, which only has a minimum-width form.
- **Use the mixins for hover, focus and motion.** `hover` keeps hover styles off touch screens. `focus-ring` draws the same ring everywhere. Animations and transitions go inside `motion-safe`, so they don't exist for someone who has asked for reduced motion.
- **Use logical properties:** `padding-inline`, `inset-inline-end`, `border-block-start`. They're what makes right-to-left work.
- **Check forced colors.** Windows high contrast replaces every color and drops backgrounds and shadows. Anything a component shows with a background alone has to get an outline or a system color there. `test/forced-colors.test.tsx` has a section per component.

## Adding a component

Button is the smallest example to copy from, and Dialog the fullest.

1. **Add the Radix primitive**, if there is one:

   ```sh
   pnpm --filter @nuvui/react add @radix-ui/react-<name>
   ```

2. **Create `packages/ui/src/components/<name>/`** with four files:
   - `<name>.tsx`: the component. Export an interface named `<Part>OwnProps` for the props the library adds, with a JSDoc comment on each and an `@default` tag. The docs print those comments.
   - `<name>.scss`: the styles, following the conventions above.
   - `<name>.test.tsx`: the tests.
   - `index.ts`: the named exports, types included.

3. **Wire it up.** `pnpm build` fails with a message if one of these is missing:
   - an entry for `"./<name>"` in the `exports` map of `packages/ui/package.json`
   - a line in `packages/ui/src/index.ts`
   - a `@use` line in `packages/ui/src/styles/index.scss`
   - a size budget in `packages/ui/.size-limit.json`. Run `pnpm size` to see what the entry weighs, and set the limit about a tenth above it.

4. **Write the tests.** They run in Chromium, Firefox and WebKit with the real styles loaded, so they can measure things. A component needs:
   - rendering, and every prop the library adds
   - keyboard behavior
   - an axe check in every theme. `themes` in `test/themed.tsx` lists them: the default and each preset, in light and dark. Run the check with `describe.each(themes)`. Render the library's `Button` wherever the example needs a button. A bare `<button>` has the browser's colors, which nothing here controls.
   - a visible focus ring
   - the denser size with a mouse, and an entry in `test/density.test.tsx` if density changes it
   - the 44 pixel size on a touch screen, in `test/touch.test.tsx`. That file runs in a browser context of its own that reports a touch screen, because a page can't be switched between touch and mouse and back in a way that works on every system.
   - forced colors, in `test/forced-colors.test.tsx`. WebKit has no forced-colors mode, and that file skips itself there.
   - no animation under reduced motion, if it animates

5. **Write the docs page** at `apps/docs/content/docs/components/<name>.mdx`, and add it to `meta.json` in the same folder. Follow the sections of an existing page in the same order: Install, Import, Parts (if it has several), Try it, Props, the component's own sections, Accessibility, CSS variables, Classes, Server components, Do and don't.
   - Examples are files in `apps/docs/examples/<name>/`. `<Preview name="<name>/basic" />` renders the file and prints its source, so the code on the page is the code that runs.
   - The playground is a client component in `apps/docs/components/playground/`, registered in `apps/docs/components/mdx.tsx`.
   - The props table is read from the TypeScript types. The CSS variable and class tables are read from the compiled CSS, and you write a description for each entry in the MDX. The build fails if an entry has no description, or a description has no entry.

6. **Add end-to-end tests** in `apps/docs/e2e/` for what the page's examples do. Every page is also checked for one h1, a unique title and description, an Open Graph image and no axe violations, without you listing it anywhere.

7. **Add a changeset.** See below.

## Add-on packages

A component goes in a package of its own when it needs a library the core doesn't have. `@nuvui/date-picker` is the first, for react-day-picker and date-fns, `@nuvui/table` the second, for TanStack Table, `@nuvui/charts` the third, for Recharts, and `@nuvui/barcodes` the fourth, for JsBarcode's and uqr's encoders. `@nuvui/chat` is the fifth, and the one that isn't there for a library: it's a different kind of screen, which most apps don't have. `@nuvui/kanban` is the sixth, for dnd kit, which carries the cards, and `@nuvui/editor` the seventh, for Tiptap. `@nuvui/emoji` is the eighth, and what it keeps out of the core is no library but a list: nineteen hundred emoji with their names. `@nuvui/map` is the ninth, for MapLibre. An app that doesn't use the component then never installs that library. `@nuvui/flow` is the tenth, and needs no library either: what it keeps out of the core is a kind of screen most apps don't have, and its size. `@nuvui/media` is the eleventh, and keeps out of the core a kind of screen most apps don't have, and the streaming libraries, which an app hands it only if it streams. `@nuvui/icons` is the twelfth, and the odd one out: it needs no `@nuvui/react`, has no stylesheet, and is artwork more than code. [The icon package](#the-icon-package) says how it differs.

An add-on is laid out like the core and built with the same tooling, from `packages/tooling`. Its own config files only say what's particular to it. What differs from the core:

- **`@nuvui/react` is a peer dependency,** written `workspace:^0.0.0`, and a dev dependency so the workspace has it. Changesets rewrites the range when the core's version moves. The add-on imports core components from their own entries, `@nuvui/react/popover` and not `@nuvui/react`.
- **Its SCSS loads the core's mixins by package name:** `@use "@nuvui/react/scss/mixins"`. The core's other partials, such as `_control.scss`, aren't exported. Build from the core's components instead of from its partials.
- **It ships compiled CSS only:** `styles.css` and one file per component in `css/`. It has no tokens, no presets and no SCSS source of its own.
- **A rule can't count on being loaded after the core's stylesheet.** Both are in the `components` layer, and the app decides the order. To change how a core component looks inside an add-on, set that component's CSS variables on the element. That's the one place where a `--nuv-*` variable is declared.
- **Its tests import the core's built stylesheet,** `@nuvui/react/styles.css`, and then its own SCSS. So the core has to be built first, which `pnpm test` sees to.
- **Its docs pages are in a folder of their own** under `apps/docs/content/docs/`. `PropsTable`, `CssVariables` and `BemClasses` take a `package` prop that says which package to read.

- **The library it's built on is a dependency or a peer, depending on who writes code against it.** Nobody uses react-day-picker's own API to use the date picker, so it's a dependency. Columns for a table are written with TanStack's helpers and types, so TanStack Table is a peer, and the app owns its version. Charts are built from Recharts' own parts, so Recharts is a peer too.
- **Markup that a library draws, and that takes no class of ours, is styled through the container around it.** Recharts' axes and grid lines are the one case: `chart.scss` reaches them by Recharts' class names, one level deeper than the linter allows, in a block with the two rules switched off and a comment that says why. Everything this library draws itself stays BEM.
- **It ships CommonJS as well as ES modules, unless its peer doesn't.** `@tanstack/react-table` is ES modules only, so `@nuvui/table` is too: `library({ format: ["esm"] })` in its `tsdown.config.ts`, and the `esm-only` profile in `.attw.json`.
- **An entry that needs an optional peer, or that pulls in a lot, is a file at the top of `src`** and not a folder in `src/components`, so the package's main entry doesn't re-export it. `src/virtual.tsx` and `src/full.ts` in the table package are the two there are.

A new add-on also has to be added in four places: `addons` in `apps/docs/lib/library.ts`, `addons` and `sectionTitles` in `apps/docs/scripts/agent-skill.mjs`, `published` in `scripts/test-consumers.mjs`, and the dependencies of `apps/docs` and of the three apps in `fixtures`.

### The icon package

`packages/icons` holds artwork, and is built differently from the other packages:

- **The SVG files in `svg/` are the source,** one for each icon in each style. They're fetched from the Figma file the icons are drawn in, and never edited by hand. To change an icon, change it in Figma and fetch again.
- **`pnpm icons:fetch` fetches them.** It reads every component set named `Icon/<name>` in the file, exports its three variants as SVG, makes each file the same with SVGO, and writes the SVG files and `manifest.json`. It writes nothing if any icon breaks the set's rules: a size other than 24 by 24, a color other than the set's ink, a missing style, or a name that isn't lower case words joined by hyphens. Commit what it writes.
- **The Figma file people download** is `apps/docs/public/NuvUI_Icons_Figma_File.fig`, a copy saved in Figma with File, Save local copy. When the icons change, save a new one over it along with the fetch, so the download doesn't fall behind the SVGs.
- **Fetching needs a Figma token** that can read the file. Make one in Figma under Settings, Security, Personal access tokens, with read access to file content. Put it in `FIGMA_TOKEN`, or in a file `.env.local` at the root of the repository as `FIGMA_TOKEN=...`, which git ignores. Never commit a token.
- **The components are generated when the package is built,** by `scripts/generate.mjs`, into `src/generated`, which git ignores. `build`, `typecheck` and `test` each run it first, so nothing but the fetch needs Figma or a token.
- **No stylesheet and no `@nuvui/react`.** An icon is an SVG in `currentColor`. The package's `scripts/check-dist.mjs` is its own: it checks that each entry has every icon in the manifest, in both module formats, and that no file says `"use client"`.

## The website and the docs

The site is two Next.js apps on one address. `apps/showcase` is served at `/` and `apps/docs` under `/docs`. Each is a static export, and the website's build copies the docs' into its own, so one folder holds everything.

The docs app has `basePath: "/docs"`. What that means when you write a link:

- **In a docs page's MDX, write the address a visitor sees:** `[Button](/docs/components/button)`. The page route takes the prefix off before Next's link puts it back.
- **In a docs example or component that uses `next/link`, leave the prefix out:** `<Link href="/forms">`. Next adds it. A plain `<a href>` isn't touched, so there it's written in full.
- **Next doesn't add the prefix to a URL in metadata, a sitemap, JSON-LD or a `fetch`.** `docsPath()` in `apps/docs/lib/site.ts` does.
- **A link from one app to the other is a plain `<a>`,** never the router's link. The page it leads to belongs to another app, and the router would ask that app's files of this one.

`robots.txt`, the sitemap index and the 404 page are the website's, because a crawler and a static host look for one of each, at the root. The docs list their own pages in `/docs/sitemap.xml`, which the index points to.

The theme a visitor picks is kept in `localStorage` under `theme`, by both apps, with the same three values. That's all it takes for a choice on one to hold on the other.

The website's own styles are in `apps/showcase/src/styles`: SCSS, the library's tokens, and BEM classes that start with `site`. Stylelint holds it to the same rules as the library, with that prefix.

Both apps show the same header. Its links are listed twice, in `apps/showcase/src/lib/site.ts` and in `apps/docs/lib/site.ts`, and a test fails if the two lists differ.

### Icons, and what a page's head says

Every icon of the site is drawn from one file, `apps/showcase/src/app/icon.svg`, which is the mark in the header. After changing it, run `node scripts/make-icons.mjs` and commit what it writes: the `.ico` and the home screen icons of the website, and the docs' copies of all of them. The docs have their own because they're served under `/docs` and have to be whole when run alone. Next finds `icon.svg`, `favicon.ico` and `apple-icon.png` by name and writes the `<link>` tags.

What a search engine and a shared link read is in `lib/seo.ts`, once in each app, and the two files are kept the same but for their first comment. `baseMetadata` and `viewport` go in the root layout. A page adds its own with `share()`, which takes the page's address and its picture. Use it for every page that has a picture: a page's `openGraph` replaces the layout's, so one written by hand loses the site's name.

A page that shouldn't be found by a search, such as a block's preview, says `robots: { index: false }` in its metadata.

## Adding a block

A block is a folder under `apps/showcase/src/blocks`, named for the block, with three files:

- `<name>.tsx`, the component, as the default export. It imports its stylesheet and nothing else from this repository.
- `<name>.scss`, its styles. Every class starts with the block's name, such as `.sign-in__title`, with no `nuv` or `site` prefix: a block is copied into someone's app, and from then on it's their code. Stylelint checks this, and that every color is a token.
- `block.json`, which says what the block is: its name, title, description, category, files, the packages to install, and the height of its preview.

Then add the manifest to the list in `apps/showcase/src/lib/blocks.ts`. That's all the pages, the search, the sitemap, the registry and the tests need: every block gets the same tests from its manifest. Add one of your own to `e2e/blocks.spec.ts` for what the block does that the others don't.

The tests every block gets ask for a heading, and for at least one thing Tab can reach, each with a name. They run axe in light and dark, and look for sideways scrolling at a phone's width and a tablet's.

The site's build writes each block to `out/r/<name>.json`, in the format shadcn's command line tool reads, from `apps/showcase/scripts/add-registry.mjs`. Nothing is added by hand.

A block that uses a package the website doesn't load yet needs that package in `apps/showcase/package.json`, and its stylesheet in `apps/showcase/src/app/layout.tsx`.

Names, figures and companies in a block are made up, and look it.

## The agent skill

`skills/nuvui` is a skill for the coding agents people build with: what an agent has to be told to use the library well. The [docs page](https://nuvui.nuvraxis.com/docs/agents) says how it's installed. Part of it is written by hand and part by a script.

By hand:

- `SKILL.md`, which an agent loads first. Its header says when. Keep it short: it's read every time, and everything else only when it's needed.
- `rules/`, a file for each kind of mistake, with the reason and code that's wrong beside code that's right.
- `recipes.md`, common screens and the block or the pages to build each from.
- `evals/`, tasks the skill is tried on.

By `apps/docs/scripts/agent-skill.mjs`, from the docs:

- `reference/`, a file for each docs page, with the tables and the examples the site shows written out as Markdown. `reference.md` is the list.
- `blocks.md`, from the blocks' manifests, and `tokens.md`, from the built tokens.
- `NuvUIAIAgent.md` at the root, which is `SKILL.md` without its header.
- `apps/showcase/public/llms.txt`, the list of pages at the site's root.

So after a change to a docs page, an example, a component's props or its styles, or a block's manifest, run `pnpm build` and then `pnpm skill`, and keep what changed with the rest of the work. `pnpm check:skill` fails in CI when that was left out. It also fails when a component's folder is named by no docs page, since an agent would never learn of it.

The docs' build writes the same pages for the site, as `/docs/llms.txt`, `/docs/llms-full.txt` and a file for each page under `/docs/llms/`. Those aren't kept in git. The [MCP server](#the-mcp-server) answers from the skill's files as well.

When an agent gets something wrong that the skill should have stopped, change the rule and add a task to `evals/evals.json`. Don't edit a file under `reference/`: change the docs page it's written from.

## Changing a component

The same rules apply on a smaller scale. If a change adds a class or a CSS variable, the docs build will tell you which page needs a description for it. If it changes what a prop does, update the JSDoc comment, because that's what the docs page shows.

## Themes and presets

The semantic colors of the default theme are in `packages/ui/src/styles/tokens/_semantic.scss`. The theme generator in `packages/theme` has to give the same values for its default choice, and a test in `packages/ui` compares the two in a browser.

To change a preset or add one, edit `packages/theme/src/presets.ts`. The library's build writes `dist/themes/<name>.css` from that list. The generator refuses a theme whose colors don't have enough contrast, and names the pair that failed. The component tests pick up a new preset by themselves.

After upgrading Tailwind, run `pnpm --filter @nuvui/theme sync:palette`. It rewrites `src/palette.ts` from Tailwind's theme file, and a test fails if the two differ.

## Writing

Docs, comments, test names and changesets are all written the same way: plain sentences that say what a thing does. Comments are rare and explain why, not what. Leave out anything that reads like an advertisement.

## Changesets

If a pull request changes what gets published, in `@nuvui/react` or in an add-on, it needs a changeset:

```sh
pnpm changeset
```

Pick the bump type and write a sentence or two about what changed, from the point of view of someone using the library. Commit the file it creates in `.changeset`. Changes that only touch the docs site, tests or tooling don't need one.

Before 1.0, a breaking change is a minor bump, and its changeset has to say what breaks and what to do about it.

## Pull requests

A pull request needs:

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e` passing. CI runs on Linux, in three workflows:
  - `ci.yml` runs for every pull request: an audit of the dependencies and a check of their licenses, then lint, typecheck, build and the component tests, then a check of the package that would be published and of the size of each entry point.
  - `e2e.yml` runs only for a pull request with the `invoke-e2e` label: the end-to-end tests, and a check that the packed library installs and builds in a Vite app and a Next.js app. A maintainer adds the label when a change is ready for it. Without the label nothing runs these for you, so run `pnpm test:e2e` yourself. The workflow builds the site once and cuts the tests into 17 slices, each on a runner of its own, because one runner would need hours for all of them. A last job named E2E passes when every slice has.
  - `apps-docker.yaml` runs for a pull request that changes `apps/Dockerfile`, `apps/nginx.conf`, `scripts/check-site-image.mjs` or `.dockerignore`. It builds the site's image, starts it and runs `scripts/check-site-image.mjs` against it. On `main` the same workflow also pushes the image to `ghcr.io/nuvraxis/nuvui-site`.
  - `mcp-docker.yaml` does the same for the MCP server, for a pull request that changes `apps/mcp/Dockerfile`, `scripts/check-mcp-image.mjs` or `.dockerignore`, and pushes `ghcr.io/nuvraxis/nuvui-mcp` from `main`.
  - `mcp-publish.yaml` publishes the MCP server's listing to the MCP Registry, when a push to `main` changes `apps/mcp` and the listing has a version the registry doesn't. See [its listing](#its-listing-in-the-mcp-registry).
- Tests for what changed.
- The docs page updated, if behavior, props, CSS variables or class names changed.
- A changeset, if the change reaches the published package.

The workflows name each action by a commit, with its version in a comment, and Dependabot proposes the next one. Don't change one back to a tag.

### The site's image

The website and the docs are deployed as one image, nginx serving the files `pnpm build` writes to `apps/showcase/out`. To build and look at it, with Docker running:

```sh
docker build --file apps/Dockerfile --tag nuvui-site .
docker run --rm --publish 8080:8080 nuvui-site
node scripts/check-site-image.mjs http://localhost:8080
```

The end-to-end tests don't run against nginx. They run against `scripts/serve-static.mjs`, and `apps/nginx.conf` is written to answer the way it does. If you change how one of them answers, change the other, and add what you changed to `scripts/check-site-image.mjs`.

Keep a pull request to one change. A fix and an unrelated cleanup are easier to review, and to revert, as two.

### The MCP server

`apps/mcp` is a server a coding agent asks about the library while it works, over the Model Context Protocol, on [FastMCP](https://github.com/punkpeye/fastmcp). The [docs page](https://nuvui.nuvraxis.com/docs/mcp) says how people add it. Every tool only reads.

It answers from the agent skill, `skills/nuvui`, and from the website's blocks and charts, so there's one way of turning a docs page into text. `pnpm build` reads them into `apps/mcp/dist/data.json`, which the server loads when it starts. A change to the docs reaches it through `pnpm skill`, as it reaches the skill. `apps/mcp/turbo.json` names those files as inputs of its build, since they're outside the package.

It also answers for older releases. `apps/mcp/versions/` keeps the docs of each release line, such as `0.6.json`, and a tool given a `version` answers from that file. `pnpm version-packages` writes the new release's file after `changeset version`, with `pnpm --filter @nuvui/mcp snapshot`, so the release's pull request has it, and a patch release writes over its line's file. A release from before can be written from its tag, as 0.6 and 0.7 were:

```sh
pnpm --filter @nuvui/mcp snapshot @nuvui/react@0.6.0
```

The skill first shipped in 0.6.0, so nothing older can be kept. `get_changes` reads every package's `CHANGELOG.md`, and the changesets in `.changeset/` for what's merged but not released, so it covers every version. The files in `versions/` are written, not edited: Git shows no diff for them, and Biome doesn't read them.

`apps/mcp/tools.json` is what an agent reads before it calls anything: each tool's name, title, description and input schema. An agent builds its calls on the list it last read, so a change to it reaches every client without telling them. A test fails when the server's list differs from the file. When the change is meant, write the file again with `pnpm --filter @nuvui/mcp test -u` and keep it in the pull request, where the diff shows what agents will see. Some parameters list the packages, rule topics, block categories and chart families, so a new package or category changes it too.

To run it:

```sh
pnpm --filter @nuvui/mcp build
pnpm --filter @nuvui/mcp start          # http://localhost:8080/mcp
pnpm --filter @nuvui/mcp start:stdio    # over standard input and output
```

Or its image, with Docker running:

```sh
docker build --file apps/mcp/Dockerfile --tag nuvui-mcp .
docker run --rm --publish 8080:8080 --env RATE_LIMIT_PER_MINUTE=30 nuvui-mcp
node scripts/check-mcp-image.mjs http://localhost:8080 30
```

What it reads from its environment, all optional:

| Variable | What it is |
| --- | --- |
| `PORT` | The port it listens on. 8080 unless you say otherwise. |
| `HOST` | The address it listens on. `0.0.0.0` unless you say otherwise. |
| `RATE_LIMIT_PER_MINUTE` | How many requests one caller may make in a minute. 120 unless you say otherwise. It's counted in each process, so with several replicas a caller can make this many times their number. |
| `TRUSTED_PROXIES` | How many proxies in front of it add to `X-Forwarded-For`, such as a CDN and an ingress. 0 unless you say otherwise, which makes every caller the address the connection came from. Set it to the number there is: with too few, every caller is the proxy, and with too many, a caller can name themselves. |
| `OTLP_ENDPOINT` | Where to send the counts, without `/v1/metrics`, as a full address, such as the collector's service in the cluster. Unset means nothing is sent. |
| `SERVICE_VERSION` | What to call the build in the counts. The image is built with the commit. |

It's meant to be reached at `/mcp` on the site's own address, with the ingress sending that path to the server's own deployment and nothing else to it. Route `/mcp` alone: FastMCP also answers an older transport at `/sse`, and the limit doesn't run there. `/healthz` is for the liveness and readiness probes, and isn't for the internet either. The server keeps nothing between requests, so any replica can answer any of them, and none needs sticky sessions. It writes nothing, and runs with a read-only root filesystem as user 1000.

The counts are sums over OTLP/HTTP in JSON, sent each minute, under the service name `nuvui-mcp`: `mcp.tool.calls`, with the tool as `mcp.tool` and how the call ended as `mcp.outcome` (`ok`, `not_found` or `error`), and `mcp.requests.limited`. Nothing in them says who asked or what they asked for. `apps/otel-collector.example.yaml` takes them as it takes the site's.

#### Its listing in the MCP Registry

`apps/mcp/server.json` lists the server in the [MCP Registry](https://registry.modelcontextprotocol.io), as `io.github.Nuvraxis/nuvui`, at its address on the site. The registry keeps only the listing. It doesn't check the address, so publish once the server is answering there.

The listing's version is `@nuvui/react`'s, which is what the server says it is. `pnpm version-packages` runs `scripts/mcp-server-version.mjs` after `changeset version`, so the release's pull request changes both. The registry takes a version once.

`mcp-publish.yaml` publishes it when a push to `main` changes `apps/mcp`. It asks the registry for the listing's version first, and publishes only one it doesn't have, so a change to the server alone publishes nothing.

The workflow signs in with the run's OIDC token from GitHub, which the registry trusts for `io.github.Nuvraxis/*` because the repository is the organization's. There's no secret to keep or renew.

By hand, only an owner of the Nuvraxis organization can publish under its name, and the registry has to see that. `mcp-publisher login github` on its own, through the registry's GitHub App, gave only the publisher's own name. A classic token of an owner with just the `read:org` scope works. Give it a short expiry and delete it after publishing. From `apps/mcp`, with [`mcp-publisher`](https://github.com/modelcontextprotocol/registry/releases):

```powershell
mcp-publisher validate
$t = Read-Host "GitHub token" -MaskInput
mcp-publisher login github --token=$t
Remove-Variable t
mcp-publisher publish
```

### Telemetry

The website and the docs can send their web vitals to an OpenTelemetry collector. The image does, to `/otlp` on the site's own address. A build made with `pnpm build`, on your machine or for the tests, sends nothing unless it's given a collector.

Two variables, read when the site is built:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_OTLP_ENDPOINT` | Where the collector is, without `/v1/metrics`. A path on the site's own address, such as `/otlp`, or a full address. Empty means off. |
| `NEXT_PUBLIC_SITE_VERSION` | What to call the build, sent as `service.version`. Optional. |

`apps/Dockerfile` takes them as the build arguments `OTLP_ENDPOINT` and `SITE_VERSION`. The first is `/otlp` unless you pass another, and passing an empty one turns telemetry off. `apps-docker.yaml` fills it from a repository variable named `SITE_OTLP_ENDPOINT`, or with `/otlp` when there's no such variable, and fills the second with the commit.

What's sent, as histograms over OTLP/HTTP in JSON:

| Metric | Unit | What it measures |
| --- | --- | --- |
| `web_vital.ttfb` | ms | Time to First Byte |
| `web_vital.fcp` | ms | First Contentful Paint |
| `web_vital.lcp` | ms | Largest Contentful Paint |
| `web_vital.inp` | ms | Interaction to Next Paint |
| `web_vital.cls` | none | Cumulative Layout Shift |
| `navigation.duration` | ms | A move from one page to another inside the app, from its start to the new page's first paint |

Each value has the page's path as `url.path`, and how the page was reached as `navigation.type`. A web vital also has its rating as `web_vital.rating`. The website's values are under the service name `nuvui-website` and the docs' under `nuvui-docs`. Nothing identifies a visitor: no cookie is set or sent, and no id is made. The collector does see the address a request came from, as any server does.

The code is in three places:

- `packages/telemetry` turns a value into what the collector takes, and sends it. It has the unit tests.
- `components/telemetry.tsx` in each app gets the web vitals from Next's `useReportWebVitals`, and measures a navigation's end.
- `instrumentation-client.ts` in each app marks a navigation's start.

A page inside a frame, such as a block's preview, sends nothing. Layout shift and interaction delay are counted once for each page load, with the value from the first time the visitor left the page.

With `/otlp` as the endpoint, the pages post to the site's own address and the ingress has to send `/otlp` to the collector. That needs no CORS setup. Until the ingress does, the posts reach nginx, which answers each with 405 and drops it. `apps/otel-collector.example.yaml` is a collector config that takes the values and offers them to Prometheus. The values are deltas, one visitor's at a time, and the example has the two steps that Prometheus needs for that.

On Windows, Git Bash rewrites a value that starts with a slash into a path under its own folder. To try a build with `/otlp` from there, set `MSYS_NO_PATHCONV=1` as well.

## License

nuvui is [MIT licensed](LICENSE). Contributions are accepted under the same license.
