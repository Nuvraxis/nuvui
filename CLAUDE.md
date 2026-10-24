@AGENTS.md

# nuvui

An open source React component library for business software: `@nuvui/react` and its add-on packages, a website and docs, an MCP server, and the service behind the site's Ask AI panel. Everything is in this one pnpm and Turborepo workspace.

This file is the short version of how work is done here, for people and for the coding agents they work with. [CONTRIBUTING.md](CONTRIBUTING.md) is the whole of it, with the reasons. Where the two seem to differ, CONTRIBUTING.md is right, and this file should be fixed.

## Before you start

- **pnpm, for everything.** Never npm, npx or yarn, in a command or in the docs: `pnpm add`, `pnpm install`, `pnpm dlx`. The version is in `packageManager` in the root `package.json`, and Node's in `.nvmrc`.
- **After `pnpm add`, look at `git diff pnpm-workspace.yaml`.** pnpm holds back versions published in the last day or so. Asking for one by its exact number installs it anyway and writes a `minimumReleaseAgeExclude` list into `pnpm-workspace.yaml`, which goes around that policy. Restore the files and take the older version instead.
- **Radix packages move together.** Every `@radix-ui/*` package in `packages/ui` has to be on the same release, or two copies of an internal such as `react-direction` end up installed and half the components miss a provider's context. After adding one, check with `pnpm --filter @nuvui/react why @radix-ui/react-direction`.
- **Build from scratch.** Another library or site can be a description of what to make, never a source: none of its code, CSS, timings or easing comes in here.
- **Never commit a token.** Keys go in `.env.local` at the root, which git ignores.

## Commands

From the root. The full table is in [Commands](CONTRIBUTING.md#commands).

| Command | |
| --- | --- |
| `pnpm install` and `pnpm playwright:install` | Once, and the second again after Playwright is upgraded |
| `pnpm dev` | The website at http://localhost:3001, with the docs under `/docs` |
| `pnpm lint` / `pnpm lint:fix` | Biome for TypeScript and JSON, Stylelint for SCSS |
| `pnpm typecheck` | Every workspace |
| `pnpm test` | Every package's tests, in Chromium, Firefox and WebKit |
| `pnpm test:scripts` | The tests of the scripts in `scripts/`, with no browser |
| `pnpm build` | The packages, then the docs and the website |
| `pnpm skill` / `pnpm check:skill` | Writes the agent skill from the docs, or checks it isn't behind |

While working on one thing, run one package in one browser:

```sh
NUVUI_BROWSERS=chromium pnpm --filter @nuvui/react exec vitest run src/components/dialog
```

## How the library is built

The reasons are in [How the library is built](CONTRIBUTING.md#how-the-library-is-built).

- Components wrap Radix primitives, use `forwardRef`, and export flat names: `DialogContent`, not `Dialog.Content`.
- `"use client"` is on line 1 of a file with state, effects or a Radix primitive that has them, and on no other.
- No JavaScript file imports a stylesheet. The consumer imports the CSS.
- The props the library adds are in an interface named `<Part>OwnProps`, with a JSDoc comment and an `@default` on each. The docs print those comments.
- Text a component writes itself is a prop with an English default, and the comment "Translate it with the rest of your interface." It's listed in `apps/docs/content/docs/translation.mdx`.
- A theme is token values and nothing else, and dark mode is opt-in, through `data-theme`.

## Styles

SCSS, checked by Stylelint. The rest of the list is in [Style conventions](CONTRIBUTING.md#style-conventions).

- BEM with the prefix written out: `.nuv-dialog`, `.nuv-dialog__title`, `.nuv-dialog--lg`. The website's classes start with `site`, and a block's with the block's own name.
- Every rule is inside `@layer components`. Selectors are flat, with nesting for states and at-rules only, and no IDs.
- No color is written out. Components read semantic tokens, `var(--color-primary)`, never a raw scale.
- A component's own variable is a fallback where it's used, `var(--nuv-button-radius, var(--radius-md))`, and is never declared.
- Controls are 44 pixels by default, through the `touch-target` mixin, and denser inside `fine-pointer`.
- Logical properties (`padding-inline`, `inset-inline-end`), mobile first, and the `hover`, `focus-ring` and `motion-safe` mixins.

## Tests

What a component needs is in [Adding a component](CONTRIBUTING.md#adding-a-component): rendering and every prop, the keyboard, axe in every theme, a visible focus ring, the denser size with a mouse, the touch size in `test/touch.test.tsx`, forced colors in `test/forced-colors.test.tsx`, and no animation under reduced motion.

The tests run in real browsers, on Windows and on Linux, and on CI's runners, which are slow and have other fonts. A test that passes on one machine and not another is wrong. What's caught tests out here before:

- **Hardware.** A page that has had touch switched on and off reports no pointer on Linux, and a mouse on Windows. Touch tests are in a file of their own.
- **Fonts.** A box as tall as a line of text is a different height with another font. Measure the space between boxes, not a box sized by text, and allow for a fraction of a pixel where Firefox lays one out.
- **Timing.** Radix moves focus a moment after an arrow key. Wait for it with `await expect.poll(...)` rather than reading `document.activeElement` straight away.
- **Reduced motion.** WebKit on Linux reports reduced motion unless it's asked for `no-preference`, so a test of an animation sets that first.
- **WebGL.** Headless Firefox on Linux has none.

## Docs and the agent skill

- A change to what a component does, a prop, a CSS variable or a class name changes its page under `apps/docs/content/docs/`. Examples are files in `apps/docs/examples/`, so the code on a page is code that runs.
- The agent skill in `skills/nuvui` is written from the docs. After a change to a page, an example, a prop, a component's styles or a block's manifest, run `pnpm build` and then `pnpm skill`, and keep what it writes. CI fails when it's behind.
- Never edit what a script writes: `skills/nuvui/reference/`, `NuvUIAIAgent.md`, the packages' `CHANGELOG.md`, `apps/mcp/versions/`, or the icons in `packages/icons/svg/`, which come from Figma.
- The MCP server's tools are in `apps/mcp/src/tools.ts`, and the Ask AI service gives the same ones to its model. When their list changes on purpose, write `apps/mcp/tools.json` again with `pnpm --filter @nuvui/mcp test -u`.

## Writing

Docs, comments, test names, changesets and pull requests are written the same way ([Writing](CONTRIBUTING.md#writing)):

- Plain sentences that say what a thing does. Nothing that reads like an advertisement.
- No em dashes and no emoji. A comma, a colon, brackets or two sentences do the job.
- Comments are rare, and say why, not what.
- Names, figures and companies in examples and blocks are made up, and look it.

## Pull requests

What one needs is in [Pull requests](CONTRIBUTING.md#pull-requests):

- One change. A fix and an unrelated cleanup are two pull requests.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` passing. `ci.yml` runs them on every pull request.
- Tests for what changed, and the docs page if behavior, props, CSS variables or class names changed.
- A changeset, from `pnpm changeset`, if it changes what a published package ships. Before 1.0 a breaking change is a minor bump that says what to do about it.
- Actions in a workflow are named by a commit, with the version in a comment. Dependabot proposes the next one.

The **Conventions** workflow reads each pull request and writes one comment on it, kept up to date, with what it may have missed from this list and what to do about each. It only advises: a reviewer decides. `scripts/pr-conventions.mjs` has what it looks for.
