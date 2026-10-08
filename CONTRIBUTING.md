# Contributing to nuvui

Thanks for taking the time. This page covers how to get the repository running, how the code is laid out, the conventions a change has to follow, and what a pull request needs before it can be merged.

Bug reports and ideas go in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Security problems go through [SECURITY.md](SECURITY.md), not the tracker. Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Setup

You need Node 22 or newer and pnpm 12. The exact pnpm version is in the `packageManager` field of the root `package.json`. Use pnpm for everything here, not npm or yarn.

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
| `pnpm test:consumers` | Packs the packages and installs them into a Vite app and a Next.js app. Run `pnpm build` first. |

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
scripts/serve-static.mjs      serves an exported site, for the e2e tests and for pnpm start
scripts/fix-next-export.mjs   puts right what Next's export gets wrong on Windows
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

A component goes in a package of its own when it needs a library the core doesn't have. `@nuvui/date-picker` is the first, for react-day-picker and date-fns, `@nuvui/table` the second, for TanStack Table, and `@nuvui/charts` the third, for Recharts. An app that doesn't use the component then never installs that library.

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

A new add-on also has to be added in three places: `addons` in `apps/docs/lib/library.ts`, `published` in `scripts/test-consumers.mjs`, and the dependencies of `apps/docs` and of the two apps in `fixtures`.

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

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e` passing. CI runs on Linux, in two workflows:
  - `ci.yml` runs for every pull request: lint, typecheck, build and the component tests, then a check of the package that would be published and of the size of each entry point.
  - `e2e.yml` runs only for a pull request with the `invoke-e2e` label: the end-to-end tests, and a check that the packed library installs and builds in a Vite app and a Next.js app. A maintainer adds the label when a change is ready for it. Without the label nothing runs these for you, so run `pnpm test:e2e` yourself.
- Tests for what changed.
- The docs page updated, if behavior, props, CSS variables or class names changed.
- A changeset, if the change reaches the published package.

Keep a pull request to one change. A fix and an unrelated cleanup are easier to review, and to revert, as two.

## License

nuvui is [MIT licensed](LICENSE). Contributions are accepted under the same license.
