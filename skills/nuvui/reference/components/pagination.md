<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/pagination.mdx. Don't edit it here: run `pnpm skill`. -->

# Pagination

Links to the pages of a long list, with Previous and Next and a helper that works out which page numbers to show.

Use pagination to split a long list into pages people move through: search results, a table of orders, an archive. It comes as parts you put together, because only your app knows where each page lives, and a function, `paginationRange`, that does the arithmetic.

```tsx
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@nuvui/react";

export default function Example() {
  return (
    <Pagination>
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious href="#page-1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-1" aria-label="Page 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-2" aria-label="Page 2" active>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-3" aria-label="Page 3">
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-12" aria-label="Page 12">
            12
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-3" />
        </PaginationItem>
      </PaginationList>
    </Pagination>
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
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Pagination` | The `nav` landmark around the links. |
| `PaginationList` | The row. A `ul`. |
| `PaginationItem` | One place in the row. A `li`. |
| `PaginationLink` | The link to one page. |
| `PaginationPrevious` | The link to the page before, with an arrow. |
| `PaginationNext` | The link to the page after, with an arrow. |
| `PaginationEllipsis` | Three dots that stand for the page numbers left out. |
| `paginationRange` | A function, not a component. It says which numbers and gaps to show. |

## Props

### PaginationLink

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `active` | `boolean` | `false` | Marks the link as the page being shown. It gets the filled look and `aria-current="page"`. |
| `disabled` | `boolean` | `false` | For a link that leads nowhere right now, such as "Previous" on the first page. It stays in place, faded, and can't be followed or focused. |
| `asChild` | `boolean` | `false` | Render the single child element instead of an `a`, and give it the link's classes and props. This is how you use your router's link, or a `button` when the pages are state and not addresses. |

It also takes what an `a` takes, `href` included. `PaginationPrevious` and `PaginationNext` take the same props.

### PaginationEllipsis

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"More pages"` | What a screen reader says for the three dots. Translate it with the rest of your interface. |

### paginationRange

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `page` (required) | `number` |  | The page being shown, counted from 1. |
| `count` (required) | `number` |  | How many pages there are. |
| `siblings` | `number` | `1` | How many page numbers to show on each side of the current one. |
| `boundaries` | `number` | `1` | How many page numbers to always show at each end. |

`Pagination`, `PaginationList` and `PaginationItem` take what their elements take, including `ref` and `className`.

## Working out the numbers

`paginationRange` takes the current page and the number of pages, and gives back what to show: page numbers, and `"ellipsis-start"` or `"ellipsis-end"` where numbers were left out.

```ts
paginationRange({ page: 10, count: 20 });
// [1, "ellipsis-start", 9, 10, 11, "ellipsis-end", 20]
```

Three things hold for whatever it returns:

- The row is the same length whichever page is current, so the links don't move under the pointer as someone clicks through.
- A gap always stands for two pages or more. Where only one would be hidden, its number is shown.
- No entry appears twice, so each one can be the `key` of its item.

`siblings` is how many numbers show on each side of the current page, and `boundaries` how many at each end. Both are 1 unless you say otherwise.

## When the pages are state

In a table or a search that keeps its page in state, there's no address to link to. Pass `asChild` and put a `button` inside. It gets the look and `aria-current`, and you give it the `onClick`.

```tsx
"use client";

import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from "@nuvui/react";
import { useState } from "react";

const count = 20;

