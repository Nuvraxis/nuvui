# nuvui

React components for enterprise applications: the data tables, forms, charts, maps, editors and dashboards that business software is made of.

[![npm](https://img.shields.io/npm/v/@nuvui/react?label=%40nuvui%2Freact)](https://www.npmjs.com/package/@nuvui/react)
[![License](https://img.shields.io/github/license/Nuvraxis/nuvui)](LICENSE)

[Website](https://nuvui.nuvraxis.com) · [Docs](https://nuvui.nuvraxis.com/docs) · [Blocks](https://nuvui.nuvraxis.com/blocks) · [Charts](https://nuvui.nuvraxis.com/charts) · [Theme builder](https://nuvui.nuvraxis.com/themes) · [Changelog](https://nuvui.nuvraxis.com/docs/changelog)

## Contents

- [What it is](#what-it-is)
- [Quick start](#quick-start)
- [Packages](#packages)
- [Components](#components)
- [What each add-on does](#what-each-add-on-does)
- [Theming](#theming)
- [The website](#the-website)
- [Using it with a coding agent](#using-it-with-a-coding-agent)
- [Accessibility and testing](#accessibility-and-testing)
- [Support](#support)
- [Status and the road to 1.0](#status-and-the-road-to-10)
- [Working on it](#working-on-it)
- [Contributing](#contributing)
- [License](#license)

## What it is

- **Built on [Radix UI](https://www.radix-ui.com/primitives) primitives**, so focus, keyboard behavior and ARIA come from a tested base.
- **Styled with plain CSS.** One stylesheet, imported once. Nothing in the JavaScript imports CSS, so there's no loader to configure and it works with server components.
- **Restyled through CSS custom properties**, named after Tailwind v4's theme variables. Class names follow BEM with a `nuv-` prefix.
- **Light and dark themes, five presets and three densities**, all from design tokens that ship as CSS and as SCSS source.
- **A core package and thirteen add-ons.** The parts that need a library of their own, such as tables, charts and maps, are separate packages, so an app carries only what it uses.
- **Tested in Chromium, Firefox and WebKit**, for keyboard behavior, touch sizes and accessibility in light, dark and forced colors, with axe in every theme.

## Quick start

```sh
pnpm add @nuvui/react
```

It needs React 18.2 or 19.

```tsx
import "@nuvui/react/styles.css";
import { Button } from "@nuvui/react";

export default function Page() {
  return <Button intent="secondary">Save changes</Button>;
}
```

Dark mode is opt-in. Put `data-theme="dark"` on `<html>`, or `data-theme="system"` to follow the visitor's operating system.

To restyle a component, set its CSS variables. The library doesn't declare them, so any rule of yours wins:

```css
:root {
  --nuv-button-radius: var(--radius-full);
}
```

[Getting started](https://nuvui.nuvraxis.com/docs) has the rest.

## Packages

Each add-on is installed next to `@nuvui/react`, with the library it's built on where that's a peer dependency.

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
| [`@nuvui/emoji`](https://www.npmjs.com/package/@nuvui/emoji) | An emoji picker and a reaction button | `pnpm add @nuvui/emoji` |
| [`@nuvui/map`](https://www.npmjs.com/package/@nuvui/map) | A map on MapLibre, with markers, popups, controls, routes and clusters | `pnpm add @nuvui/map maplibre-gl` |
| [`@nuvui/flow`](https://www.npmjs.com/package/@nuvui/flow) | Flow diagrams that pan, zoom and can be edited | `pnpm add @nuvui/flow` |
| [`@nuvui/media`](https://www.npmjs.com/package/@nuvui/media) | Video and audio players, with HLS and DASH streams | `pnpm add @nuvui/media` |
| [`@nuvui/backgrounds`](https://www.npmjs.com/package/@nuvui/backgrounds) | Moving backgrounds for a hero, a sign-in page or an empty state | `pnpm add @nuvui/backgrounds` |
| [`@nuvui/icons`](https://www.npmjs.com/package/@nuvui/icons) | 317 line icons in three styles. It needs only React | `pnpm add @nuvui/icons` |

## Components

`@nuvui/react` has seventy-eight components.

| Group | Components |
| --- | --- |
| Actions, overlays and navigation (27) | Accordion, ActionBar, AlertDialog, Breadcrumb, Button, Checkbox, Command, ContextMenu, Dialog, DropdownMenu, HoldToConfirm, HoverCard, Menubar, Navbar, NavigationMenu, Pagination, Popover, Select, Sheet, Sidebar, Stepper, Switch, TableOfContents, Tabs, Toast, Tooltip, Tree |
| Forms (20) | ButtonGroup, ChoiceCard, ColorPicker, Combobox, Field, Fieldset, FileUpload, Input, InputGroup, Label, NativeSelect, NumberField, OtpField, PasswordInput, RadioGroup, Rating, Slider, Textarea, Toggle, ToggleGroup |
| Display and layout (31) | Alert, AnimatedNumber, AspectRatio, Avatar, Badge, Card, Carousel, Collapsible, Compare, Confetti, Empty, FormattedNumber, HoloCard, Item, Kbd, ListView, PinnedList, Progress, Resizable, ScrollArea, ScrollProgress, Separator, Skeleton, Spinner, Stat, TextReveal, TextShimmer, Timeline, Toolbar, Trend, VisuallyHidden |

It also has:

- `toast()`, to show a toast from anywhere, with a `Toaster` to render them.
- `DirectionProvider`, for apps in languages that read from right to left.
- A prop for every piece of text a component writes, so an app can be translated. [Translation](https://nuvui.nuvraxis.com/docs/translation) lists them.

## What each add-on does

### `@nuvui/date-picker`

- `Calendar`, `DatePicker` and `DateRangePicker`, on react-day-picker and date-fns.
- Locales and time zones.
- Dates can be typed as well as picked.

### `@nuvui/table`

- The elements of a table, styled, and a data table on TanStack Table 9.
- Sorting, filtering, pagination, row selection, a column chooser, and pinned and resizable columns.
- Rows that open, and a mode where a server does the sorting, filtering and paging.
- Virtual rows for tables with thousands of rows.
- A table carries only the features it's made with.

### `@nuvui/charts`

- A container, a tooltip, a legend and a data table for charts built from Recharts 3's own parts.
- Colors come from the theme through CSS variables, so a new theme recolors a chart without drawing it again.
- Series can be told apart by pattern and dash as well as by color.
- Each chart can carry its numbers as a table for screen readers.

### `@nuvui/barcodes`

- `Barcode` in seventeen kinds, among them Code 128, GS1-128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, ITF-14, MSI, Codabar and Pharmacode, some with check digits.
- `QRCode`, with four levels of error correction and room for a logo or the Swiss cross in the middle.
- Both are SVG with no state, so a server component can render them.
- Both stay black on white in a dark theme, because that's what scans.
- A code can be saved as an SVG or a PNG. The encoders are JsBarcode's and uqr's.

### `@nuvui/chat`

- `Conversation`, which keeps the latest message in view while a reply arrives, and stops following when the reader scrolls up.
- `Message` with a row of actions, `MessageLoader`, `Markdown` for a reply a model wrote, and `CodeBlock`, which can also type its code out.
- `PromptInput`, a box that grows, sends on Enter, takes files and stops a reply. `PromptSuggestion` and `Attachment` go with it.
- `Sources`, `ToolCall` with a question to approve before a tool runs, `Reasoning`, and `ThreadList` for past conversations.
- It takes messages as props and fetches nothing, so it works with whatever talks to your model. react-markdown loads only where the markdown entry is imported, and Shiki is optional, for colored code.

### `@nuvui/kanban`

- `Kanban`, a board of columns with cards that are dragged between and within them.
- Cards also move with the arrow keys from a handle on each card, and a screen reader hears each move.
- It keeps the order and tells you once, when a card is dropped. A move you don't take is undone.

### `@nuvui/editor`

- `RichTextEditor`, on Tiptap: bold and italic, headings, lists, quotes, code and links.
- From a toolbar, from the keyboard, or from a small menu over selected text.
- A character limit and a count.
- Its value is HTML, and it's sent with a form like any field's.

### `@nuvui/emoji`

- `EmojiPicker`, with a search box, groups, a choice of skin tone and the ones picked before.
- It draws the device's own emoji as text, so there's no artwork to load or license.
- It draws only the rows in view, so nineteen hundred emoji come to a few dozen elements. The list loads when a picker is first drawn.
- `EmojiReaction`, a button with an emoji and how many reacted with it.

### `@nuvui/map`

- `MapView`, a map on MapLibre, loaded when a map is first drawn.
- `MapMarker` for a place, as a pin or your own element. `MapPopup` for a box that points at one.
- `MapControls`, for zoom, north up, the reader's location and fullscreen.
- `MapRoute`, a line through a list of places, and `MapClusters`, which gathers nearby places into one button with a number.
- The map takes the arrow keys. It has no tiles of its own: the style you give it says whose map it is.

### `@nuvui/flow`

- `Flow`, a diagram of shapes joined by arrows, drawn as one SVG in a view that pans and zooms.
- Boxes, rounded boxes, circles, diamonds and pills, in five colors, with words that wrap inside them.
- Edges are straight, curved or at right angles, with arrowheads and labels.
- With `editable`, nodes are dragged, joined and removed with a pointer or the keyboard, and the app hears of each change once.
- A screen reader moves between nodes with the arrow keys, and the same diagram is a list of steps behind a button.
- Only what's in view is drawn.

### `@nuvui/media`

- `VideoPlayer`: play, seek with chapters and preview frames, volume, speed with the pitch kept, quality, captions in the theme, picture in picture and fullscreen.
- Controlled from a pointer, a finger or the keyboard. A double tap on a phone skips.
- Files play by themselves. HLS and DASH play through hls.js and dashjs, which the app hands over and which load only when a stream plays.
- `AudioPlayer`, in a podcast layout or as a voice message small enough for a chat, on a seek bar or a waveform.
- `MediaTranscript`, a player's captions beside it as text, marking the line being said.

### `@nuvui/backgrounds`

- Eight moving backgrounds to lay a headline, a form or an empty state on.
- `GradientBackground` and `GridBackground` are drawn in CSS. `StarsBackground`, `TopographyBackground`, `HexagonBackground`, `FireworksBackground`, `HoleBackground` and `GlyphBackground` are drawn on a canvas, and some answer the pointer.
- They take the theme's colors, and a scrim keeps text on them readable.
- They hold still for anyone who asked for less motion, stop while out of view, and draw nothing where the browser forces its colors.
- No dependencies.

### `@nuvui/icons`

- 317 line icons drawn for nuvui on a 24 pixel grid, in Standard, Rounded and Sharp, with the same names in each.
- Each is a React component, such as `ArrowRightIcon`, and an SVG file.
- Icons take the color of the text around them, and are hidden from screen readers unless they have a `title`.
- Each icon is a module of its own, so a page carries only the icons it imports.

## Theming

- **Tokens.** Color scales, semantic colors for both themes, chart colors, type, spacing, radius, shadow, motion and control sizes. They build to CSS custom properties, and the SCSS source ships alongside.
- **Presets.** Five stylesheets, each of which restyles everything, and three densities.
- **The theme builder** on the website shows a theme on real components in light and dark, and gives it back as CSS.
- **Guides** for theming, for using the tokens with Tailwind v4, for using the SCSS source, for building forms with React Hook Form, and for right-to-left layouts.

## The website

[nuvui.nuvraxis.com](https://nuvui.nuvraxis.com) is built with the library's own tokens, and the docs sit under `/docs` of the same site.

- **[82 blocks](https://nuvui.nuvraxis.com/blocks)** in ten groups. A block is a part of an app, such as a sign-in screen, a dashboard or a pricing table, as a TSX file and an SCSS file to copy. The site also serves them as a registry for shadcn's command line tool, at `/r`.
- **[39 charts](https://nuvui.nuvraxis.com/charts)** in ten families, each one file to copy.
- **[A theme builder](https://nuvui.nuvraxis.com/themes).**
- **[Docs](https://nuvui.nuvraxis.com/docs)** with a page for each component, covering its parts, props, examples, CSS variables and classes, and what it leaves to you for accessibility. Search runs in the browser.

## Using it with a coding agent

An agent that hasn't been told about nuvui writes what it knows from other libraries: utility classes on components, a `components/ui` folder, props that don't exist. There are three ways to tell it otherwise.

**The skill.** [`skills/nuvui`](skills/nuvui) is a folder of Markdown that an agent reads when the work calls for it: the rules it gets wrong without being told, and a reference file for each component, written from the docs. Add it with [the `skills` installer](https://github.com/vercel-labs/skills), from your project's folder:

```sh
pnpm dlx skills add Nuvraxis/nuvui
```

It copies the folder to where each agent looks: `.claude/skills` for Claude Code, `.agents/skills` for Cursor, Codex, GitHub Copilot and Gemini CLI. Add `-g` to install it for every project. Commit the folder so everyone on the project has it, and run the command again after you update nuvui.

For an agent the installer doesn't know, copy `skills/nuvui` into the project and name it in the agent's instructions:

```md
This app is built with nuvui. Before writing UI, read skills/nuvui/SKILL.md
and the files it points to.
```

**The MCP server.** The same rules and reference, for an agent to ask while it works, with nothing copied into the project. For Claude Code:

```sh
claude mcp add --transport http nuvui https://nuvui.nuvraxis.com/mcp
```

[MCP server](https://nuvui.nuvraxis.com/docs/mcp) has the steps for Cursor, VS Code, Codex and others.

**Plain text.** [`NuvUIAIAgent.md`](NuvUIAIAgent.md) is the skill's first page as one file. [`/llms.txt`](https://nuvui.nuvraxis.com/llms.txt) lists every docs page, and [`/docs/llms-full.txt`](https://nuvui.nuvraxis.com/docs/llms-full.txt) is all of them in one file.

None of these check what the agent wrote. Run your lint and typecheck, and look at the screen. [Using with AI agents](https://nuvui.nuvraxis.com/docs/agents) has more.

## Accessibility and testing

- **Component tests** run in Chromium, Firefox and WebKit through Vitest's browser mode, with Playwright driving the browsers. They cover rendering, keyboard behavior, touch target sizes, and accessibility in light, dark and forced colors. jsdom isn't used, because it has no layout engine and can't check focus rings, touch sizes or contrast.
- **Axe runs once for every theme** the package ships: the default and each preset, in light and in dark.
- **End-to-end tests** run the built website and docs in Playwright, in Chromium as a desktop and as a phone, and in Firefox. The WebKit setups are in the Playwright configs to run by hand; on our CI runners they were too slow to finish.
- **Consumer tests** pack the packages and install them into three small apps the way a stranger would: one with Vite, one with Next.js, and one on React 18.2.
- **Not yet done:** a check of every component with a screen reader by a person, and testing in Safari itself. WebKit as Playwright ships it is close to Safari, and isn't Safari.

## Support

| | Supported |
| --- | --- |
| React | 18.2 and later 18 releases, and 19. Browser tests run on 19; 18.2 is type-checked, built and rendered on a server. |
| Server components | Yes. Components that need the browser are marked `"use client"`. Tested with Next.js. |
| Node | 18 or newer, and 20 or newer for `@nuvui/table`. Tests run on Node 24. |
| Browsers | Chrome and Edge 111, Firefox 113, Safari 16.4, or newer. |
| TypeScript | Types ship with each package, checked for ES modules and CommonJS. |

The [support policy](https://nuvui.nuvraxis.com/docs/support) has the details, and the [Content Security Policy](https://nuvui.nuvraxis.com/docs/content-security-policy) page has what a site with a strict policy needs.

One known problem: compiling the whole library from its SCSS source in Next.js with Turbopack on Windows fails, because of [an issue in Next.js](https://github.com/vercel/next.js/issues/87243). Loading only the mixins works there, and everything works on Linux and under webpack and Vite. The plain CSS files aren't affected.

## Status and the road to 1.0

The packages are on npm as 0.x versions. Before 1.0, a minor version may rename or remove things, and each package's [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does.

A release becomes 1.0 when all of this is true:

- [x] Every component in every package has its docs page, tests in three browser engines, and axe passing in every theme.
- [ ] The names are frozen: props, variants, CSS variables and class names. A pass over them was made in October 2026. From 1.0, a rename needs a major version.
- [x] Every piece of text the library writes has a prop, and [one page](https://nuvui.nuvraxis.com/docs/translation) lists them.
- [ ] The [support policy](https://nuvui.nuvraxis.com/docs/support) is written, and what it calls supported is tested.
- [ ] Every component has been checked in forced colors and right to left by a test, and with a screen reader by a person.
- [x] The [Content Security Policy](https://nuvui.nuvraxis.com/docs/content-security-policy) a site needs is written down.
- [ ] The packages have been used in at least one real app.

## Working on it

You need Node 22.18 or newer and pnpm 12.

```sh
pnpm install
pnpm playwright:install   # the browsers the tests run in
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | The packages in watch mode, the website at http://localhost:3001 and the docs at http://localhost:3001/docs |
| `pnpm lint` | Biome for TypeScript and JSON, Stylelint for SCSS |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm test` | Component tests, in real browsers |
| `pnpm build` | Every package and app |
| `pnpm test:e2e` | Playwright against the built website and docs |
| `pnpm test:consumers` | Installs the packed packages into the fixture apps and builds them |
| `pnpm size` | The size of each entry point against its budget |
| `pnpm skill` | Writes the agent skill's reference from the docs |

### Repository layout

| Path | What it is |
| --- | --- |
| `packages/ui` | The core library, published as `@nuvui/react` |
| `packages/date-picker`, `table`, `charts`, `barcodes`, `chat`, `kanban`, `editor`, `emoji`, `map`, `flow`, `media`, `backgrounds`, `icons` | The add-ons, each published under its folder's name |
| `packages/theme` | The theme generator: turns a brand color, base color, radius and density into token values and checks their contrast. It writes the presets. Not published |
| `packages/tooling` | What the published packages are built, checked and tested with. Not published |
| `packages/telemetry` | Sends the site's web vitals to an OpenTelemetry collector. Not published |
| `packages/typescript-config` | The shared tsconfig presets |
| `apps/showcase` | The website: home page, charts, theme builder and blocks. A block is a folder under `apps/showcase/src/blocks` with a `block.json` |
| `apps/docs` | The docs, served under `/docs`. Its build is copied into the website's, so the two are one folder of static files |
| `apps/mcp` | The MCP server, which answers from the skill and the blocks. Not published to npm |
| `apps/Dockerfile` | Builds both apps into one image, served by nginx |
| `fixtures` | Three small apps that install the packed library, one of them on React 18.2 |
| `skills/nuvui` | The skill for coding agents, with `NuvUIAIAgent.md` as its first page |

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the conventions and what a pull request needs. Bug reports and ideas are welcome in the [issue tracker](https://github.com/Nuvraxis/nuvui/issues). Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

Security problems go through the process in [SECURITY.md](SECURITY.md), not the public tracker.

## License

[MIT](LICENSE)
