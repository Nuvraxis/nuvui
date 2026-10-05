# nuvui

React components built on [Radix UI](https://www.radix-ui.com/primitives) primitives and styled with plain SCSS. Class names follow BEM, and the look is controlled through CSS custom properties named after Tailwind v4's theme variables. It will be published as `@nuvui/react`.

## Status

Not usable yet. Nothing is published.

What exists today is the scaffolding (the monorepo, the package build, linting, the test setup and the CI config) and the design tokens: color scales, semantic colors for light and dark, type, spacing, radius, shadow and motion. They build to CSS custom properties, and the SCSS source ships alongside. There are no components yet, so there's nothing to render. The docs site is a single placeholder page.

The order of work from here:

1. Button and Dialog, with tests and docs pages
2. Popover, Tooltip, DropdownMenu, Select, Checkbox, Switch, Tabs, Accordion and Toast
3. The guides: theming, using it with Tailwind, using it with SCSS

This section gets updated as those land.

## Working on it

You need Node 22 or newer and pnpm 12.

```sh
pnpm install
pnpm playwright:install   # downloads the Chromium build the tests run in
```

Then:

```sh
pnpm lint        # Biome for TS and JSON, Stylelint for SCSS
pnpm typecheck
pnpm test        # component tests, in a real browser
pnpm build
pnpm test:e2e    # Playwright against the built docs site
pnpm dev         # package in watch mode plus the docs site
```

## Layout

- `packages/ui` is the library that gets published.
- `apps/docs` is the Next.js documentation site.
- `packages/typescript-config` holds the shared tsconfig presets.

## Testing

Component tests run in Chromium through Vitest's browser mode, with Playwright driving the browser. We don't use jsdom, because it has no layout engine and so can't check focus rings, touch target sizes or color contrast. End-to-end tests for the docs site use Playwright directly.

## Contributing

A CONTRIBUTING guide comes once there's a component to use as the worked example. Until then, bug reports and ideas are welcome in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

Security problems go through the process in [SECURITY.md](SECURITY.md), not the public tracker.

## License

[MIT](LICENSE)
