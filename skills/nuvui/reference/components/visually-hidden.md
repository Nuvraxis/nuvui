<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/visually-hidden.mdx. Don't edit it here: run `pnpm skill`. -->

# VisuallyHidden

Text that's in the page for screen readers and drawn nowhere.

Use `VisuallyHidden` for words that someone looking at the page gets from the layout, and someone listening to it doesn't get at all: the name of a button that shows only an icon, the unit of a number in a badge, a heading for a column of buttons.

```tsx
import { Button, VisuallyHidden } from "@nuvui/react";

export default function Example() {
  return (
    <Button intent="secondary">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
      </svg>
      <VisuallyHidden>Delete the invoice</VisuallyHidden>
    </Button>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { VisuallyHidden } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

Without the stylesheet the text shows. The hiding is a class, not an inline style.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `focusable` | `boolean` | `false` | Show the content while it, or something inside it, has keyboard focus. This is what a "Skip to content" link needs. |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `span`, and give it the class and props. |

Everything else is passed to the `<span>`, including `ref`, `className` and `id`.

## How it hides

`display: none` and `visibility: hidden` hide from everyone, screen readers included. This hides from the eye only: the element is one pixel in size, clipped to nothing, and taken out of the layout so it leaves no gap.

`aria-label` does a similar job on a control, and is fine there. Hidden text has two things over it. Translation tools in the browser translate it, where they often skip attributes. And it works on elements that `aria-label` doesn't, such as a `<span>` or a table cell.

## A skip link

`focusable` shows the content while it, or something in it, has keyboard focus. That's the pattern for a "Skip to content" link: the first stop on the page for the <kbd>Tab</kbd> key, seen only by the people who use that key.

Press <kbd>Tab</kbd> in the example to bring the link up.

```tsx
import { Button, VisuallyHidden } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <VisuallyHidden focusable>
        <Button asChild intent="secondary">
          <a href="#skip-link-target">Skip to the article</a>
        </Button>
      </VisuallyHidden>
      <Button>Press Tab from the button before this one</Button>
      <p
        id="skip-link-target"
        tabIndex={-1}
        style={{ margin: 0, fontSize: 14 }}
      >
        The article starts here.
      </p>
    </div>
  );
}
```

When shown, the content sits where it is in the page's flow. To float it over the page's corner, as most skip links do, position it with a class of your own.

The link's target needs `tabIndex={-1}` if it isn't something that takes focus by itself. Otherwise some browsers scroll to it and leave focus where it was.

## In a table

A column of buttons still needs a header for a screen reader to say with each cell. And each "Open" button needs to say what it opens.

```tsx
import { Button, VisuallyHidden } from "@nuvui/react";

const rows = [
  ["Northwind Traders", "Paid"],
  ["Contoso", "Overdue"],
];

export default function Example() {
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr>
          <th style={{ padding: 8, textAlign: "start" }}>Customer</th>
          <th style={{ padding: 8, textAlign: "start" }}>Status</th>
          <th style={{ padding: 8 }}>
            <VisuallyHidden>Actions</VisuallyHidden>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([customer, status]) => (
          <tr key={customer}>
            <td style={{ padding: 8 }}>{customer}</td>
            <td style={{ padding: 8 }}>{status}</td>
            <td style={{ padding: 8 }}>
              <Button size="sm" intent="ghost">
                Open
                <VisuallyHidden> {customer}</VisuallyHidden>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Accessibility

### What the component handles

- The text stays in the accessibility tree, in its place in the reading order.
- It keeps its words apart. Text squeezed into one pixel can be read out with the spaces missing, and a `white-space` rule prevents that.
- It takes no room, so it can't cause a scrollbar or a gap.

### What you need to handle

- **Don't hide something that can take focus,** without `focusable`. A sighted keyboard user would tab to a control they can't see.
- **Hidden text is for what the layout already shows.** If people who see the page would also be helped by the words, show the words.
- A hidden heading is a fair way to give a region of the page a place in the outline. Don't add more than the page needs.
- Speech input users say what they see. A button whose visible text is "Open" and whose full name is "Open Northwind Traders" works, because the name starts with the visible text. Keep it that way round.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-visually-hidden` | The hiding. |
| `.nuv-visually-hidden--focusable` | focusable. Undoes the hiding while focus is on the element or inside it. |

It has no CSS variables.

## Server components

VisuallyHidden has no `"use client"` directive and uses no state, so it renders in a server component as it is.

It's a class in the stylesheet and not Radix's primitive, which hides with inline styles. A class can be undone on focus, which is what `focusable` needs, and it doesn't put a `style` attribute in the server's HTML, which a strict content security policy would block.

## Do and don't

**Do**

- Use it for the name of an icon-only control when the control's own element can't take `aria-label` cleanly.
- Write hidden text as carefully as visible text. It's the whole interface for some people.

**Don't**

- Don't use it to stuff keywords into a page.
- Don't give screen reader users a different message from everyone else. Say the same thing, in the words the layout left out.
