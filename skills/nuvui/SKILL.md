---
name: nuvui
description: Builds React interfaces with nuvui, the @nuvui/* component library for business software (forms, tables, charts, dashboards, chat, kanban, editor, maps, icons). Use when the project has an @nuvui package in its package.json, imports from "@nuvui/react" or another "@nuvui/" package, has classes that begin with "nuv-", or when the user asks for nuvui components, blocks or theming.
---

# nuvui

nuvui is a React component library for business software. The components wrap Radix UI primitives, which handle focus, keys and ARIA. nuvui adds the styles: SCSS compiled to plain CSS, with BEM class names that begin with `nuv-`, in cascade layers, themed with CSS custom properties.

Three things are different from the libraries you may expect, and most mistakes come from them:

- **It's installed, not copied.** Components are imported from `@nuvui/react` and its add-on packages. There's no `components/ui` folder to edit and no command that generates a component.
- **It isn't Tailwind.** No component takes utility classes to look right, and the project may not have Tailwind at all. Looks are changed with props, CSS variables and tokens.
- **One stylesheet per package, loaded once by the app.** A component never imports its own CSS. Without the stylesheet it renders unstyled.

## Before writing anything

1. Read the project's `package.json` for which `@nuvui/*` packages are installed, and at which versions. Use only what's installed, or install what's missing with the project's package manager.
2. Find where the app loads `@nuvui/react/styles.css`, usually the root layout or the entry file. If it isn't loaded, add it there, and the stylesheet of each add-on after it.
3. See how the app styles its own layout: CSS modules, SCSS, Tailwind, plain CSS. Follow that for what you add around the components. Don't bring in a styling tool the app doesn't have. Where the app has nothing yet, write a plain CSS file beside the component, with the theme's tokens: [rules/styling.md](rules/styling.md).
4. Read the reference file for each component you're about to use. [reference.md](reference.md) lists them. Props and parts are easy to guess wrong, and each file has a working example of each thing the component does.

## The packages

| Package | What's in it | Also needs |
| --- | --- | --- |
| `@nuvui/react` | The core: seventy-nine components, the tokens and the themes. | `react`, `react-dom` 18.2 or newer |
| `@nuvui/date-picker` | `Calendar`, `DatePicker`, `DateRangePicker` | |
| `@nuvui/table` | `Table` and its parts, `DataTable` with sorting, filtering, selection, paging and virtual rows | `@tanstack/react-table`, and `@tanstack/react-virtual` only for virtual rows |
| `@nuvui/charts` | `ChartContainer`, tooltip and legend, around Recharts | `recharts` |
| `@nuvui/barcodes` | `Barcode`, `QRCode` | |
| `@nuvui/chat` | Messages, a prompt box, markdown, code blocks, tool calls, sources, threads | `shiki`, only for colored code |
| `@nuvui/kanban` | `Kanban`, a board with cards that drag and move by keyboard | |
| `@nuvui/editor` | `RichTextEditor`, on Tiptap | |
| `@nuvui/emoji` | `EmojiPicker`, `EmojiReaction` | |
| `@nuvui/map` | `MapView`, markers, popups, controls, routes, clusters, on MapLibre | `maplibre-gl` |
| `@nuvui/flow` | `Flow`, a diagram of shapes joined by arrows that pans, zooms and can be edited | |
| `@nuvui/media` | `VideoPlayer`, `AudioPlayer`, `MediaTranscript` and their parts: captions, chapters, qualities, a waveform, streams | `hls.js` or `dashjs`, only for streams |
| `@nuvui/backgrounds` | `GradientBackground`, `GridBackground`, `StarsBackground`, `TopographyBackground`, `HexagonBackground`, `FireworksBackground`, `HoleBackground`, `GlyphBackground` | |
| `@nuvui/3d` | `ModelViewer`, a glTF, GLB or STL model to turn and zoom, from an address or picked files. Needs React 19 | `three`, `@react-three/fiber` |
| `@nuvui/icons` | 317 line icons in three styles, such as `ArrowRightIcon` | |

Every add-on but `@nuvui/icons` needs `@nuvui/react` beside it, and its own stylesheet after the core's:

```tsx
import "@nuvui/react/styles.css";
import "@nuvui/table/styles.css";
```

`@nuvui/icons` needs only React, and has no stylesheet.

The first page of each package's reference says how to install it and what it needs set up. Some have a step that's easy to miss: [rules/packages.md](rules/packages.md).

## Rules

Each links to a file with the reasons and the code. Read the file before working in that area.

**Styling**: [rules/styling.md](rules/styling.md)

- Change how a component looks with its props first, then its `--nuv-*` variables, then tokens. Not with a heavier selector, and never `!important`.
- Every color is a token: `var(--color-primary)`, never a hex value or a named color.
- Don't put Tailwind utilities on a component to restyle it. `className` is for placing it: margin, grid area, width.
- Dark mode is `data-theme` on `<html>`. Density is `data-density`. Neither is a prop or a provider.
- Your own CSS for a block of UI uses BEM with the block's own name, never the `nuv-` prefix.

**Putting components together**: [rules/composition.md](rules/composition.md)

- Most components are several parts. Use every part the reference shows: a `Dialog` needs `DialogContent` with a `DialogTitle`, a `Select` needs `SelectTrigger`, `SelectValue`, `SelectContent` and `SelectItem`.
- `asChild` hands a part's behavior and classes to the one child inside it. It's how a trigger takes your `Button`, and how a `Button` becomes a link.
- A link that looks like a button is `<Button asChild><a href>`. A button that navigates is wrong.
- Use the component that exists: `Empty` for nothing to show, `Alert` for a message in the page, `toast()` for one that passes, `Skeleton` and `Spinner` for waiting, `Badge` for a status.
- `Toaster` is rendered once, near the root. `toast()` is called from anywhere.

**Forms**: [rules/forms.md](rules/forms.md)

- Every control goes in a `Field`, with `FieldLabel`, the control inside `FieldControl`, and `FieldDescription` or `FieldError` as needed. That's what ties the label and the error to the control.
- There's no form component and no validation in the library. Use the browser's, or React Hook Form.
- A `Button` is `type="button"` unless you say `type="submit"`.

**Accessibility**: [rules/accessibility.md](rules/accessibility.md)

- A button with only an icon needs `aria-label`.
- Every `nav` on a page needs its own name: `aria-label="Main"`.
- Each reference file has "What you need to handle". Do what it lists. The component can't.
- Don't say something with color alone.

**Text and direction**: [rules/text-and-direction.md](rules/text-and-direction.md)

- The few words a component writes itself, such as "Close", are English by default and each has a prop. In an app with translations, pass them.
- Right to left needs `dir="rtl"` on `<html>` and `DirectionProvider` around the app. Both.

**Server components**: [rules/server-components.md](rules/server-components.md)

- The parts that hold state carry `"use client"` themselves, so they can be rendered from a server component. Your file needs `"use client"` only for what it does itself: calling a hook, the library's included, passing a function as a prop, or calling `toast()`.
- A child that's a function, or a prop that's one, can't cross from a server component.

## Choosing a component

| For | Use |
| --- | --- |
| An action | `Button`. Several that belong together: `ButtonGroup`, `Toolbar` |
| A choice from a few | `RadioGroup`, `ToggleGroup`, `ChoiceCard` for choices with a description |
| A choice from many | `Select`. With search: `Combobox`. The browser's own: `NativeSelect` |
| On or off | `Switch` for a setting that applies at once, `Checkbox` for one sent with a form |
| Text | `Input`, `Textarea`, `PasswordInput`, `NumberField`, `OtpField`. With an icon or a button inside: `InputGroup` |
| A date | `DatePicker`, `DateRangePicker`, from [`@nuvui/date-picker`](reference/date-picker/index.md) |
| Files | `FileUpload` |
| Something over the page that needs an answer | `Dialog`. For a destructive one: `AlertDialog`. From the edge: `Sheet` |
| Something beside its trigger | `Popover`, `DropdownMenu`, `HoverCard`, `Tooltip` for a name only |
| Commands by typing | `Command` |
| A message in the page | `Alert`. One that passes: `toast()`. Nothing to show: `Empty` |
| Waiting | `Skeleton` for a shape, `Spinner` for a moment, `Progress` for a known amount |
| How far through a long read | `ScrollProgress` |
| Rows | `Table` for plain rows, `DataTable` for sorting, filtering and selection, from [`@nuvui/table`](reference/table/index.md). A list of things with actions: `ListView`, `Item`. A list with a few pinned at the top: `PinnedList` |
| Figures | `Stat`, `Trend`, `FormattedNumber`. Charts: [`@nuvui/charts`](reference/charts/index.md) |
| A barcode or a QR code | [`@nuvui/barcodes`](reference/barcodes/index.md) |
| An emoji to pick, or a reaction | [`@nuvui/emoji`](reference/emoji/index.md) |
| Getting around | `Sidebar`, `Navbar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`, `Stepper`, `TableOfContents` |
| A tree | `Tree` |
| Grouping | `Card`, `Fieldset`, `Accordion`, `Collapsible`, `Separator`, `Resizable`, `ScrollArea` |
| People and status | `Avatar`, `Badge`, `Timeline` |
| A conversation with an assistant | [`@nuvui/chat`](reference/chat/index.md) |
| A board of cards | [`@nuvui/kanban`](reference/kanban/index.md) |
| Formatted text to edit | [`@nuvui/editor`](reference/editor/index.md) |
| A place | [`@nuvui/map`](reference/map/index.md) |
| Steps joined by arrows, a process or an approval path | [`@nuvui/flow`](reference/flow/index.md) |
| A video, a lesson, a recording, a podcast, a voice message | [`@nuvui/media`](reference/media/index.md) |
| A moving background behind a hero, a sign-in page or an empty state | [`@nuvui/backgrounds`](reference/backgrounds/index.md) |
| A 3D model of a product or a part, or one the person uploads to check | [`@nuvui/3d`](reference/3d/index.md) |
| An icon | [`@nuvui/icons`](reference/icons/index.md) |

A core component's file is `reference/components/<name>.md`, with the name in lower case and hyphens: `reference/components/alert-dialog.md`.

Icons are in [`@nuvui/icons`](reference/icons/index.md): 317 line icons in three styles, each named for what it shows with `Icon` at the end, such as `ArrowRightIcon`. The reference lists every name. Don't guess one. An app that already has an icon set keeps using it. The blocks use `lucide-react`.

## Start from a block

Before building a screen from nothing, look in [blocks.md](blocks.md). There are blocks for signing in, dashboards, tables with toolbars, settings pages, chat screens and more, each one TSX file and one SCSS file built from these components. [recipes.md](recipes.md) says which to start from for the screens people ask for most.

A block's files aren't in this skill. They're fetched, and [blocks.md](blocks.md) has the addresses. A block does more than most requests ask for, so take the structure and leave out what wasn't asked for. Where a block can't be fetched, or the app has no Sass, build from the reference files, which have everything a block uses.

## Checking your work

- The project's own lint and typecheck pass. TypeScript catches a wrong prop and a part that can't take `asChild`.
- Every component you used has its stylesheet loaded.
- No color in what you wrote is anything but a token.
- Each interactive thing has a name a screen reader can say, and can be reached and worked with the keyboard.
- It reads right at 320 pixels wide. The components do. Check the layout you put around them.

## More

- [reference.md](reference.md): a file for each component and guide.
- [tokens.md](tokens.md): every design token.
- [blocks.md](blocks.md): the blocks, and how to add one.
- [recipes.md](recipes.md): common screens, and what to build them from.
- The docs, for people: https://nuvui.nuvraxis.com/docs
