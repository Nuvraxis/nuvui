# nuvui

React components built on [Radix UI](https://www.radix-ui.com/primitives) primitives and styled with plain SCSS. Class names follow BEM, and the look is controlled through CSS custom properties named after Tailwind v4's theme variables. It will be published as `@nuvui/react`.

## Status

Early, and not published. You can't install it from the registry yet.

What exists today:

- Eleven components: Accordion, Button, Checkbox, Dialog, DropdownMenu, Popover, Select, Switch, Tabs, Toast and Tooltip. Each has tests for rendering, keyboard behavior, touch sizing and accessibility in light and dark.
- A `toast()` function for showing toasts from anywhere, with a `Toaster` to render them.
- The design tokens: color scales, semantic colors for both themes, type, spacing, radius, shadow and motion. They build to CSS custom properties, and the SCSS source ships alongside.
- A docs site with a page for each component, a getting started page, and search that runs in the browser.

What's missing:

- The guides: theming, using the tokens with Tailwind, using the SCSS source.
- Full coverage of forced-colors mode, which is what Windows high contrast turns on. Button, Checkbox, Switch, Tabs, Tooltip and the rows in DropdownMenu and Select are tested there. Accordion, Dialog, Popover and Toast haven't been checked.
- A CONTRIBUTING guide.
- A release. The docs site isn't deployed either, so to read the docs you run them locally.

Tests only run in Chromium so far. Firefox and Safari haven't been checked.

This section gets updated as things land.

## Quick look

```tsx
import "@nuvui/react/styles.css";
import { Button } from "@nuvui/react";

export default function Page() {
  return <Button intent="secondary">Save changes</Button>;
}
```

The stylesheet is a plain CSS file that you import once. Nothing in the JavaScript imports CSS, so there's no loader to configure and it works with server components.

To restyle a component, set its CSS variables. They aren't declared by the library, so any rule of yours wins:

```css
:root {
  --nuv-button-radius: var(--radius-full);
}
```

Dark mode is opt-in. Put `data-theme="dark"` on `<html>`, or `data-theme="system"` to follow the visitor's operating system.

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

`pnpm dev` serves the docs at http://localhost:3000.

## Layout

- `packages/ui` is the library that gets published.
- `apps/docs` is the Next.js documentation site.
- `packages/typescript-config` holds the shared tsconfig presets.

## Testing

Component tests run in Chromium through Vitest's browser mode, with Playwright driving the browser. We don't use jsdom, because it has no layout engine and so can't check focus rings, touch target sizes or color contrast. End-to-end tests for the docs site use Playwright directly.

## Contributing

A CONTRIBUTING guide is still to be written. Until then, bug reports and ideas are welcome in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

Security problems go through the process in [SECURITY.md](SECURITY.md), not the public tracker.

## License

[MIT](LICENSE)
