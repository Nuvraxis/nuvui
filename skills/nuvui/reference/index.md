<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Getting started

Install nuvui, load its stylesheet once, and render your first component.

nuvui is a set of React components for enterprise applications: the forms, tables, charts and dashboards that business software is made of. The components wrap [Radix UI](https://www.radix-ui.com/primitives) primitives. Radix handles the behavior: focus, keyboard support, ARIA. nuvui adds the styles, written in SCSS with BEM class names and themed through CSS custom properties.

There are seventy-eight components, listed under Components in the menu. Three more, for dates, are in a package of their own, [`@nuvui/date-picker`](date-picker/index.md), tables are in another, [`@nuvui/table`](table/index.md), charts in a third, [`@nuvui/charts`](charts/index.md), barcodes and QR codes in a fourth, [`@nuvui/barcodes`](barcodes/index.md), the parts of a conversation with an assistant in a fifth, [`@nuvui/chat`](chat/index.md), a kanban board in a sixth, [`@nuvui/kanban`](kanban/index.md), a rich text editor in a seventh, [`@nuvui/editor`](editor/index.md), an emoji picker in an eighth, [`@nuvui/emoji`](emoji/index.md), a map in a ninth, [`@nuvui/map`](map/index.md), flow diagrams in a tenth, [`@nuvui/flow`](flow/index.md), video and audio players in an eleventh, [`@nuvui/media`](media/index.md), and moving backgrounds in a twelfth, [`@nuvui/backgrounds`](backgrounds/index.md). A thirteenth, [`@nuvui/icons`](icons/index.md), is a set of icons, and needs only React.

## Install

```sh
pnpm add @nuvui/react
```

npm, yarn and bun work the same way. You also need `react` and `react-dom`, version 18.2 or newer.

## Load the styles

Import the stylesheet once, somewhere that runs for every page. In a Next.js app that's the root layout:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
```

It's a plain CSS file. The components never import CSS themselves, so there's no loader or build plugin to set up, and it works the same with server components.

## Use a component

```tsx
import { Button } from "@nuvui/react";

export default function Page() {
  return <Button>Save changes</Button>;
}
```

## Rendering another element

Many parts take `asChild`. With it, the part doesn't render an element of its own. It gives its props, its classes and its behavior to the one child you put inside:

```tsx
<Button asChild>
  <a href="/pricing">See pricing</a>
</Button>
```

That's a link that looks like a button, and it's how a trigger takes your own button: `<DialogTrigger asChild><Button>Open</Button></DialogTrigger>`.

It only works where there's one child to become. A part that draws something of its own beside what you give it doesn't take `asChild`, and TypeScript says so: a dialog's content has its close button, a checkbox has its tick, a select's trigger has its arrow. Style those with `className`, or with the CSS variables on the component's page.

## Dark mode

Components are light unless you ask for something else. Set `data-theme` on `<html>`, or on any element to theme just that part of the page:

| Value | Result |
| --- | --- |
| `data-theme="light"` | Light |
| `data-theme="dark"` | Dark |
| `data-theme="system"` | Follows the visitor's operating system |

```html
<html lang="en" data-theme="system">
```

`system` is handled in CSS, so there's no script and no flash of the wrong theme on load.

We don't switch to dark automatically. If we did, a site with only a light design would show light text on its white background to everyone whose system is set to dark.

Colors, radii and spacing are all CSS custom properties. [Theming and tokens](theming.md) covers changing them, and has an editor to try it in. It also covers the five [presets](theming.md#presets) that come with the package, and [density](theming.md#density).

## Loading less

`styles.css` contains every component. If you only use a few, import their stylesheets one by one. Each needs the tokens and the base styles loaded as well:

```tsx
import "@nuvui/react/tokens.css";
import "@nuvui/react/base.css";
import "@nuvui/react/css/button.css";
```

The JavaScript has an entry per component too. Bundlers tree-shake the main entry, so this mostly matters if yours doesn't:

```tsx
import { Button } from "@nuvui/react/button";
```

## Browser support

The styles use cascade layers, `oklch()` colors, `color-mix()` and `dvh` units. That means Chrome and Edge 111, Firefox 113 and Safari 16.4, or newer. There's no fallback for older browsers.

The [support policy](support.md) has the versions of React and Node as well, and says which of them the tests run on.

## With Tailwind or Sass

Neither is needed. If your app already uses one, there's a guide for each:

- [Using with Tailwind](tailwind.md) covers the layer order and how to get utilities such as `bg-primary`.
- [Using with SCSS](scss.md) covers the mixins and changing the breakpoints.

For Arabic, Hebrew and other languages that read from the right, see [Right-to-left](right-to-left.md). The few words the components write themselves, and the prop for each, are listed in [Translation](translation.md).

## What isn't here yet

- A 1.0. Until then a minor version may rename or remove things, and the [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does.
- Testing in Safari itself. The tests run in Chromium, Firefox and the WebKit build that Playwright ships, which is close to Safari and isn't Safari.
- More components. There are seventy-eight, and no date for the next ones.
