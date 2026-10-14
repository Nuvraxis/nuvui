<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/sheet.mdx. Don't edit it here: run `pnpm skill`. -->

# Sheet

A panel that slides in from an edge of the screen and takes over the page until it's closed.

Use a sheet for something that goes with the page behind it and needs more room than a popover: a set of filters, the details of a row, the site's menu on a phone. It's a [dialog](dialog.md) attached to an edge, and behaves like one.

```tsx
import {
  Button,
  Field,
  FieldControl,
  FieldLabel,
  Input,
  NativeSelect,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Filters</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div style={{ display: "grid", gap: 16, paddingBlock: 8 }}>
            <Field>
              <FieldLabel>Customer</FieldLabel>
              <FieldControl>
                <Input />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldControl>
                <NativeSelect>
                  <option>Any</option>
                  <option>Paid</option>
                  <option>Refunded</option>
                </NativeSelect>
              </FieldControl>
            </Field>
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button intent="secondary">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Apply filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Sheet` | Holds the open state. Renders nothing itself. |
| `SheetTrigger` | The button that opens the sheet. Wrap your own with `asChild`. |
| `SheetContent` | The panel. It also renders the overlay behind it and the close button in its corner. |
| `SheetTitle` | The heading. Required, because it's the sheet's accessible name. |
| `SheetDescription` | A sentence or two under the title. It becomes the sheet's accessible description. |
| `SheetHeader` | Holds the title and description, and stays in place while the body scrolls. |
| `SheetBody` | The part that scrolls when the content is taller than the screen. |
| `SheetFooter` | A row for the action buttons, at the far edge of the panel. |
| `SheetClose` | Closes the sheet when pressed. Wrap your own button with `asChild`. |
| `SheetHandle` | The bar at the edge of a sheet that can be dragged. Optional. |

These are separate exports, not properties of `Sheet`. `Sheet.Content` isn't available, because property access on a client component doesn't work from a server component.

## Props

`SheetContent` adds these to what Radix provides:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `side` | `"bottom" \| "end" \| "start" \| "top"` | `"end"` | The edge of the screen the sheet is attached to. `"start"` is the left edge in a left-to-right layout and the right edge in a right-to-left one, and `"end"` is the other. |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` | How wide a sheet on the start or end edge is. It's never wider than the screen. A sheet on the top or bottom edge is as wide as the screen and as tall as its content, whatever the size. |
| `showCloseButton` | `boolean` | `true` | Whether to render the close button in the corner. If you turn it off, give people another visible way to close the sheet. |
| `closeLabel` | `string` | `"Close"` | Accessible name of the close button. Translate it with the rest of your interface. |
| `swipe` | `boolean` | `false` | Lets a finger drag the sheet towards its edge, and closes it when it's let go of past halfway or flicked. A drag starts anywhere but on a control or in the part that scrolls, and a `SheetHandle` can be dragged with a mouse as well. On by default when there are `stops`. |
| `stops` | `number[]` |  | Sizes the sheet stops at, each a share of the screen from 0 to 1: `[0.4, 0.9]` is 40% and 90% of its height for a sheet on the top or bottom edge, and of its width for one on the start or end edge. A drag that's let go of settles on the nearest one, and one that ends well under the smallest closes the sheet. |
| `stop` | `number` |  | The stop the sheet is at, when you control it. One of `stops`. |
| `defaultStop` | `number` |  | The stop the sheet opens at, when you don't control it. The smallest unless you say otherwise. |
| `onStopChange` | `((stop: number) => void)` |  | Called with the stop the sheet has settled on. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the sheet is rendered into. Set this when the sheet should pick up a `data-theme` from a section of the page. |

`Sheet`, `SheetTrigger`, `SheetClose`, `SheetTitle` and `SheetDescription` are Radix's dialog parts, and take the same props, including `open`, `defaultOpen`, `onOpenChange`, `modal` and `asChild`. The [Radix Dialog reference](https://www.radix-ui.com/primitives/docs/components/dialog#api-reference) lists them.

`SheetHandle` adds this to what a `button` takes:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Change size", or "Dismiss" in a sheet with no stops` | Accessible name of the handle, which says what pressing it does. Translate it with the rest of your interface. |

