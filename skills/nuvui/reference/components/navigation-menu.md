<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/navigation-menu.mdx. Don't edit it here: run `pnpm skill`. -->

# Navigation menu

A row of links for a site's header, where some entries open a panel with more links under them.

Use a navigation menu for the main links of a site: a few direct links, and a few buttons that each open a panel with a group of links. One panel serves every button. It changes size and stays in place as the pointer moves along the row.

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";

const guides = [
  {
    name: "Theming",
    about: "Presets, density and your own tokens.",
    href: "/docs/theming",
  },
  {
    name: "Forms",
    about: "Labels, errors and validation.",
    href: "/docs/forms",
  },
  {
    name: "Tailwind",
    about: "Using the tokens as Tailwind's theme.",
    href: "/docs/tailwind",
  },
];

const components = [
  { name: "Button", href: "/docs/components/button" },
  { name: "Dialog", href: "/docs/components/dialog" },
  { name: "Select", href: "/docs/components/select" },
];

const list: CSSProperties = {
  display: "grid",
  gap: 4,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

export default function Example() {
  return (
    <NavigationMenu aria-label="Docs">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul style={list}>
              {guides.map((guide) => (
                <li key={guide.href}>
                  <NavigationMenuLink href={guide.href}>
                    {guide.name}
                    <span
                      style={{
                        color: "var(--color-muted-foreground)",
                        fontWeight: 400,
                      }}
                    >
                      {guide.about}
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul style={list}>
              {components.map((component) => (
                <li key={component.href}>
                  <NavigationMenuLink href={component.href}>
                    {component.name}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/docs/changelog">
            Changelog
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `NavigationMenu` | The `nav` landmark around everything. It also renders the panel, under the list. |
| `NavigationMenuList` | The row of entries. A `ul`. |
| `NavigationMenuItem` | One entry. A `li` that holds either a link, or a trigger and its content. |
| `NavigationMenuTrigger` | A button that opens a panel. It draws its own arrow. |
| `NavigationMenuContent` | What the panel shows for that button. |
| `NavigationMenuLink` | A link, in the row or inside a panel. |

These are separate exports, not properties of `NavigationMenu`. `NavigationMenu.List` isn't available, because property access on a client component doesn't work from a server component.

What goes in `NavigationMenuContent` is up to you. The examples use a `ul` of links.

## Props

### NavigationMenu

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `align` | `"center" \| "end" \| "start"` | `"start"` | Which edge of the menu the open panel lines up with, on screens wide enough for the panel to be narrower than the menu. `"start"` is the left edge in a left-to-right layout. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The `value` of the entry whose panel is open, when you control it yourself. An empty string means none. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The entry whose panel starts open, when you don't control it. |
| `onValueChange` | `((value: string) => void)` |  | Called with an entry's `value` when its panel opens, and with an empty string when the panel closes. |
| `delayDuration` | `number` | `200` | How long the pointer has to rest on a button before its panel opens, in milliseconds. It's 200 unless you say otherwise. |
| `skipDelayDuration` | `number` | `300` | After the panel closes, how long another button can open it without waiting, in milliseconds. It's 300 unless you say otherwise. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. With `"rtl"`, the left and right arrow keys swap. |

### NavigationMenuItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | A name for this entry, to use with the menu's `value`. Only needed when you control which panel is open. |

### NavigationMenuLink

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `active` | `boolean` |  | Marks the link as the page the visitor is on. It gets a fill, heavier text and `aria-current="page"`. |
| `onSelect` | `((event: Event) => void)` |  | Called when the link is followed. Call `event.preventDefault()` in it to leave the panel open. |
| `asChild` | `boolean` |  | Renders the element you pass in place of the `a`. This is how you use your router's link. |

`NavigationMenuTrigger` takes `disabled`, and what a `button` takes. The other parts take what their elements take. The [Radix Navigation Menu reference](https://www.radix-ui.com/primitives/docs/components/navigation-menu#api-reference) has the full list.

## The current page

Pass `active` to the link for the page the visitor is on. Work out which one that is from your router.

```tsx
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@nuvui/react";

const pages = [
  { name: "Overview", href: "/docs" },
  { name: "Theming", href: "/docs/theming" },
  { name: "Navigation menu", href: "/docs/components/navigation-menu" },
];

export default function Example() {
  // In an app this comes from the router, such as usePathname() in Next.js.
  const pathname = "/docs/components/navigation-menu";

  return (
    <NavigationMenu aria-label="Sections">
      <NavigationMenuList>
        {pages.map((page) => (
          <NavigationMenuItem key={page.href}>
            <NavigationMenuLink
              href={page.href}
              active={page.href === pathname}
            >
              {page.name}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## With your router's link

Pass `asChild` and put the router's link inside. It gets the look and the keyboard behavior, and keeps its own way of changing page.

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@nuvui/react";
import Link from "next/link";

export default function Example() {
  return (
    <NavigationMenu aria-label="Guides" align="end">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/">Getting started</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>More guides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul style={{ display: "grid", gap: 4, margin: 0, padding: 0 }}>
              <li style={{ listStyle: "none" }}>
                <NavigationMenuLink asChild>
                  <Link href="/tailwind">Tailwind</Link>
                </NavigationMenuLink>
              </li>
              <li style={{ listStyle: "none" }}>
                <NavigationMenuLink asChild>
                  <Link href="/scss">SCSS</Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Where the panel sits

The panel hangs under the row. On a screen at least 40rem wide it's as wide as what it's showing, between 12rem and 40rem, and `align` says which part of the menu it lines up with: `"start"`, `"center"` or `"end"`. Use `"end"` for a menu at the far side of a header, so the panel doesn't run off the screen. The example above does.

The panel is placed against the menu, not against the button that opened it. That's what lets it stay still while its content changes.

Unlike a popover, it doesn't move itself to stay on the screen. Radix has no collision handling here. The width limits and `align` are what keep it in view, so check a menu at the widths your header is used at.

## On small screens

Below 40rem the panel is as wide as the menu, whatever it holds. Make the menu as wide as the header there, and the panel fills the width of the screen.

The entries are 44 pixels tall on a touch screen, and a row with more entries than fit wraps onto a second line. A tap on a button opens its panel, and a second tap closes it.

That works, but a full site menu on a phone is more often a button that opens a [sheet](sheet.md) with every link in one list. The sheet page has an example.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves through the buttons and links in the row. With a panel open, it goes from the button into the panel, through its links, and on to the next entry. |
| <kbd>→</kbd> and <kbd>←</kbd> | Move to the next or previous entry in the row. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last entry. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On a button, opens its panel, or closes it if it's open. Focus stays on the button. |
| <kbd>↓</kbd> | On a button whose panel is open, moves into the panel. Inside it, moves to the next link. |
| <kbd>↑</kbd> | Inside the panel, moves to the previous link. |
| <kbd>Enter</kbd> | On a link, follows it. |
| <kbd>Esc</kbd> | Closes the panel and returns focus to its button. |

Safari only stops at links with <kbd>Tab</kbd> when "Press Tab to highlight each item on a webpage" is turned on in its settings. With it off, <kbd>Tab</kbd> stops at the buttons, and the arrow keys still reach every link.

### What the component handles

Most of this is Radix.

- The whole thing is a `nav` landmark, and the row is a list.
- The buttons have `aria-expanded`, and `aria-controls` while their panel is open.
- These are links and buttons, not a `menubar` with `menuitem`s. That's deliberate: site navigation is a list of links, and menu roles would tell a screen reader to expect an application's menu.
- The panel comes right after its button in the tab order, though it's somewhere else in the page.
- Opening by the pointer waits 200 milliseconds, so a pointer passing over the row on its way somewhere else opens nothing. The panel stays while the pointer moves from the button onto it.
- A click on a button whose panel the pointer has just opened leaves the panel open. Radix alone closes it there, so that someone who points at a button and then clicks sees the panel open and shut. This is the one thing the library changes. A second click closes it, and so does a click on a button that a click opened.
- The current page's link has `aria-current="page"`, and is marked by its weight as well as its fill, so it doesn't depend on telling two colors apart.
- Buttons and links have a focus ring, and are 44 pixels tall on a touch screen.
- The panel's size and what it shows only animate when the visitor hasn't asked for reduced motion.

### What you need to handle

- The landmark is named "Main" unless you say otherwise. That's Radix's default, and it's in English. Pass `aria-label` to translate it, and to tell two menus on one page apart.
- Don't make a trigger a link as well. A button that opens a panel and also goes somewhere can only do one of those from the keyboard.
- In a right-to-left layout, pass `dir="rtl"`.

### A note on automated checks

While a panel is open, Radix puts an invisible element after the open button that takes focus and is hidden from screen readers. The moment <kbd>Tab</kbd> lands on it, it passes focus on into the panel. That's how the panel comes next in the tab order.

axe reports that element under its `aria-hidden-focus` rule, because it's something focusable inside a hidden part. Focus never stays there. The library's own tests leave that rule out for an open panel for this reason.

## CSS variables

Set any of these on `NavigationMenu`, or on anything around it. The panel is inside the menu, so it picks them up too.

```css
.site-header {
  --nuv-navigation-menu-max-width: 32rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-navigation-menu-item-radius` | `var(--radius-md)` | Corner radius of the buttons and links. |
| `--nuv-navigation-menu-hover-bg` | `var(--color-muted)` | Background of a button or link under the pointer, of the button whose panel is open, and of the current page's link. |
| `--nuv-navigation-menu-offset` | `calc(var(--spacing) * 1.5)` | The gap between the row and the panel. |
| `--nuv-navigation-menu-border` | `var(--color-border)` | Border color of the panel. |
| `--nuv-navigation-menu-radius` | `var(--radius-lg)` | Corner radius of the panel. |
| `--nuv-navigation-menu-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-navigation-menu-shadow` | `var(--shadow-lg)` | Shadow under the panel. |
| `--nuv-navigation-menu-fg` | `var(--color-surface-foreground)` | Text color in the panel. |
| `--nuv-navigation-menu-padding` | `calc(var(--spacing) * 2)` | Padding inside the panel. |
| `--nuv-navigation-menu-min-width` | `12rem` | The narrowest the panel gets on a screen at least 40rem wide. |
| `--nuv-navigation-menu-max-width` | `40rem` | The widest the panel gets there. It's never wider than the screen less 32 pixels. |

The entries in the row take their text color from the page around them.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-navigation-menu` | NavigationMenu. |
| `.nuv-navigation-menu--center` | The menu with align="center". |
| `.nuv-navigation-menu--end` | The menu with align="end". |
| `.nuv-navigation-menu__chevron` | The arrow in a trigger. |
| `.nuv-navigation-menu__content` | NavigationMenuContent. |
| `.nuv-navigation-menu__frame` | The box under the row that holds the panel and lines it up. |
| `.nuv-navigation-menu__link` | NavigationMenuLink. |
| `.nuv-navigation-menu__list` | NavigationMenuList. |
| `.nuv-navigation-menu__trigger` | NavigationMenuTrigger. |
| `.nuv-navigation-menu__viewport` | The panel. Radix calls it the viewport. |

The menu also gets `nuv-navigation-menu--start` at the default alignment, and each entry gets `nuv-navigation-menu__item`. No styles are attached to either.

Radix sets `data-state="open"` on the button whose panel is open and on the panel, `data-active` on a link with `active`, and `data-motion` on the content as one replaces another. The fills and the animations hang off those.

## Server components

The navigation menu parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a menu together inside a server component, as the examples on this page do. Only the row is in the HTML the server sends: a panel's links are rendered when it opens. If those links have to be there for search engines, put them in the page's footer or a sitemap as well.

## Do and don't

**Do**

- Keep the row to a handful of entries, each a word or two.
- Give a panel's links a line of description when their names alone don't say enough.
- Mark the current page.

**Don't**

- Don't use one for the commands of an application. That's a [menubar](menubar.md).
- Don't put a panel inside a panel.
- Don't put a form or anything else that isn't navigation in a panel. For that, use a [popover](popover.md).
