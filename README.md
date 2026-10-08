# nuvui

React components built on [Radix UI](https://www.radix-ui.com/primitives) primitives and styled with plain SCSS. Class names follow BEM, and the look is controlled through CSS custom properties named after Tailwind v4's theme variables. It will be published as `@nuvui/react`, with add-on packages next to it for the parts that need a library of their own. There are three so far: `@nuvui/date-picker`, `@nuvui/table` and `@nuvui/charts`.

## Status

Early, and not published. You can't install it from the registry yet.

What exists today:

- Fifty-two components. Twenty-one for actions, overlays and navigation: Accordion, AlertDialog, Breadcrumb, Button, Checkbox, Command, ContextMenu, Dialog, DropdownMenu, HoverCard, Menubar, NavigationMenu, Pagination, Popover, Select, Sheet, Sidebar, Switch, Tabs, Toast and Tooltip. Sixteen for forms: ButtonGroup, Combobox, Field, Fieldset, FileUpload, Input, InputGroup, Label, NativeSelect, OtpField, PasswordInput, RadioGroup, Slider, Textarea, Toggle and ToggleGroup. Fifteen for display and layout: Alert, AspectRatio, Avatar, Badge, Card, Collapsible, Empty, Kbd, Progress, ScrollArea, Separator, Skeleton, Spinner, Toolbar and VisuallyHidden. Each has tests for rendering, keyboard behavior, touch sizing, and accessibility in light, dark and forced colors. The tests run in Chromium, Firefox and WebKit.
- `@nuvui/date-picker`, a package of its own with three more: Calendar, DatePicker and DateRangePicker. It's built on react-day-picker and date-fns, which is why it isn't part of the core. It has locales, time zones, and dates that can be typed as well as picked.
- `@nuvui/table`, another package of its own: the elements of a table, styled, and a data table on TanStack Table 9. Sorting, filtering, pagination, row selection, a column chooser, pinned and resizable columns, rows that open, a mode where a server does the sorting, filtering and paging, and virtual rows for tables of thousands. TanStack Table is a peer dependency, and a table only carries the features it's made with.
- `@nuvui/charts`, a third: a container, a tooltip, a legend and a data table for charts built from Recharts 3's own parts. A chart takes its colors from the theme through CSS variables, so a new theme recolors it without drawing it again. Series can be told apart by pattern and dash as well as by color, and each chart can carry its numbers as a table for screen readers. Recharts is a peer dependency.
- A `toast()` function for showing toasts from anywhere, with a `Toaster` to render them.
- `DirectionProvider`, for apps in languages that read from the right.
- The design tokens: color scales, semantic colors for both themes, chart colors, type, spacing, radius, shadow, motion and control sizes. They build to CSS custom properties, and the SCSS source ships alongside.
- Five presets, each a stylesheet that restyles everything, and three densities.
- A docs site with a page for each component, a getting started page, and search that runs in the browser.
- A website around the docs, built with the library's own tokens: a home page with a live dashboard, 39 charts in ten families, each one file to copy, and a theme builder that shows a theme on real components in light and dark and gives it back as CSS.
- Guides for theming, for using the tokens with Tailwind v4, for using the SCSS source, for building forms, with React Hook Form as the worked example, and for right-to-left layouts. The theming page has an editor that changes tokens in the browser and prints the CSS for what you changed.

What's missing:

- A release. The docs site isn't deployed either, so to read the docs you run them locally.
- Testing in Safari itself. WebKit is covered through the build Playwright ships, which is close to Safari and isn't Safari.
- Compiling the whole library from its SCSS source in Next.js with Turbopack on Windows. That's a [known problem in Next.js](https://github.com/vercel/next.js/issues/87243). Loading only the mixins works there, and so does everything on Linux, and under webpack and Vite. The SCSS guide has the details.

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
pnpm playwright:install   # downloads the browsers the tests run in
```

Then:

```sh
pnpm lint        # Biome for TS and JSON, Stylelint for SCSS
pnpm typecheck
pnpm test        # component tests, in a real browser
pnpm build
pnpm test:e2e    # Playwright against the built website and docs
pnpm size        # the size of each entry point against its budget
pnpm dev         # packages in watch mode plus the website and the docs
```

`pnpm dev` serves the website at http://localhost:3001, with the docs under http://localhost:3001/docs.

## Layout

- `packages/ui` is the library that gets published.
- `packages/theme` is the theme generator. It turns a choice of brand color, base color, radius and density into token values and checks their contrast. The presets are written by it. It isn't published.
- `apps/showcase` is the website: the home page, and what goes around the docs. It's built with the library's own tokens, in SCSS, with no Tailwind.
- `apps/docs` is the documentation, served under `/docs` of the same address. Its build is copied into the website's, so the two are one folder of static files.
- `packages/typescript-config` holds the shared tsconfig presets.
- `fixtures` holds two small apps that install the packed library the way a stranger would.

## Testing

Component tests run in Chromium, Firefox and WebKit through Vitest's browser mode, with Playwright driving the browsers. We don't use jsdom, because it has no layout engine and so can't check focus rings, touch target sizes or color contrast. End-to-end tests for the docs site use Playwright directly, in the same three engines plus a phone-sized Chrome and Safari.

The accessibility checks run once for every theme the package ships: the default and each preset, in light and in dark.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the conventions and what a pull request needs. Bug reports and ideas are welcome in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

Security problems go through the process in [SECURITY.md](SECURITY.md), not the public tracker.

## License

[MIT](LICENSE)
