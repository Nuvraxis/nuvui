<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/sidebar.mdx. Don't edit it here: run `pnpm skill`. -->

# Sidebar

An app's navigation down the side of the screen. It collapses to a strip of icons, becomes a panel on a phone, and remembers how it was left.

Use a sidebar for the main navigation of an app with more destinations than a row across the top can hold. It stays in place while the page scrolls, and people can collapse it when they want the room.

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";

function Icon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const icons = {
  home: "M2.5 7.5 8 3l5.5 4.5V13H10V9.5H6V13H2.5z",
  inbox:
    "M2.5 9.5l1.75-6h7.5l1.75 6V13h-11zM2.5 9.5h3.25l.75 1.5h3l.75-1.5h3.25",
  chart: "M3 13V8M8 13V3M13 13V6",
  people:
    "M6 7.5A2.25 2.25 0 1 0 6 3a2.25 2.25 0 0 0 0 4.5zM2 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M11 3.2a2.25 2.25 0 0 1 0 4.1M12 9.8c1.2.4 2 1.4 2 3.2",
  settings: "M3 5h6M12 5h1M3 11h1M7 11h6M10.5 3.5v3M5.5 9.5v3",
  help: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM6.5 6.25a1.6 1.6 0 1 1 2.4 1.4c-.6.35-.9.7-.9 1.35M8 11.25v.01",
};