export default function Example() {
  const [page, setPage] = useState(1);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious asChild disabled={page === 1}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
            </PaginationPrevious>
          </PaginationItem>
          {paginationRange({ page, count }).map((entry) => (
            <PaginationItem key={entry}>
              {typeof entry === "number" ? (
                <PaginationLink asChild active={entry === page}>
                  <button
                    type="button"
                    aria-label={`Page ${entry}`}
                    onClick={() => setPage(entry)}
                  >
                    {entry}
                  </button>
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext asChild disabled={page === count}>
              <button
                type="button"
                disabled={page === count}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </PaginationNext>
          </PaginationItem>
        </PaginationList>
      </Pagination>
      <p style={{ margin: 0, fontSize: 14 }}>
        Page {page} of {count}
      </p>
    </div>
  );
}
```

A disabled button needs both: `disabled` on the `PaginationLink`, for the look, and `disabled` on the `button` itself, so the browser stops it being pressed.

## With your router's link

`asChild` is also how you use a router's link. `PaginationPrevious` and `PaginationNext` put their arrow inside it, next to its text.

```tsx
import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@nuvui/react";
import Link from "next/link";

// Stands in for a list of pages your app has. Here they're three of the
// guides on this site.
const pages = ["/theming", "/tailwind", "/scss"];
const current = 1;

export default function Example() {
  return (
    <Pagination aria-label="Guides">
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious asChild>
            <Link href={pages[current - 1] ?? "/"}>Previous</Link>
          </PaginationPrevious>
        </PaginationItem>
        {pages.map((href, index) => (
          <PaginationItem key={href}>
            <PaginationLink asChild active={index === current}>
              <Link href={href} aria-label={`Guide ${index + 1}`}>
                {index + 1}
              </Link>
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext asChild>
            <Link href={pages[current + 1] ?? "/"}>Next</Link>
          </PaginationNext>
        </PaginationItem>
      </PaginationList>
    </Pagination>
  );
}
```

With `asChild` the text comes from your element, so that's where to translate "Previous" and "Next". Without it, pass the translated word as the child: `<PaginationNext href="/page/3">Weiter</PaginationNext>`.

## On small screens

Each link is 44 pixels square on a touch screen. Seven of them plus Previous and Next don't fit a phone in one row, so the row wraps.

Two things keep it to one row there. Below 40rem, Previous and Next show only their arrows. Their text is still there for screen readers. And `siblings: 0` drops the numbers either side of the current page, which leaves the first, the current and the last, with a gap on each side.

```tsx
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from "@nuvui/react";

const page = 7;
const count = 20;

export default function Example() {
  return (
    <Pagination>
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious href={`#page-${page - 1}`} />
        </PaginationItem>
        {paginationRange({ page, count, siblings: 0 }).map((entry) => (
          <PaginationItem key={entry}>
            {typeof entry === "number" ? (
              <PaginationLink
                href={`#page-${entry}`}
                aria-label={`Page ${entry}`}
                active={entry === page}
              >
                {entry}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={`#page-${page + 1}`} />
        </PaginationItem>
      </PaginationList>
    </Pagination>
  );
}
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves through the links in order. A disabled one is skipped. |
| <kbd>Enter</kbd> | Follows the focused link. On a button, <kbd>Space</kbd> does too. |

Safari only stops at links with <kbd>Tab</kbd> when "Press Tab to highlight each item on a webpage" is turned on in its settings. That applies to every link on every site. Buttons, as in the state example, are always stops.

### What the component handles

- The row is a `nav` landmark named "Pagination", around a list.
- The current page's link has `aria-current="page"`. It's filled with the primary color, which has at least 3:1 contrast with the page, and its number keeps 4.5:1 on that fill.
- A disabled link has no `href`, so it can't be followed or focused. It keeps `role="link"` and gets `aria-disabled="true"`, so that it's still exposed as a link that's unavailable and not as loose text.
- The arrows are hidden from screen readers, and point the other way in a right-to-left layout.
- The dots have a name, "More pages".
- Numbers are set in digits of equal width where the font has them, so the row doesn't shift as the numbers change.
- Where the browser forces its own colors, as Windows high contrast does, the current page is filled with the system's color for something selected.

### What you need to handle

- Give each number link a full name: `aria-label="Page 3"`. "3" alone says little when it's read out of context.
- Leave Previous and Next in place on the first and last page, and disable them. A row that changes shape moves the links people are aiming at.
- Translate the landmark's name with `aria-label` on `Pagination`, the dots' name with `label`, and the text of Previous and Next.
- After the page changes without a full page load, move focus to the top of the new results, or announce the change. Otherwise nothing tells a screen reader user that the list changed.

## CSS variables

Set any of these on `Pagination`, or on anything around it.

```css
.orders-table {
  --nuv-pagination-size: var(--nuv-control-height-sm);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-pagination-gap` | `var(--spacing)` | Space between the links. |
| `--nuv-pagination-radius` | `var(--radius-md)` | Corner radius of a link. |
| `--nuv-pagination-fg` | `var(--color-foreground)` | Text color of the links. |
| `--nuv-pagination-size` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Height of a link, and its smallest width. The default differs between touch screens and a mouse. Setting it sets both, so keep it at 44 pixels or more where people use touch. |
| `--nuv-pagination-hover-bg` | `var(--color-muted)` | Background of a link under the pointer. |
| `--nuv-pagination-active-bg` | `var(--color-primary)` | Background of the current page's link. Keep it at 3:1 against the page. |
| `--nuv-pagination-active-fg` | `var(--color-primary-foreground)` | Text color of the current page's link. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-pagination__arrow` | The arrow in Previous and Next. |
| `.nuv-pagination__ellipsis` | PaginationEllipsis. |
| `.nuv-pagination__item` | PaginationItem. |
| `.nuv-pagination__label` | The text of Previous and Next, which is hidden on a narrow screen. |
| `.nuv-pagination__link` | PaginationLink, PaginationPrevious and PaginationNext. |
| `.nuv-pagination__link--next` | PaginationNext. |
| `.nuv-pagination__link--previous` | PaginationPrevious. |
| `.nuv-pagination__list` | PaginationList. |

`Pagination` itself gets `nuv-pagination`. No styles are attached to it.

The current page's link has `data-active`, and a disabled one `data-disabled`. The fill and the fading hang off those.

## Server components

The pagination parts have no `"use client"` directive and use no state, so they render in a server component as they are. `paginationRange` is a plain function and runs anywhere. The first and last examples on this page are server components.

## Do and don't

**Do**

- Show which page is current, and how many there are.
- Keep the row in the same place above or below the list on every page.
- Put the page in the address when you can, so a page of results can be linked to and the back button works.

**Don't**

- Don't use pagination for the steps of a form.
- Don't hide Previous on the first page or Next on the last. Disable them.
- Don't show every number of a long list. Let `paginationRange` leave the middle out.
