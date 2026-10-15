# nuvui

React components for enterprise applications: the data tables, forms, charts and dashboards that business software is made of. They're built on [Radix UI](https://www.radix-ui.com/primitives) primitives and styled with plain SCSS. Class names follow BEM, and the look is controlled through CSS custom properties named after Tailwind v4's theme variables. It's published as `@nuvui/react`, with add-on packages next to it for the parts that need a library of their own. There are ten: date pickers, tables, charts, barcodes, chat, a kanban board, a rich text editor, an emoji picker, a map and a set of icons.

The website and the docs are at [nuvui.nuvraxis.com](https://nuvui.nuvraxis.com).

## Install

```sh
pnpm add @nuvui/react
```

It needs React 18 or 19. Each add-on is installed next to it, with the library it's built on where that's a peer dependency:

| Package | What it adds | Install |
| --- | --- | --- |
| [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react) | The components, the tokens and the presets | `pnpm add @nuvui/react` |
| [`@nuvui/date-picker`](https://www.npmjs.com/package/@nuvui/date-picker) | A calendar, a date field and a date range field | `pnpm add @nuvui/date-picker` |
| [`@nuvui/table`](https://www.npmjs.com/package/@nuvui/table) | Tables, and a data table on TanStack Table 9 | `pnpm add @nuvui/table @tanstack/react-table` |
| [`@nuvui/charts`](https://www.npmjs.com/package/@nuvui/charts) | Charts on Recharts 3 | `pnpm add @nuvui/charts recharts` |
| [`@nuvui/barcodes`](https://www.npmjs.com/package/@nuvui/barcodes) | Barcodes and QR codes, drawn as SVG | `pnpm add @nuvui/barcodes` |
| [`@nuvui/chat`](https://www.npmjs.com/package/@nuvui/chat) | The parts of a conversation with an assistant | `pnpm add @nuvui/chat` |
| [`@nuvui/kanban`](https://www.npmjs.com/package/@nuvui/kanban) | A board of columns with cards that are moved between them | `pnpm add @nuvui/kanban` |
| [`@nuvui/editor`](https://www.npmjs.com/package/@nuvui/editor) | A rich text editor on Tiptap, with HTML as its value | `pnpm add @nuvui/editor` |
| [`@nuvui/emoji`](https://www.npmjs.com/package/@nuvui/emoji) | An emoji picker with search, groups, skin tones and recent ones, and a reaction button | `pnpm add @nuvui/emoji` |
| [`@nuvui/map`](https://www.npmjs.com/package/@nuvui/map) | A map on MapLibre, with markers, popups, controls, routes and clusters | `pnpm add @nuvui/map maplibre-gl` |
| [`@nuvui/icons`](https://www.npmjs.com/package/@nuvui/icons) | 317 line icons drawn for nuvui, in three styles, as React components and SVG files. It needs only React | `pnpm add @nuvui/icons` |

[Getting started](https://nuvui.nuvraxis.com/docs) has the rest.

## Using it with a coding agent

An agent that hasn't been told about nuvui writes what it knows from other libraries: utility classes on components, a `components/ui` folder, props that don't exist. The repository has a skill that tells it otherwise, in [`skills/nuvui`](skills/nuvui). A skill is a folder of Markdown that an agent reads when the work calls for it.

Add it to your project with [the `skills` installer](https://github.com/vercel-labs/skills), run from the project's folder:

```sh
pnpm dlx skills add Nuvraxis/nuvui
```

It asks which agents to install for and copies the folder to where each one looks: `.claude/skills` for Claude Code, `.agents/skills` for Cursor, Codex, GitHub Copilot and Gemini CLI. Add `-g` to install it for every project of yours. Commit the folder, so that everyone on the project has it.

From then on there's nothing to type. The agent loads the skill when it sees nuvui in the project: a `@nuvui/` package in `package.json`, an import from one, or a class that begins with `nuv-`. Ask for what you want, such as "add a form to invite a teammate", and it reads the rules and the reference file of each component it uses.

After you update nuvui, run the command again to update the skill with it.

For an agent the installer doesn't know, copy `skills/nuvui` into the project and name it in the agent's instructions file:

```md
This app is built with nuvui. Before writing UI, read skills/nuvui/SKILL.md
and the files it points to.
```

[`NuvUIAIAgent.md`](NuvUIAIAgent.md) is the skill's first page as one file, to hand to a model directly. For one that takes a URL, the docs are served as plain text: [`/llms.txt`](https://nuvui.nuvraxis.com/llms.txt) lists every page, and [`/docs/llms-full.txt`](https://nuvui.nuvraxis.com/docs/llms-full.txt) is all of them in one file.

The skill doesn't check what the agent wrote. Run your lint and typecheck, and look at the screen. [Using with AI agents](https://nuvui.nuvraxis.com/docs/agents) has the rest: what's in the skill, and what it tells an agent.

## Status

Early. The packages are on npm as 0.x versions. Before 1.0 a minor version may rename or remove things, and each package's [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does.

What exists today:

- Seventy-five components. Twenty-seven for actions, overlays and navigation: Accordion, ActionBar, AlertDialog, Breadcrumb, Button, Checkbox, Command, ContextMenu, Dialog, DropdownMenu, HoldToConfirm, HoverCard, Menubar, Navbar, NavigationMenu, Pagination, Popover, Select, Sheet, Sidebar, Stepper, Switch, TableOfContents, Tabs, Toast, Tooltip and Tree. Twenty for forms: ButtonGroup, ChoiceCard, ColorPicker, Combobox, Field, Fieldset, FileUpload, Input, InputGroup, Label, NativeSelect, NumberField, OtpField, PasswordInput, RadioGroup, Rating, Slider, Textarea, Toggle and ToggleGroup. Twenty-eight for display and layout: Alert, AnimatedNumber, AspectRatio, Avatar, Badge, Card, Carousel, Collapsible, Confetti, Empty, FormattedNumber, HoloCard, Item, Kbd, ListView, Progress, Resizable, ScrollArea, Separator, Skeleton, Spinner, Stat, TextReveal, TextShimmer, Timeline, Toolbar, Trend and VisuallyHidden. Each has tests for rendering, keyboard behavior, touch sizing, and accessibility in light, dark and forced colors. The tests run in Chromium, Firefox and WebKit.
- `@nuvui/date-picker`, a package of its own with three more: Calendar, DatePicker and DateRangePicker. It's built on react-day-picker and date-fns, which is why it isn't part of the core. It has locales, time zones, and dates that can be typed as well as picked.
- `@nuvui/table`, another package of its own: the elements of a table, styled, and a data table on TanStack Table 9. Sorting, filtering, pagination, row selection, a column chooser, pinned and resizable columns, rows that open, a mode where a server does the sorting, filtering and paging, and virtual rows for tables of thousands. TanStack Table is a peer dependency, and a table only carries the features it's made with.
- `@nuvui/charts`, a third: a container, a tooltip, a legend and a data table for charts built from Recharts 3's own parts. A chart takes its colors from the theme through CSS variables, so a new theme recolors it without drawing it again. Series can be told apart by pattern and dash as well as by color, and each chart can carry its numbers as a table for screen readers. Recharts is a peer dependency.
- `@nuvui/barcodes`, a fourth: `Barcode` in seventeen kinds (Code 128, GS1-128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, ITF-14, MSI, Codabar and Pharmacode, some with check digits) and `QRCode` with four levels of error correction and room for a logo or the Swiss cross in the middle. Both are SVG with no state, so a server component can render them, and both stay black on white in a dark theme because that's what scans. A code can be saved as an SVG or a PNG. The encoders are JsBarcode's and uqr's.
- `@nuvui/chat`, a fifth: `Conversation`, which keeps the latest message in view while a reply arrives and stops following when the reader scrolls up, `Message` with a row of actions, `MessageLoader`, `Markdown` for a reply a model wrote, `CodeBlock`, `PromptInput`, a box that grows, sends on Enter, takes files and stops a reply, `PromptSuggestion`, `Attachment`, `Sources`, `ToolCall`, with a question to approve before a tool runs, `Reasoning` and `ThreadList`, the list of past conversations. It takes messages as props and fetches nothing, so it works with whatever talks to your model. Its markdown entry brings react-markdown, loaded only where it's imported, and Shiki is optional, for colored code.
- `@nuvui/kanban`, a sixth: `Kanban`, a board of columns with cards that are dragged between and within them, moved with the arrow keys from a handle on each card, and read out as they move. It keeps the order and tells you once, when a card is dropped. A move you don't take is undone.
- `@nuvui/editor`, a seventh: `RichTextEditor`, a box to write formatted text in, on Tiptap. Bold and italic, headings, lists, quotes, code and links, from a toolbar, from the keyboard or from a small menu over selected text, with a character limit and a count. Its value is HTML, and it's sent with a form like any field's.
- `@nuvui/emoji`, an eighth: `EmojiPicker`, a panel to pick an emoji from, with a search box, the emoji in their groups, a choice of skin tone and the ones picked before. It draws the device's own emoji, as text, so there's no artwork to load or to license, and it draws only the rows in view, so nineteen hundred emoji are a few dozen elements. The list is a grid with one stop for the Tab key, and each emoji is read by its name. The list of emoji is loaded when a picker is first drawn. And `EmojiReaction`, a button with an emoji and how many reacted with it, pressed when the reader is one of them.
- `@nuvui/map`, a ninth: `MapView`, a map on MapLibre, with `MapMarker` for a place, drawn as a pin or as your own element and read by its name, `MapPopup` for a box that points at one, and `MapControls`, the library's own buttons to zoom, turn north up, find the reader and fill the screen. `MapRoute` is a line through a list of places, and `MapClusters` gathers places that are near each other into one button with a number on it. The map takes the arrow keys, and each marker that does something is a button. It has no tiles of its own: the style you give it says whose map it is. MapLibre is loaded when a map is first drawn.
- `@nuvui/icons`, a tenth: 317 line icons drawn for this library on a 24 pixel grid, in three styles, Standard, Rounded and Sharp, with the same names in each. Each is a React component, such as `ArrowRightIcon`, in the color of the text around it and hidden from screen readers unless it has a `title`, and an SVG file. Each icon is a module of its own, so a page carries only the icons it imports. It needs only React, and none of the other packages uses it.
- A `toast()` function for showing toasts from anywhere, with a `Toaster` to render them.
- `DirectionProvider`, for apps in languages that read from the right.
- The design tokens: color scales, semantic colors for both themes, chart colors, type, spacing, radius, shadow, motion and control sizes. They build to CSS custom properties, and the SCSS source ships alongside.
- Five presets, each a stylesheet that restyles everything, and three densities.
- A [skill for coding agents](https://nuvui.nuvraxis.com/docs/agents), in `skills/nuvui`: the rules an agent gets wrong without being told, and a reference file for each component, written from the docs so it can't fall behind them. [Using it with a coding agent](#using-it-with-a-coding-agent) says how to add it to a project.
- A [docs site](https://nuvui.nuvraxis.com/docs) with a page for each component, a getting started page, and search that runs in the browser.
- A [website](https://nuvui.nuvraxis.com) around the docs, built with the library's own tokens: a home page with a live dashboard, [39 charts](https://nuvui.nuvraxis.com/charts) in ten families, each one file to copy, a [theme builder](https://nuvui.nuvraxis.com/themes) that shows a theme on real components in light and dark and gives it back as CSS, and [62 blocks](https://nuvui.nuvraxis.com/blocks) in eight groups. A block is a part of an app, such as a sign-in screen, a dashboard or a pricing table, as a TSX file and an SCSS file to copy. The site also serves them as a registry for shadcn's command line tool, at `/r`. The docs carry the website's header, so either leads to the other.
- Guides for theming, for using the tokens with Tailwind v4, for using the SCSS source, for building forms, with React Hook Form as the worked example, and for right-to-left layouts. The theming page has an editor that changes tokens in the browser and prints the CSS for what you changed.

What's missing:

- Testing in Safari itself. WebKit is covered through the build Playwright ships, which is close to Safari and isn't Safari.
- Compiling the whole library from its SCSS source in Next.js with Turbopack on Windows. That's a [known problem in Next.js](https://github.com/vercel/next.js/issues/87243). Loading only the mixins works there, and so does everything on Linux, and under webpack and Vite. The SCSS guide has the details.

This section gets updated as things land.

## What 1.0 means

The releases so far are 0.x. One becomes 1.0 when all of this is true:

- Every component in every package has its page in the docs, its tests in three browser engines, and axe passing in every theme. That's done.
- The names are frozen: props, variants, CSS variables and class names. A pass over them was made in October 2026, and from 1.0 a rename needs a major version.
- Every piece of text the library writes has a prop, and one page lists them. That's done: [translation](https://nuvui.nuvraxis.com/docs/translation).
- The [support policy](https://nuvui.nuvraxis.com/docs/support) is written, and what it calls supported is tested. React 18.2 is type-checked, built and rendered on a server. The component tests in a browser run on React 19 only.
- Every component has been checked in a forced-colors theme and in a right-to-left layout by a test, and with a screen reader by a person.
- The policy a site with a strict Content Security Policy needs is written down. That's done: [Content Security Policy](https://nuvui.nuvraxis.com/docs/content-security-policy).
- The packages have been used in at least one real app. They're published under 0.x, which is what makes that possible.

Until then a minor version may rename or remove things, and the changelog says so where one does.

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

You need Node 22.18 or newer and pnpm 12.

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

- `packages/ui` is the library, published as `@nuvui/react`.
- `packages/date-picker`, `packages/table`, `packages/charts`, `packages/barcodes`, `packages/chat`, `packages/kanban`, `packages/editor`, `packages/emoji` and `packages/map` are the add-ons, each published under its folder's name.
- `packages/theme` is the theme generator. It turns a choice of brand color, base color, radius and density into token values and checks their contrast. The presets are written by it. It isn't published.
- `apps/showcase` is the website: the home page, the charts, the theme builder and the blocks. It's built with the library's own tokens, in SCSS, with no Tailwind. A block is a folder under `apps/showcase/src/blocks`, with a `block.json` that says what it is.
- `apps/docs` is the documentation, served under `/docs` of the same address. Its build is copied into the website's, so the two are one folder of static files.
- `apps/Dockerfile` builds the two apps into one image, nginx serving the static files.
- `packages/telemetry` sends the site's web vitals to an OpenTelemetry collector. It isn't published.
- `packages/tooling` is what the published packages are built, checked and tested with. It isn't published.
- `packages/typescript-config` holds the shared tsconfig presets.
- `fixtures` holds three small apps that install the packed library the way a stranger would, one of them on React 18.2.
- `skills/nuvui` is the skill for coding agents, and `NuvUIAIAgent.md` its first page. The reference in it is written from the docs by `pnpm skill`.

## Testing

Component tests run in Chromium, Firefox and WebKit through Vitest's browser mode, with Playwright driving the browsers. We don't use jsdom, because it has no layout engine and so can't check focus rings, touch target sizes or color contrast. End-to-end tests for the docs site and the website use Playwright directly. CI runs them in Chromium, as a desktop and as a phone, and in Firefox. The WebKit setups, a desktop and a phone, are still in the Playwright configs to run by hand: on our runners they were too slow to finish.

The accessibility checks run once for every theme the package ships: the default and each preset, in light and in dark.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the conventions and what a pull request needs. Bug reports and ideas are welcome in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

Security problems go through the process in [SECURITY.md](SECURITY.md), not the public tracker.

## License

[MIT](LICENSE)