`SheetHeader`, `SheetBody` and `SheetFooter` are plain `div` elements. They take `ref`, `className` and anything else a `div` does.

## Sides

```tsx
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

const sides = ["start", "end", "top", "bottom"] as const;

export default function Example() {
  return (
    <>
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button intent="secondary">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetTitle>On the {side} edge</SheetTitle>
            <SheetDescription>
              Press Escape, the close button or the page behind to close it.
            </SheetDescription>
          </SheetContent>
        </Sheet>
      ))}
    </>
  );
}
```

`side` names the edge. `"start"` and `"end"` follow the reading direction: `"end"` is the right edge in a left-to-right layout and the left edge in a right-to-left one. The sheet slides in from the edge it's on.

A sheet on the top or bottom edge is as wide as the screen and as tall as what it holds. It stops 48 pixels short of the full height, and its body scrolls from there.

## Sizes

`size` sets how wide a sheet on the start or end edge is: 20rem for `sm`, 24rem for `md` and 40rem for `lg`. It doesn't apply to the top and bottom edges.

On a narrow screen the sheet stops 48 pixels short of the far side whatever its size. That strip of page is what people tap to close it, so it has to stay.

## Long content

Put what scrolls in `SheetBody`. The header and the footer stay where they are, so the title and the buttons are always in view.

```tsx
import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

const changes = [
  "Ada changed the status to Paid.",
  "Sam added a note for the warehouse.",
  "The invoice was sent to the customer.",
  "Ada changed the delivery address.",
  "The payment was authorized.",
  "Sam split the order into two parcels.",
  "The first parcel left the warehouse.",
  "The customer asked for a later delivery.",
  "Ada moved the delivery to Friday.",
  "The second parcel left the warehouse.",
  "The first parcel was delivered.",
  "The second parcel was delivered.",
];

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Order history</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order 10248</SheetTitle>
          <SheetDescription>Everything that happened to it.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ol style={{ display: "grid", gap: 16, margin: 0, padding: 0 }}>
            {changes.map((change) => (
              <li key={change} style={{ listStyle: "none" }}>
                {change}
              </li>
            ))}
          </ol>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

The footer sits at the far edge of the panel whether or not there's a body, and however little the sheet holds.

## Swiping it away

`swipe` lets a finger drag the sheet towards the edge it came from. Let go of past halfway, or flicked, it closes. Let go of sooner, it comes back.

```tsx
import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Share</Button>
      </SheetTrigger>
      <SheetContent side="bottom" swipe>
        <SheetHandle />
        <SheetHeader>
          <SheetTitle>Share this report</SheetTitle>
          <SheetDescription>
            Drag it down by the bar or the heading, or flick it, to put it away.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p style={{ margin: 0 }}>
            Anyone with the link can read the report. Nobody can change it.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
```

A drag can start anywhere on the sheet but two places: on a control, where a finger is pressing, and, for a sheet on the top or bottom edge, in the part that scrolls, where a finger is scrolling. So give such a sheet a `SheetHeader` or a `SheetHandle` to drag by, and put what scrolls in a `SheetBody`. A sheet on the start or end edge is dragged sideways, which no scrolling gets in the way of.

A mouse doesn't drag the sheet, because a mouse drags across text to select it. It can drag the `SheetHandle`.

## Stops

`stops` is a list of sizes the sheet rests at, each a share of the screen: `[0.35, 0.9]` is a sheet that opens a third of the way up and can be pulled nearly to the top. Dragging changes its size under the finger, and letting go settles it on the nearest stop. Dragged well under the smallest, it closes.

```tsx
"use client";

import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
import { useState } from "react";

const stops = [0.35, 0.9];

