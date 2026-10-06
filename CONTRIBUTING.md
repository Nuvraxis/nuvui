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
| `pnpm dev` | Builds the library in watch mode and serves the docs at http://localhost:3000. |
| `pnpm lint` | Biome for TypeScript and JSON, Stylelint for SCSS. |
| `pnpm lint:fix` | Lets Biome fix what it can, formatting included. |
| `pnpm typecheck` | TypeScript, in every workspace. |
| `pnpm test` | The component tests in Chromium, Firefox and WebKit, and the theme generator's tests. About three minutes. |
| `pnpm build` | Builds the theme generator and the library, checks the result, then builds the docs site. |
| `pnpm test:e2e` | Builds first, then runs Playwright against the exported docs site, in five browser setups. |
| `pnpm size` | Builds first, then checks each entry point against its size budget. |
| `pnpm test:consumers` | Packs the library and installs it into a Vite app and a Next.js app. Run `pnpm build` first. |

To run part of a suite:

```sh
# One component's tests, or all of them in watch mode
pnpm --filter @nuvui/react exec vitest run src/components/dialog
pnpm --filter @nuvui/react test:watch

# One browser, which is much quicker while you're working on something.
# Set the variable the way your shell does it. This is a POSIX shell.
NUVUI_BROWSERS=chromium pnpm --filter @nuvui/react exec vitest run

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
  src/styles/                 tokens, mixins, the layer order, base styles
  src/utils/                  small helpers shared by components
  scripts/build-css.mjs       compiles the SCSS and copies the source into dist
  scripts/check-dist.mjs      fails the build if the package is put together wrong
  test/                       test helpers, and the tests that cut across components
  .size-limit.json            the size budget of each entry point
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
packages/typescript-config    shared tsconfig presets
fixtures                      two apps that install the packed library
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

## Changing a component

The same rules apply on a smaller scale. If a change adds a class or a CSS variable, the docs build will tell you which page needs a description for it. If it changes what a prop does, update the JSDoc comment, because that's what the docs page shows.

## Themes and presets

The semantic colors of the default theme are in `packages/ui/src/styles/tokens/_semantic.scss`. The theme generator in `packages/theme` has to give the same values for its default choice, and a test in `packages/ui` compares the two in a browser.

To change a preset or add one, edit `packages/theme/src/presets.ts`. The library's build writes `dist/themes/<name>.css` from that list. The generator refuses a theme whose colors don't have enough contrast, and names the pair that failed. The component tests pick up a new preset by themselves.

After upgrading Tailwind, run `pnpm --filter @nuvui/theme sync:palette`. It rewrites `src/palette.ts` from Tailwind's theme file, and a test fails if the two differ.

## Writing

Docs, comments, test names and changesets are all written the same way: plain sentences that say what a thing does. Comments are rare and explain why, not what. Leave out anything that reads like an advertisement.

## Changesets

If a pull request changes what gets published in `@nuvui/react`, it needs a changeset:

```sh
pnpm changeset
```

Pick the bump type and write a sentence or two about what changed, from the point of view of someone using the library. Commit the file it creates in `.changeset`. Changes that only touch the docs site, tests or tooling don't need one.

Before 1.0, a breaking change is a minor bump, and its changeset has to say what breaks and what to do about it.

## Pull requests

A pull request needs:

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e` passing. CI runs the same commands on Linux for every pull request. It then checks the package that would be published, the size of each entry point, and that the packed library installs and builds in a Vite app and a Next.js app.
- Tests for what changed.
- The docs page updated, if behavior, props, CSS variables or class names changed.
- A changeset, if the change reaches the published package.

Keep a pull request to one change. A fix and an unrelated cleanup are easier to review, and to revert, as two.

## License

nuvui is [MIT licensed](LICENSE). Contributions are accepted under the same license.
