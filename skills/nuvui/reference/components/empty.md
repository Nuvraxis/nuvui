<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/empty.mdx. Don't edit it here: run `pnpm skill`. -->

# Empty

What a list, a table or a search shows when it has nothing in it, with a way to get something into it.

Use an empty state wherever a screen can have nothing to show: a list before the first item, a search with no matches, a folder that was cleared. Say why it's empty and offer the next step. A blank area leaves people wondering whether the page is still loading.

```tsx
import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Empty style={{ width: "100%" }}>
      <EmptyMedia>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />
        </svg>
      </EmptyMedia>
      <EmptyTitle>No invoices yet</EmptyTitle>
      <EmptyDescription>
        Invoices show up here once you send the first one to a customer.
      </EmptyDescription>
      <EmptyActions>
        <Button>New invoice</Button>
        <Button intent="secondary">Import from a file</Button>
      </EmptyActions>
    </Empty>
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
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Empty` | The box, with everything centered in it. |
| `EmptyMedia` | An icon or a small picture, on a filled square. |
| `EmptyTitle` | What's missing. An `h3` unless you say otherwise. |
| `EmptyDescription` | Why, and what to do about it. |
| `EmptyActions` | The buttons or links. |

Only `Empty` and `EmptyTitle` are needed.

## Props

### EmptyTitle

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of an `h3`, and give it the title's class and props. This is how you pick the heading level that fits the page. |

The other parts add no props of their own. Each takes what its element takes, including `ref` and `className`.

## A search with no matches

A search that finds nothing isn't the same as a list that was never filled. Say what was searched for, and offer a way back to results.

```tsx
import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Empty style={{ width: "100%" }}>
      <EmptyTitle asChild>
        <h4>Nothing matches "nrothwind"</h4>
      </EmptyTitle>
      <EmptyDescription>
        Check the spelling, or search all customers instead of only the active
        ones.
      </EmptyDescription>
      <EmptyActions>
        <Button intent="secondary">Clear the search</Button>
      </EmptyActions>
    </Empty>
  );
}
```

The title here is an `h4`, set with `asChild`, because this example sits under an `h3` on this page. Pick the level that fits where the empty state is used.

## Three kinds of empty

What to write depends on why there's nothing there.

| Why it's empty | Say | Offer |
| --- | --- | --- |
| Nothing has been made yet | What will show up here | The button that makes the first one |
| A search or filter matched nothing | What was searched for | Clearing the search, or widening it |
| The visitor isn't allowed to see it | That there's something they can't see | Who to ask for access |

When something went wrong, that's an error and not an empty state. Use an [alert](alert.md) and say what happened.

## On small screens

The padding is 24 pixels on a phone and 48 from the `sm` breakpoint up. The description wraps at 28rem however wide the box is, so its lines stay short enough to read. Buttons that don't fit in one row wrap.

## Accessibility

An empty state has no keyboard behavior of its own. The buttons and links in `EmptyActions` work as they do anywhere.

### What the component handles

- The title is a heading, so the empty state can be found in the page's outline.
- `EmptyMedia` is hidden from screen readers. The title says what the picture shows.
- The dashed edge is a border, which is still drawn where the browser forces its own colors. The square behind the picture gets an edge there too.
- The description's color has at least 4.5:1 against the page in every theme.

### What you need to handle

- Pick the heading level that fits the page, with `asChild`.
- When a search or a filter empties a list while the page is open, a screen reader user isn't told. Say it in an element with `role="status"`, such as "No customers match".
- Keep the page's other controls where they were. A search field that disappears along with its results leaves no way to change the search.

## CSS variables

Set any of these on `Empty`, or on anything around it.

```css
.table-empty {
  --nuv-empty-border: transparent;
  --nuv-empty-padding: calc(var(--spacing) * 8);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-empty-gap` | `calc(var(--spacing) * 2)` | Space between the parts. |
| `--nuv-empty-padding` | `calc(var(--spacing) * 6)`, `calc(var(--spacing) * 12)` | Padding inside the box. Larger from the sm breakpoint. |
| `--nuv-empty-border` | `var(--color-border)` | Color of the dashed edge. Set it to transparent for no edge. |
| `--nuv-empty-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-empty-fg` | `var(--color-foreground)` | Text color of the title. |
| `--nuv-empty-media-size` | `3rem` | Width and height of the square behind the picture. |
| `--nuv-empty-media-bg` | `var(--color-muted)` | Background color of that square. |
| `--nuv-empty-media-fg` | `var(--color-foreground)` | Color of an icon inside it. |
| `--nuv-empty-title-size` | `var(--text-base)` | Font size of the title. |
| `--nuv-empty-text-width` | `28rem` | The widest the description gets. |
| `--nuv-empty-muted-fg` | `var(--color-muted-foreground)` | Text color of the description. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-empty` | Empty. |
| `.nuv-empty__actions` | EmptyActions. |
| `.nuv-empty__description` | EmptyDescription. |
| `.nuv-empty__media` | EmptyMedia. |
| `.nuv-empty__title` | EmptyTitle. |

## Server components

The empty parts have no `"use client"` directive and use no state, so they render in a server component as they are.

## Do and don't

**Do**

- Write the title as a plain statement: "No invoices yet".
- Make the main button the same action as the page's own "new" button.

**Don't**

- Don't show an empty state while the data is still loading. Use a [skeleton](skeleton.md) until you know.
- Don't blame the visitor. "Nothing matches" is enough.
