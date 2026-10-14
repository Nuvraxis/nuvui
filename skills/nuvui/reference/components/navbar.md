<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/navbar.mdx. Don't edit it here: run `pnpm skill`. -->

# Navbar

The bar across the top of a site or an app, with its links in the bar on a wide screen and in a panel behind a button on a narrow one.

Use a navbar for the handful of places a whole site or app has, with its name at one end and a few actions at the other. For an app with many sections, use a [sidebar](sidebar.md). For links that open panels of more links, put a [navigation menu](navigation-menu.md) in the bar.

```tsx
import {
  Button,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarMenu,
  NavbarNav,
} from "@nuvui/react";

const pages = [
  { name: "Orders", href: "#orders" },
  { name: "Customers", href: "#customers" },
  { name: "Reports", href: "#reports" },
];

// The links are written once and drawn twice: in the bar on a wide
// screen, and in the panel on a narrow one.
function Links() {
  return pages.map((page, index) => (
    <NavbarLink key={page.href} href={page.href} current={index === 0}>
      {page.name}
    </NavbarLink>
  ));
}

export default function Example() {
  return (
    <Navbar style={{ inlineSize: "100%" }}>
      <NavbarBrand>
        <a href="#home" style={{ color: "inherit", textDecoration: "none" }}>
          Acme
        </a>
      </NavbarBrand>
      <NavbarNav aria-label="Main">
        <Links />
      </NavbarNav>
      <NavbarActions>
        <Button size="sm">New order</Button>
        <NavbarMenu>
          <nav aria-label="Main">
            <Links />
          </nav>
        </NavbarMenu>
      </NavbarActions>
    </Navbar>
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
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarMenu,
  NavbarNav,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS. The panel is a [sheet](sheet.md), so its styles are needed too.

## Parts

| Part | What it is |
| --- | --- |
| `Navbar` | The bar. A `header`. |
| `NavbarBrand` | The name or the logo, at the start. Put a link in it. |
| `NavbarNav` | The links in the bar. A `nav`. Hidden on a narrow screen. |
| `NavbarLink` | One link, in the bar or in the panel. |
| `NavbarActions` | What's at the far end at every width. |
| `NavbarMenu` | The button that's shown on a narrow screen, and the panel it opens. |

## Try it

Make the window narrower than the `collapse` breakpoint to see the button.

## Props

### Navbar

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `sticky` | `boolean` | `false` | Keeps the bar at the top of the window while the page scrolls under it. |
| `hideOnScroll` | `boolean` | `false` | Slides the bar out of the way while the page scrolls down, and brings it back as soon as it scrolls up. It stays while focus is inside it. The bar is sticky when this is on. |
| `collapse` | `"lg" \| "md" \| "sm"` | `"md"` | The breakpoint below which `NavbarNav` is hidden and the button of `NavbarMenu` is shown: 40, 48 or 64rem. |

### NavbarNav

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `nav`, and give it this part's classes and props. For a child that's a `nav` already, such as a `NavigationMenu`. |

### NavbarLink

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `current` | `boolean` | `false` | Marks the link as the page that's open. A screen reader says so, and the link is drawn stronger and underlined. |
| `asChild` | `boolean` | `false` | Render the single child element instead of an `a`, and give it the link's classes and props. This is how you use your router's link. |

### NavbarMenu

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Menu"` | Accessible name of the button, and the title of the panel it opens. Translate it with the rest of your interface. |
| `closeLabel` | `string` | `"Close"` | Accessible name of the button that closes the panel. Translate it with the rest of your interface. |
| `side` | `"end" \| "start"` | `"end"` | The edge of the screen the panel is attached to. |
| `children` | `ReactNode` |  | What's in the panel: the links, and anything else. |

`NavbarBrand` and `NavbarActions` add no props of their own. Every part but `NavbarMenu` takes what its element takes, including `ref` and `className`.

## The links, twice

On a wide screen the links are in `NavbarNav`. On a narrow one they're in the panel of `NavbarMenu`. They're the same links, so write them once, as a component or an array, and put them in both.

The bar doesn't move them for you, because the two places rarely hold quite the same things: a panel has room for the sign-in link that the bar shows as a button, and for a second level that the bar keeps in a menu.

Below the `collapse` breakpoint `NavbarNav` is taken out of the page with CSS, for screen readers as much as for the eye, and the panel's contents are only in the page while it's open. So nothing is announced twice.

## Staying at the top

`sticky` keeps the bar at the top of the window while the page scrolls under it.

`hideOnScroll` is for a phone, where the bar takes a good part of the screen. The bar slides away while the page scrolls down and comes back as soon as it scrolls up, as a browser's own address bar does. It's always there at the top of the page, and it never leaves while focus is inside it.

## The page that's open