const orders = Array.from({ length: 24 }, (_, index) => ({
  id: `ORD-${7231 - index}`,
  total: 40 + ((index * 37) % 260),
}));

export default function Example() {
  const [stop, setStop] = useState(stops[0]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Recent orders</Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        stops={stops}
        stop={stop}
        onStopChange={setStop}
        aria-describedby={undefined}
      >
        <SheetHandle />
        <SheetHeader>
          <SheetTitle>Recent orders</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {orders.map((order) => (
              <li
                key={order.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBlock: 8,
                }}
              >
                <span>{order.id}</span>
                <span>${order.total}.00</span>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
```

The sheet is the height of its stop, not as tall as its content, so what's in it has to scroll: put it in a `SheetBody`.

`stop` and `onStopChange` control which one it's at, and `defaultStop` sets where it opens. With stops, `swipe` is on unless you turn it off.

## The handle

`SheetHandle` is the short bar that says a sheet can be dragged. Put it first in a sheet on the bottom edge, and last in one on the top. On the start or end edge it stands up along the side that faces the page, wherever you write it.

It's a button. Pressing it goes to the next stop, and round to the first, or closes a sheet that has none. That's how the keyboard, a switch and a screen reader do what a drag does, so a sheet with stops should have one.

## As a menu on a phone

A sheet on the start edge is the usual place for a site's navigation when the screen is too narrow for a row of links.

```tsx
import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

const pages = [
  { name: "Getting started", href: "/docs" },
  { name: "Theming", href: "/docs/theming" },
  { name: "Forms", href: "/docs/forms" },
];

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Menu</Button>
      </SheetTrigger>
      <SheetContent side="start" size="sm" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <nav aria-label="Site">
            <ul style={{ display: "grid", gap: 4, margin: 0, padding: 0 }}>
              {pages.map((page) => (
                <li key={page.href} style={{ listStyle: "none" }}>
                  {/* Closing on the way out matters when the link leads to
                      a section of the page that's already open. */}
                  <SheetClose asChild>
                    <Button
                      asChild
                      intent="ghost"
                      style={{
                        justifyContent: "flex-start",
                        inlineSize: "100%",
                      }}
                    >
                      <a href={page.href}>{page.name}</a>
                    </Button>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
```

Wrap each link in `SheetClose`. A link to another page closes the sheet by leaving, but a link to a section of the same page would leave it open over what the person asked to see.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the trigger, opens the sheet. |
| <kbd>Tab</kbd> | Moves to the next control inside the sheet. From the last one it goes back to the first. |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Moves to the previous control, and from the first to the last. |
| <kbd>Esc</kbd> | Closes the sheet. |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Page Up</kbd> <kbd>Page Down</kbd> | Scroll the body, when it has focus. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The panel has `role="dialog"`, named by `SheetTitle` and described by `SheetDescription`.
- Opening moves focus to the first control in the content. Closing returns it to the trigger.
- Focus can't leave the sheet while it's open, and the rest of the page is hidden from screen readers.
- The trigger gets `aria-haspopup="dialog"` and `aria-expanded`.
- The close button is a real button with an accessible name, and is at least 44 pixels on touch screens. This matters on phones, where there's no <kbd>Esc</kbd> key.
- A `SheetBody` that scrolls and has nothing inside that takes focus becomes a tab stop itself, named after the sheet. Without that, someone who doesn't use a mouse would have no way to scroll it. A body that fits, or that holds a field or a button, is left alone.
- The first and last rows keep clear of a phone's notch and home indicator, on pages that draw under them.
- The slide only runs when the visitor hasn't asked for reduced motion. A sheet that's being dragged follows the finger either way, since the finger is what's moving it.
- Nothing a swipe does is out of reach without one: the close button, Escape and a press outside all close the sheet, and `SheetHandle` changes its stop when pressed.
- `SheetHandle` is a button with a name, drawn as a border so it's still there where the browser forces its own colors, and it answers to a press 44 pixels tall.

### What you need to handle

- Always include a `SheetTitle`. If the design has no visible heading, hide it visually but keep it.
- If you leave out `SheetDescription`, pass `aria-describedby={undefined}` to `SheetContent`, or Radix logs a warning.
- Translate `closeLabel`, and `label` on `SheetHandle`, along with the rest of your interface.
- Give a sheet with `stops` a `SheetHandle`. Without one, only a drag changes its size.
- In a right-to-left layout, set `dir="rtl"` on the page's root element. The sheet is rendered at the end of `<body>`, so that's where it takes its direction from.

## CSS variables

Sheets render at the end of `<body>`, so set these on `:root` or `body`, not on the element around the trigger.

```css
:root {
  --nuv-sheet-width: 28rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-sheet-overlay-bg` | `var(--color-overlay)` | Color of the layer that dims the page. |
| `--nuv-sheet-width` | `24rem`, `20rem`, `40rem` | Width of a sheet on the start or end edge. Differs by size. It's never wider than the screen less 48 pixels. |
| `--nuv-sheet-padding` | `calc(var(--spacing) * 6)` | Padding inside the panel. One length, used on every side. |
| `--nuv-sheet-border` | `var(--color-border)` | Border color of the panel. |
| `--nuv-sheet-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-sheet-shadow` | `var(--shadow-xl)` | Shadow under the panel. |
| `--nuv-sheet-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-sheet-stop` | `1` | The share of the screen a sheet with stops takes. The component sets it on the panel from the stop it's at. It's not one to set yourself. |
| `--nuv-sheet-handle-size` | `calc(var(--spacing) * 10)` | Length of the handle. |
| `--nuv-sheet-handle-width` | `4px` | Thickness of the handle. |
| `--nuv-sheet-handle` | `var(--color-border-strong)` | Color of the handle. Keep it at 3:1 against the panel. |

## Classes

The overlay and the panel sit next to each other in the page, not one inside the other. That's why the overlay is its own flat class.

| Class | What it's on |
| --- | --- |
| `.nuv-sheet` | The panel. |
| `.nuv-sheet--bottom` | The panel with side="bottom". |
| `.nuv-sheet--end` | The panel with side="end". |
| `.nuv-sheet--lg` | The panel with size="lg". |
| `.nuv-sheet--sm` | The panel with size="sm". |
| `.nuv-sheet--start` | The panel with side="start". |
| `.nuv-sheet--stops` | The panel when it has stops. |
| `.nuv-sheet--swipe` | The panel when it can be dragged. |
| `.nuv-sheet--top` | The panel with side="top". |
| `.nuv-sheet__body` | SheetBody. |
| `.nuv-sheet__close` | The close button in the corner. |
| `.nuv-sheet__description` | SheetDescription. |
| `.nuv-sheet__footer` | SheetFooter. |
| `.nuv-sheet__handle` | SheetHandle. |
| `.nuv-sheet__header` | SheetHeader. |
| `.nuv-sheet__overlay` | The layer behind the panel. |
| `.nuv-sheet__title` | SheetTitle. |

The panel also gets `nuv-sheet--md` at the default size. No styles are attached to it, since medium is the base.

Radix sets `data-state="open"` or `data-state="closed"` on the overlay and the panel. The animations hang off those. The panel has a `data-dragging` attribute while it's being dragged.

## Server components

The sheet parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a sheet together inside a server component, as every example on this page does. It only needs a client component of your own when you control `open`.

## Themed sections

A sheet opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` and it will be.

## Do and don't

**Do**

- Use the end edge for details and filters, and the start edge for navigation.
- Put the buttons in `SheetFooter`, so they're in the same place every time.
- Leave the close button in, unless there's another visible way out.

**Don't**

- Don't use a sheet for a question that needs an answer. That's an [alert dialog](alert-dialog.md).
- Don't open a sheet from inside a sheet.
- Don't open one without the person doing something to ask for it.