export default function Example() {
  return (
    <SidebarProvider
      // In an app the layout fills the screen. Here it's a box.
      style={
        {
          "--nuv-sidebar-height": "26rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        } as CSSProperties
      }
    >
      <Sidebar label="Main">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Acme, home">
                <a href="#home">
                  <Icon d={icons.home} />
                  <span style={{ fontWeight: 600 }}>Acme</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild active tooltip="Inbox">
                  <a href="#inbox">
                    <Icon d={icons.inbox} />
                    <span>Inbox</span>
                    <SidebarMenuBadge>12</SidebarMenuBadge>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reports">
                  <a href="#reports">
                    <Icon d={icons.chart} />
                    <span>Reports</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Customers">
                  <a href="#customers">
                    <Icon d={icons.people} />
                    <span>Customers</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <a href="#settings">
                    <Icon d={icons.settings} />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Help">
                <a href="#help">
                  <Icon d={icons.help} />
                  <span>Help</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {/* A page has one main element, and on this page it's the docs' own.
          In an app, leave asChild out and SidebarMain is that element. */}
      <SidebarMain asChild>
        <div style={{ padding: 16 }}>
          <SidebarTrigger />
          <p style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 600 }}>
            Inbox
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Twelve conversations are waiting for a reply.
          </p>
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
```

Press the button at the top of the page area, or <kbd>Ctrl</kbd> + <kbd>B</kbd>. On a phone the same button opens the sidebar as a panel over the page.

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `SidebarProvider` | Holds the state, and lays the sidebar and the page out side by side. |
| `Sidebar` | The sidebar. A `nav` element in the page, and a dialog on a phone. |
| `SidebarMain` | The page next to the sidebar. A `main` element. |
| `SidebarTrigger` | A button that collapses and expands the sidebar. |
| `SidebarHeader` | Stays at the top of the sidebar. |
| `SidebarContent` | The part in between, which scrolls when it's long. |
| `SidebarFooter` | Stays at the bottom. |
| `SidebarGroup` | A set of items. |
| `SidebarGroupLabel` | The heading over a group. |
| `SidebarSeparator` | A line between groups. |
| `SidebarMenu` | A list of items. A `ul`. |
| `SidebarMenuItem` | One item in it. An `li`. |
| `SidebarMenuButton` | The item's button, or its link with `asChild`. |
| `SidebarMenuBadge` | A count or a short note at the end of an item's row. |
| `SidebarMenuSub` | A list of pages under an item. |
| `SidebarMenuSubItem` | One page in it. |
| `SidebarMenuSubButton` | That page's link. |

These are separate exports, not properties of `Sidebar`. `Sidebar.Menu` isn't available, because property access on a client component doesn't work from a server component.

## Props

### SidebarProvider

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Whether the sidebar is expanded, when you control it. |
| `defaultOpen` | `boolean` | `true` | Whether the sidebar starts expanded, when you don't control it. On a server, read the cookie and pass what it says, so the page arrives in the state it was left in. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the sidebar expands or collapses. |
| `cookieName` | `string \| null` | `"nuv-sidebar"` | The cookie the state is remembered in, as `true` or `false`. Pass `null` to store nothing. |
| `shortcut` | `string \| null` | `"b"` | A key that expands and collapses the sidebar when pressed with Ctrl, or with Command on a Mac. Pass `null` for no shortcut. |

### Sidebar

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `side` | `"end" \| "start"` | `"start"` | The edge of the screen the sidebar is on. `"start"` is the left edge in a left-to-right layout and the right edge in a right-to-left one. Put the sidebar before or after `SidebarMain` to match. |
| `collapsible` | `"icon" \| "none" \| "offcanvas"` | `"icon"` | What collapsing does. `"icon"` leaves a strip of icons, `"offcanvas"` takes the sidebar off the screen, and with `"none"` it can't be collapsed. On a phone it's a panel over the page whichever this is. |
| `label` | `string` | `"Sidebar"` | The sidebar's name, for screen readers: of the navigation landmark it is in the page, and of the panel it becomes on a phone. Translate it with the rest of your interface. |
| `closeLabel` | `string` | `"Close"` | Accessible name of the button that closes that panel. Translate it with the rest of your interface. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the panel is rendered into on a phone. Set this when it should pick up a `data-theme` from a section of the page. |

### SidebarTrigger

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Toggle sidebar"` | Accessible name of the button. Translate it with the rest of your interface. |
| `asChild` | `boolean` | `false` | Render the single child element instead of the built-in button, and give it the button's props. Use it to make a `Button` the trigger. |

### SidebarMain

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `main`, and give it the class and props. A page has one `main` element, so use this when yours is somewhere else. |

### SidebarMenuButton

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `active` | `boolean` | `false` | Marks the item as the page that's open. It's drawn differently, and a screen reader calls it the current page. |
| `tooltip` | `ReactNode` |  | Shown next to the button while the sidebar is down to its icons, where the button's text is out of sight. Usually the same text. |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `button`, and give it the button's classes and props. This is how you make an item a link. |

### SidebarMenuSubButton

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `active` | `boolean` | `false` | Marks the item as the page that's open. |
| `asChild` | `boolean` | `false` | Render the single child element instead of a link, and give it the link's classes and props. Use it for your router's link. |

The other parts are plain elements. They take `ref`, `className` and anything else their element does.

### useSidebar

A hook for your own parts, such as a button in the page that opens the sidebar on a phone. It has to be called inside a `SidebarProvider`.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `state` (required) | `"collapsed" \| "expanded"` |  | Whether the sidebar in the page is expanded or collapsed. |
| `open` (required) | `boolean` |  | Whether the sidebar in the page is expanded. |
| `setOpen` (required) | `(open: boolean) => void` |  | Expands or collapses the sidebar in the page, and remembers it. |
| `openMobile` (required) | `boolean` |  | Whether the panel that stands in for the sidebar on a phone is open. |
| `setOpenMobile` (required) | `(open: boolean) => void` |  | Opens or closes that panel. Nothing is remembered. |
| `isMobile` (required) | `boolean` |  | Whether the screen is narrow enough for that panel to be in use. |
| `toggleSidebar` (required) | `() => void` |  | Opens or closes whichever of the two is in use. |

## Layout

`SidebarProvider` is a flex row, at least as tall as the screen. The sidebar sticks to the top of it and is as tall as the screen, and `SidebarMain` takes the rest.

```tsx
<SidebarProvider>
  <Sidebar>...</Sidebar>
  <SidebarMain>{children}</SidebarMain>
</SidebarProvider>
```

Under a header that stays at the top of the screen, tell the sidebar how much room the header takes:

```css
.app {
  --nuv-sidebar-offset: 4rem;
  --nuv-sidebar-height: calc(100svh - 4rem);
}
```

The examples on this page set `--nuv-sidebar-height` too, to fit a box.

`SidebarMain` renders the page's `main` element. If your layout already has one elsewhere, pass `asChild` and give it a `div`, as the examples here do, because a page should have one.

## Items

Put the icon first in a `SidebarMenuButton`, and the text after it in a `span`. The icon is drawn 1rem square. When the sidebar collapses, the icon is what's left, and it doesn't move.

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild active tooltip="Inbox">
    <a href="/inbox">
      <InboxIcon />
      <span>Inbox</span>
      <SidebarMenuBadge>12</SidebarMenuBadge>
    </a>
  </SidebarMenuButton>
</SidebarMenuItem>
```

- `asChild` makes the item a link. Use it for anything that goes to a page, with your router's link.
- `active` marks the page that's open. It sets `aria-current="page"`, a fill, a heavier weight, and a bar at the start of the row.
- `tooltip` names the button while the sidebar is down to its icons. It doesn't show at any other time.
- A `SidebarMenuBadge` goes inside the button, last. It's then part of the button's name, so a screen reader says "Inbox 12".

Text in a `span` that's too long is cut short with an ellipsis.

## Collapsing

`collapsible` says what collapsing does.

| Value | What happens |
| --- | --- |
| `"icon"` | The sidebar narrows to a strip as wide as one icon. Text is cut off, group labels keep their room and go blank, and submenus are hidden. This is the default. |
| `"offcanvas"` | The sidebar leaves the screen, and the Tab key no longer stops in it. |
| `"none"` | It can't be collapsed. |

The state is held by `SidebarProvider`. Leave it alone, or control it with `open` and `onOpenChange`.

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";

const sections = ["Summary", "Activity", "Files", "Comments"];

export default function Example() {
  return (
    <SidebarProvider
      cookieName={null}
      shortcut={null}
      style={
        {
          "--nuv-sidebar-height": "16rem",
          "--nuv-sidebar-width": "12rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        } as CSSProperties
      }
    >
      <SidebarMain asChild>
        <div style={{ padding: 16, textAlign: "end" }}>
          <SidebarTrigger label="Toggle details" />
        </div>
      </SidebarMain>
      {/* After the page, to match the side it's on. */}
      <Sidebar side="end" collapsible="offcanvas" label="Details">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Order 10248</SidebarGroupLabel>
            <SidebarMenu>
              {sections.map((section, index) => (
                <SidebarMenuItem key={section}>
                  <SidebarMenuButton asChild active={index === 0}>
                    <a href={`#${section.toLowerCase()}`}>{section}</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
```

`side="end"` is for a sidebar on the far side: the right in a left-to-right layout. Put it after `SidebarMain` to match.

## Remembering the state

When the sidebar is collapsed or expanded, the provider writes `true` or `false` to a cookie named `nuv-sidebar`. The next time the page loads, it reads the cookie and starts in that state.

On a server, read the cookie yourself and pass what it says as `defaultOpen`. The page then arrives in the right state, where otherwise it would arrive expanded and collapse once the script has run. In Next.js:

```tsx
import { cookies } from "next/headers";

export default async function Layout({ children }) {
  const remembered = (await cookies()).get("nuv-sidebar")?.value;

  return (
    <SidebarProvider defaultOpen={remembered !== "false"}>
      ...
    </SidebarProvider>
  );
}
```

`cookieName` changes the name, and `cookieName={null}` stores nothing. The cookie lasts a year, is sent to every path, and holds nothing but that one word. Whether it needs a mention in your cookie notice is a question for your own policy. It's a setting the person chose, not tracking.

The first example on this page is the only one that writes the cookie. Collapse it and reload the page.

## The shortcut

<kbd>Ctrl</kbd> + <kbd>B</kbd>, or <kbd>⌘</kbd> + <kbd>B</kbd> on a Mac, collapses and expands the sidebar. `shortcut` changes the letter, and `shortcut={null}` turns it off.

Something that already uses the keys keeps them: a text editor that handles them and calls `preventDefault`, and any text that's edited in place with `contenteditable`, where the browser makes it bold.

## On a phone

Below the `md` breakpoint, 48rem, the sidebar isn't in the page. `SidebarTrigger` opens it as a panel that slides in from its edge, over a dimmed page. It's a dialog: focus moves into it and stays there, <kbd>Esc</kbd> closes it, and so does a tap on the strip of page it leaves showing.

- The panel is always the whole sidebar, whatever `collapsible` is and whether or not the sidebar is collapsed on a wider screen.
- It has a close button in a row of its own at the top.
- Opening and closing it isn't remembered, and doesn't change the sidebar a wider screen gets.
- A link to another page closes the panel by leaving. In an app that changes pages without loading, close it yourself when the route changes, with `setOpenMobile(false)` from `useSidebar`.

Rows are 44 pixels tall on a touch screen and 40 with a mouse. Links in a submenu are 44 and 32.

What a server sends is the sidebar for a wide screen, because it can't know the screen. The stylesheet keeps that hidden on a narrow one, so a phone never shows it while the page loads.

## Submenus

A `SidebarMenuSub` under an item holds the pages inside it. Put it in a [collapsible](collapsible.md) to let people open and close it.

```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";

function Icon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const chart = "M3 13V8M8 13V3M13 13V6";
const file = "M4 2.5h5l3 3v8H4zM9 2.5v3h3";

export default function Example() {
  return (
    <SidebarProvider
      // This page has several sidebars. Only the first one remembers its
      // state and takes the shortcut.
      cookieName={null}
      shortcut={null}
      style={
        {
          "--nuv-sidebar-height": "20rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        } as CSSProperties
      }
    >
      <Sidebar label="Reports menu">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <Collapsible asChild defaultOpen>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Reports">
                      <Icon d={chart} />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#revenue" active>
                          Revenue
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#churn">
                          Churn
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#usage">
                          Usage
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Invoices">
                  <a href="#invoices">
                    <Icon d={file} />
                    <span>Invoices</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarMain asChild>
        <div style={{ padding: 16 }}>
          <SidebarTrigger />
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
```

On the strip of icons a submenu is hidden, so its pages can't be reached from there. Expand the sidebar to get to them, or make the item a link to a page that lists them.

## Colors

The sidebar takes the surface colors. Every row's fill is worked out from its text color, so it holds on any background.

```css title="themed.css"
/* The primary color as the background. The text and the group label take
   the color that's made to be read on it. */
.brand-sidebar {
  --nuv-sidebar-bg: var(--color-primary);
  --nuv-sidebar-fg: var(--color-primary-foreground);
  --nuv-sidebar-muted-fg: var(--color-primary-foreground);
  --nuv-sidebar-border: var(--color-primary);
  --nuv-focus-ring-color: var(--color-primary-foreground);

  /* The fills a row gets by default are a little of the text color mixed
     in, which on a color this strong would bring the two too close to
     read. These go the other way: away from the text. */
  --nuv-sidebar-item-bg-hover: color-mix(
    in oklab,
    var(--color-primary) 88%,
    oklch(from var(--color-primary-foreground) calc(1 - l) 0 0)
  );
  --nuv-sidebar-item-bg-active: color-mix(
    in oklab,
    var(--color-primary) 80%,
    oklch(from var(--color-primary-foreground) calc(1 - l) 0 0)
  );
}
```

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";
import "./themed.css";

const pages = ["Overview", "Deployments", "Logs", "Billing"];

function Menu() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarMenu>
          {pages.map((page, index) => (
            <SidebarMenuItem key={page}>
              <SidebarMenuButton asChild active={index === 0}>
                <a href={`#${page.toLowerCase()}`}>{page}</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}

const box = {
  "--nuv-sidebar-height": "16rem",
  "--nuv-sidebar-width": "11rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
} as CSSProperties;

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
      <SidebarProvider cookieName={null} shortcut={null} style={box}>
        {/* Dark, even while the page is light. */}
        <Sidebar label="Dark sidebar" collapsible="offcanvas" data-theme="dark">
          <Menu />
        </Sidebar>
        <SidebarMain asChild>
          <div style={{ padding: 16 }}>
            <SidebarTrigger label="Toggle the dark sidebar" />
          </div>
        </SidebarMain>
      </SidebarProvider>
      <SidebarProvider cookieName={null} shortcut={null} style={box}>
        <Sidebar
          label="Brand sidebar"
          collapsible="offcanvas"
          className="brand-sidebar"
        >
          <Menu />
        </Sidebar>
        <SidebarMain asChild>
          <div style={{ padding: 16 }}>
            <SidebarTrigger label="Toggle the brand sidebar" />
          </div>
        </SidebarMain>
      </SidebarProvider>
    </div>
  );
}
```

For a dark sidebar in a light app, put `data-theme="dark"` on `Sidebar`. Everything inside takes the dark theme's colors, with the contrast that theme was checked for.

For a background of your own, set `--nuv-sidebar-bg` and `--nuv-sidebar-fg`. On a strong color such as the brand color, set the two row fills as well. By default a row under the pointer is filled with a little of the text color, which on a mid-tone background brings the text and the fill too close together to read. The stylesheet above mixes away from the text color.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves through the buttons and links in order. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Presses the one that has focus. |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Collapses or expands the sidebar, or opens and closes the panel on a phone. |
| <kbd>Esc</kbd> | Closes the panel on a phone. |

Safari only stops at links with the Tab key if "Press Tab to highlight each item on a webpage" is turned on in its settings. That's the browser's choice and not something a component can change.

### What the component handles

- The sidebar is a `nav` element, so everything in it is inside a navigation landmark, named by `label`. On a phone it's a dialog with the same name.
- `SidebarMain` is the page's `main` element.
- A group with a `SidebarGroupLabel` has `role="group"` and is named by it.
- Menus are lists, so a screen reader says how many items there are.
- `active` sets `aria-current="page"`. The fill that marks the row is pale, so it isn't the only sign: the bar at the start of the row has at least 3:1 against the sidebar, and it's drawn as a border, which stays where the browser forces its own colors.
- On the strip of icons, a button's text is cut off from view and is still its name. The tooltip is for people who see the icon and don't know what it means.
- `SidebarTrigger` has `aria-expanded`, and a name set with `label`.
- A button keeps focus when the sidebar collapses around it.
- A sidebar that has left the screen is hidden, and not only narrow, so nothing in it takes focus.
- When the panel on a phone closes, focus goes back to the button that opened it.
- The focus ring is drawn inside each row's edge, where the sidebar can't cut it off.
- The width only changes over time when the visitor hasn't asked for reduced motion. A state that was remembered is applied without a transition.

### What you need to handle

- Use links for items that go somewhere, with `asChild`, and buttons for items that do something.
- Set `active` on the item for the page that's open, and on no other.
- Give every item a `tooltip` if the sidebar can collapse to icons.
- Translate `label` and `closeLabel` on `Sidebar`, and `label` on `SidebarTrigger`.
- Put the sidebar before `SidebarMain` in the markup when it's on the start side, so the order people tab through matches what they see.

## CSS variables

Set these on `SidebarProvider` or anything around it. On a phone the panel renders at the end of `<body>`, so for it, set them on `:root` or `body`, or straight on `Sidebar`.

```css
:root {
  --nuv-sidebar-width: 18rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-sidebar-height` | `100svh` | Height of the sidebar, and the least the layout is tall. Change it when the sidebar sits under a header. |
| `--nuv-sidebar-offset` | `0` | How far from the top of the screen the sidebar sticks. |
| `--nuv-sidebar-width` | `16rem` | Width of the sidebar while it's expanded. |
| `--nuv-sidebar-border` | `var(--color-border)` | Color of the edge that faces the page, of separators, and of the line beside a submenu. |
| `--nuv-sidebar-bg` | `var(--color-surface)` | Background color of the sidebar. |
| `--nuv-sidebar-fg` | `var(--color-surface-foreground)` | Text color of the sidebar, and of its rows. |
| `--nuv-sidebar-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Height of a row. It also sets the width of the strip of icons. The default differs between touch screens and a mouse. |
| `--nuv-sidebar-width-mobile` | `18rem` | The widest the panel gets on a phone. It always leaves a strip of the page showing. |
| `--nuv-sidebar-shadow` | `var(--shadow-xl)` | Shadow under the panel on a phone. |
| `--nuv-sidebar-overlay-bg` | `var(--color-overlay)` | Color of the layer that dims the page on a phone. |
| `--nuv-sidebar-item-bg-hover` | `color-mix(in oklab, currentcolor 8%, transparent)` | Background of a row under the pointer, and of the trigger and the close button. |
| `--nuv-sidebar-muted-fg` | `var(--color-muted-foreground)` | Text color of group labels and badges. |
| `--nuv-sidebar-item-radius` | `var(--radius-md)` | Corner radius of a row. |
| `--nuv-sidebar-item-bg-active` | `color-mix(in oklab, currentcolor 12%, transparent)` | Background of the row for the open page. |
| `--nuv-sidebar-active-indicator` | `currentcolor` | Color of the bar at the start of that row. Keep it at 3:1 against the sidebar. |
| `--nuv-sidebar-sub-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Height of a link in a submenu. The default differs between touch screens and a mouse. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-sidebar` | Sidebar. |
| `.nuv-sidebar--end` | A sidebar with `side="end"`. |
| `.nuv-sidebar--hidden` | A sidebar that has left the screen. |
| `.nuv-sidebar--mobile` | The panel on a phone. |
| `.nuv-sidebar--rail` | A sidebar that's down to its strip of icons. |
| `.nuv-sidebar-layout` | SidebarProvider. |
| `.nuv-sidebar-layout__main` | SidebarMain. |
| `.nuv-sidebar__bar` | The row at the top of the panel that holds its close button. |
| `.nuv-sidebar__close` | That close button. |
| `.nuv-sidebar__content` | SidebarContent. |
| `.nuv-sidebar__footer` | SidebarFooter. |
| `.nuv-sidebar__group` | SidebarGroup. |
| `.nuv-sidebar__group-label` | SidebarGroupLabel. |
| `.nuv-sidebar__header` | SidebarHeader. |
| `.nuv-sidebar__menu` | SidebarMenu. |
| `.nuv-sidebar__menu-badge` | SidebarMenuBadge. |
| `.nuv-sidebar__menu-button` | SidebarMenuButton. |
| `.nuv-sidebar__menu-item` | SidebarMenuItem. |
| `.nuv-sidebar__menu-sub` | SidebarMenuSub. |
| `.nuv-sidebar__menu-sub-button` | SidebarMenuSubButton. |
| `.nuv-sidebar__menu-sub-item` | SidebarMenuSubItem. |
| `.nuv-sidebar__overlay` | The layer that dims the page behind that panel. |
| `.nuv-sidebar__separator` | SidebarSeparator. |
| `.nuv-sidebar__title` | The panel's name. It isn't drawn. |
| `.nuv-sidebar__trigger` | SidebarTrigger. |

In the page, the sidebar has `data-state`, which is `expanded` or `collapsed`. A row for the open page has `data-active`.

The tooltips are the library's [Tooltip](tooltip.md). If you load one stylesheet per component, load `tooltip.css` as well as `sidebar.css`.

## Server components

The sidebar parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

A whole sidebar can be put together inside a server component, as every example on this page is. `useSidebar` is a hook, so a part of your own that calls it is a client component.

## Themed sections

On a phone the panel renders at the end of `<body>`, outside any `data-theme` section the sidebar is in. `data-theme` on `Sidebar` itself goes to the panel too. For a section's theme, pass the section's element as `container`.

## Not included

- A sidebar that floats above the page with a gap around it, or a page area that's inset. The layout is one row with an edge between the two.
- A rail to drag or click on the sidebar's edge. `SidebarTrigger` and the shortcut collapse it.
- A second button on a row, and a skeleton row. A [dropdown menu](dropdown-menu.md) or a [skeleton](skeleton.md) can be put in a `SidebarMenuItem` as it is.

## Do and don't

**Do**

- Keep the names short. One or two words fit at the default width.
- Give each item an icon if the sidebar can collapse to icons, and pick icons that differ at a glance.
- Order the items by how often they're used, and keep that order the same on every page.

**Don't**

- Don't nest more than one level of submenu. A third level is a sign the pages need their own navigation.
- Don't hide the only way to a page in a submenu that the strip of icons can't show.
- Don't put the trigger inside the sidebar only. With `collapsible="offcanvas"` it would leave the screen with it.