`current` on a `NavbarLink` marks it. Which link that is comes from your router:

```tsx
<NavbarLink asChild current={pathname === "/orders"}>
  <Link href="/orders">Orders</Link>
</NavbarLink>
```

## With a navigation menu

When some entries open a panel of more links, the bar's links are a [NavigationMenu](navigation-menu.md). It's a `nav` already, so give `NavbarNav` `asChild`, and it hands the menu its place in the bar without wrapping one `nav` in another.

```tsx
<NavbarNav asChild>
  <NavigationMenu aria-label="Main">…</NavigationMenu>
</NavbarNav>
```

## Accessibility

| Key | What it does |
| --- | --- |
| Tab | Moves through the name, the links and the actions, in the order they're written. |
| Enter | Follows a link, or opens the panel from its button. |
| Escape | Closes the panel, and puts focus back on its button. |

### What the component handles

- The bar is a `header`. At the top level of a page that's the banner landmark.
- `NavbarNav` is a `nav`, which a screen reader can jump to.
- The open page's link has `aria-current="page"`, and differs by a line under it as well as by color.
- The button has a name, says whether the panel is open, and is 44 pixels square.
- The panel is a dialog named by the same word, holds focus while it's open, and closes on Escape.
- Following a link in the panel closes it. That matters for a link to a part of the page that's already open.
- The panel closes by itself when the window gets wide enough for the links to be in the bar.
- A bar that hides on scroll stays while focus is in it, and doesn't slide for a visitor who asked for less motion.

### What you need to handle

- Name `NavbarNav`, and the `nav` in the panel, with `aria-label`: "Main" is the usual name.
- Translate `label` and `closeLabel` on `NavbarMenu`. [Translation](../translation.md) lists them.
- Put a "Skip to content" link before the bar, so a keyboard user doesn't tab through it on every page.
- With `sticky`, give what links jump to a `scroll-margin-top` of the bar's height, or headings land under it.

## On small screens

Below the breakpoint the bar holds the name, the actions and the button. Keep the actions to one or two: a phone is 320 pixels wide at its narrowest.

Links are 44 pixels tall with a finger and 40 with a mouse. In the panel each is a row the width of the panel.

## CSS variables

Set any of these on the `Navbar`, or on anything around it.

```css
.site {
  --nuv-navbar-height: 3.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-navbar-gap` | `calc(var(--spacing) * 4)` | Space between the parts of the bar. |
| `--nuv-navbar-height` | `calc(var(--spacing) * 16)` | Least height of the bar, with its bottom edge. |
| `--nuv-navbar-padding` | `calc(var(--spacing) * 4)` | Space at each end of the bar. |
| `--nuv-navbar-border` | `var(--color-border)` | Color of the line under the bar. |
| `--nuv-navbar-bg` | `var(--color-background)` | Background color. Keep it solid on a sticky bar, so the page doesn't show through. |
| `--nuv-navbar-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-navbar-z` | `20` | Stacking order of a sticky bar. Over the page and under anything that opens over it. |
| `--nuv-navbar-link-radius` | `var(--radius-md)` | Corner radius of a link, and of the button. |
| `--nuv-navbar-link-fg` | `var(--color-muted-foreground)` | Color of a link that isn't the open page. Keep it at 4.5:1 against the bar. |
| `--nuv-navbar-link-hover-bg` | `var(--color-muted)` | Background of a link, and of the button, under the pointer. |
| `--nuv-navbar-link-active-fg` | `var(--color-foreground)` | Color of the open page's link, and of a link under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-navbar` | Navbar |
| `.nuv-navbar--collapse-lg` | collapse="lg" |
| `.nuv-navbar--collapse-md` | collapse="md" |
| `.nuv-navbar--collapse-sm` | collapse="sm" |
| `.nuv-navbar--sticky` | sticky, or hideOnScroll. |
| `.nuv-navbar__actions` | NavbarActions |
| `.nuv-navbar__brand` | NavbarBrand |
| `.nuv-navbar__link` | NavbarLink |
| `.nuv-navbar__menu` | What holds NavbarMenu's children, in the panel. |
| `.nuv-navbar__nav` | NavbarNav |
| `.nuv-navbar__toggle` | The button of NavbarMenu. |

A bar that's out of the way has a `data-hidden` attribute. The panel is a sheet, with the sheet's classes.

## Server components

Navbar starts with `"use client"`: it watches the page scroll, and the panel opens and closes. You can render it from a server component, with links that are server-rendered.

## Do and don't

**Do**

- Keep the bar to five or six links. More than that is a sidebar, or a menu.
- Put the one action that matters most at the far end, and leave the rest for the panel.

**Don't**

- Don't hide the bar on scroll on a wide screen. It costs little room there and people look for it.
- Don't put a second row in it. Tabs for a page belong to the page.
