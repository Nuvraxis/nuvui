<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/collapsible.mdx. Don't edit it here: run `pnpm skill`. -->

# Collapsible

A button that shows and hides a piece of content below it.

Use a collapsible for detail most people don't need: the technical part of an error, the rest of a long list, advanced options. For several sections where opening one may close another, use an [accordion](accordion.md). For content that floats over the page, use a [popover](popover.md).

```tsx
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Collapsible style={{ width: "100%", maxWidth: 360 }}>
      <CollapsibleTrigger asChild>
        <Button intent="secondary">Show the error details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p style={{ margin: 0, paddingBlockStart: 12, fontSize: 14 }}>
          The request to /api/orders timed out after 30 seconds. Request ID
          7f3a-22c1.
        </p>
      </CollapsibleContent>
    </Collapsible>
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Collapsible` | The wrapper. It holds the open state. |
| `CollapsibleTrigger` | The button. |
| `CollapsibleContent` | What's shown and hidden. |

## Props

### Collapsible

These come from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Whether it's open, when you control it yourself. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` |  | Whether it starts open, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called with the new state when the button is pressed. |
| `disabled` | `boolean` |  | Stops the button from being focused or pressed. |

### CollapsibleTrigger

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` |  | Render the single child element instead of a `button`, and give it the trigger's behavior. |

### CollapsibleContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `forceMount` | `true` |  | Keep the content in the page while closed. Hiding it is then up to you. Radix sets `data-state` to go by. |

Each part also takes what its element takes, including `ref` and `className`.

## The trigger has no look of its own

`CollapsibleTrigger` is a plain button with Radix's behavior and no styles. Pass `asChild` and put a [`Button`](button.md) inside, as the examples do, or style your own element. What a collapsible's button should look like depends too much on where it is for one look to fit.

## Showing more of a list

The trigger doesn't have to come first. Here it sits under the content, and its text says what a press will do.

```tsx
"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react";
import { useState } from "react";

const more = ["Billing address", "Tax number", "Purchase order"];

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      style={{ width: "100%", maxWidth: 360, fontSize: 14 }}
    >
      <ul style={{ margin: 0, paddingInlineStart: 20 }}>
        <li>Company name</li>
        <li>Contact email</li>
      </ul>
      <CollapsibleContent>
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {more.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button intent="ghost" size="sm" style={{ marginBlockStart: 8 }}>
          {open ? "Show fewer fields" : `Show ${more.length} more fields`}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
```

## Padding goes on something inside

The height of `CollapsibleContent` is animated from zero to the height of what's in it. Padding or a margin on that element isn't part of that measure, and the panel jumps at the end. Put the spacing on an element inside it.

## Content that has to be found while closed

While it's closed, the content isn't in the page. The browser's find-in-page can't reach it, and neither can a crawler.

`forceMount` keeps it in the page. Hiding it is then yours to do: Radix sets `data-state="closed"` on the element and leaves it showing. Hide it with a rule on that attribute, or use the browser's own [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) element, which some browsers open by themselves when a search matches inside it.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the button. Once open, the next stop is the first control inside the content. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | Shows or hides the content. Focus stays on the button. |

### What the component handles

- The button has `aria-expanded`, and `aria-controls` pointing at the content. This part is Radix.
- Closed content is taken out of the page, so nothing inside it can be reached by <kbd>Tab</kbd> or read by a screen reader.
- The slide is only animated when the visitor hasn't asked for reduced motion.

### What you need to handle

- Write a label that says what's hidden: "Show the error details", not "More".
- Either keep the label the same in both states, or change it to say what the next press does. `aria-expanded` already tells a screen reader which state it's in.
- Don't hide something people need in order to finish a task, such as a required field.
- Give the trigger a visible focus ring if you style your own. `Button` has one.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-collapsible-duration` | `var(--nuv-duration-slow)`, `var(--nuv-duration-base)` | How long the slide takes, both ways. By default opening takes a little longer than closing. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-collapsible__content` | CollapsibleContent. |

`Collapsible` gets `nuv-collapsible` and `CollapsibleTrigger` gets `nuv-collapsible__trigger`. No styles are attached to either. Radix sets `data-state` to `open` or `closed` on all three parts, and `data-disabled` when the collapsible is disabled.

## Server components

The collapsible parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files. You can render them from a server component, as the first example on this page does.

## Do and don't

**Do**

- Put the button next to what it shows.
- Start open when most people will want the content.

**Don't**

- Don't nest one collapsible in another. Two levels of hiding are hard to keep track of.
- Don't use it to shorten a page that people read from top to bottom. Scrolling is easier than pressing.
