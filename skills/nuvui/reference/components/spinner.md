<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/spinner.mdx. Don't edit it here: run `pnpm skill`. -->

# Spinner

A ring that turns while something is being done and there's no way to say how far along it is.

Use a spinner for a short wait with no known length: a button that's saving, a panel that's fetching. When you know how far along the work is, a [progress bar](progress.md) says more. When content is loading into a known layout, a [skeleton](skeleton.md) keeps the page from jumping.

```tsx
import { Spinner } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Spinner } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` |  |
| `label` | `string` | `"Loading"` | What a screen reader says. It's in the page as text nobody sees. Translate it with the rest of your interface. Pass an empty string where text next to the spinner already says it: the spinner is then hidden from screen readers. |

Everything else is passed to the `<span>`, including `ref` and `className`.

## In a button

A spinner takes the color of the text around it, so inside a button it has the button's text color whatever the intent.

```tsx
"use client";

import { Button, Spinner } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
  }

  return (
    // aria-disabled keeps the button in the tab order while it works, so
    // focus isn't thrown back to the top of the page.
    <Button aria-disabled={saving} onClick={saving ? undefined : save}>
      {saving ? <Spinner size="sm" label="Saving" /> : null}
      Save changes
    </Button>
  );
}
```

The button in the example is marked with `aria-disabled` while it saves, and not with `disabled`. A disabled button drops out of the tab order, and focus that was on it is lost. With `aria-disabled` it keeps focus, says it's unavailable, and the example ignores presses in the meantime.

## Next to text that says the same

Where visible text already says what's happening, the spinner is decoration. Pass an empty `label`, and it has no role and is hidden from screen readers.

```tsx
import { Spinner } from "@nuvui/react";

export default function Example() {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        color: "var(--color-muted-foreground)",
        fontSize: 14,
      }}
    >
      <Spinner size="sm" label="" />
      Fetching the last 30 days of orders
    </div>
  );
}
```

## Accessibility

A spinner has no keyboard behavior. It can't take focus.

### What the component handles

- It has `role="status"` and its label is text in the page, hidden from view. A screen reader reads the label when the spinner is added to the page, at the next pause in what it's saying.
- With an empty `label` it has no role and `aria-hidden="true"`.
- It only turns when the visitor hasn't asked for reduced motion. With reduced motion it stands still: a ring with a quarter of it drawn darker, which still reads as a spinner.
- It's drawn in the text color, which keeps it visible where the browser forces its own colors.

### What you need to handle

- **Say what's loading.** "Loading" is the default because it's always true. "Saving the report" is better.
- **Render the spinner when the wait starts.** A screen reader notices a status that's added to the page. One that's always there and shown with CSS may not be announced.
- **Say when it's over, if nothing visible changes.** Taking a spinner away isn't announced.
- Translate the label with the rest of your interface.

## CSS variables

Set any of these on the spinner, or on anything around it.

```css
.page-loader {
  --nuv-spinner-size: 3rem;
  --nuv-spinner-color: var(--color-primary);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-spinner-size` | `1.25rem`, `1rem`, `2rem` | Width and height. Differs by size. |
| `--nuv-spinner-color` | `currentcolor` | Color of the ring. The color of the text around it by default. |
| `--nuv-spinner-duration` | `0.75s` | How long one turn takes. |
| `--nuv-spinner-track-opacity` | `0.25` | How strongly the part of the ring that isn't the moving arc is drawn, from 0 to 1. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-spinner` | Every spinner. |
| `.nuv-spinner--lg` | size="lg" |
| `.nuv-spinner--sm` | size="sm" |
| `.nuv-spinner__label` | The text for screen readers. |
| `.nuv-spinner__ring` | The drawing, which is what turns. |
| `.nuv-spinner__track` | The pale full circle behind the arc. |

A medium spinner also has the class `nuv-spinner--md`. It has no rules of its own, because medium is how every spinner starts.

## Server components

Spinner has no `"use client"` directive and uses no state, so it renders in a server component as it is.

## Do and don't

**Do**

- Put it where the result will show up, or in the button that started the work.
- Use one spinner for one piece of work.

**Don't**

- Don't cover the whole page with a spinner for something that affects one part of it.
- Don't show a spinner for longer than a few seconds without saying more. Past that, people want to know what's happening and whether they can leave.
