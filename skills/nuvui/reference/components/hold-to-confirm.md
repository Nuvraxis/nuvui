<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/hold-to-confirm.mdx. Don't edit it here: run `pnpm skill`. -->

# HoldToConfirm

A button that acts only after it's been held down, with the wait drawn along its edge, for things that can't be undone.

Use hold to confirm for something that can't be undone and isn't worth stopping for: removing a row, discarding a draft, ending a session. Holding takes a moment of intent, which a stray click doesn't have. For something with consequences worth reading first, use an [alert dialog](alert-dialog.md).

```tsx
"use client";

import { HoldToConfirm } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [deleted, setDeleted] = useState(0);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <HoldToConfirm onConfirm={() => setDeleted(deleted + 1)}>
        Hold to delete
      </HoldToConfirm>
      <p role="status" style={{ margin: 0 }}>
        Deleted {deleted} {deleted === 1 ? "time" : "times"}
      </p>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { HoldToConfirm } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onConfirm` (required) | `() => void` |  | Called once the button has been held for the whole of `duration`, or pressed twice by someone whose way of pressing can't be held. |
| `duration` | `number` | `1500` | How long the button has to be held, in milliseconds. |
| `hint` | `string` | `"Hold down to confirm."` | What a screen reader says about the button, and says again when it's let go of too soon. Translate it with the rest of your interface. |
| `againLabel` | `string` | `"Press again to confirm."` | What a screen reader says after the first of two presses. Translate it with the rest of your interface. |

It's a [`Button`](button.md), and takes what one takes: `intent`, which is `"danger"` here unless you say otherwise, `size`, `disabled`, `ref` and `className`. It doesn't take `asChild`: what's held has to be a button.

## How long to hold

`duration` is in milliseconds, and 1500 by default. Shorter than about 800 and a slow click gets through. Longer than about 3000 and people give up, or wonder whether it's working.

Letting go before the time is up cancels, and the bar along the bottom of the button drains away. So does moving the pointer off the button, and moving focus away.

## Pressing without holding

Not everything that presses a button can hold it. A screen reader, a switch and a voice command each send one press, with no down and no up. For those, the first press asks for a second, and the second within five seconds confirms. The button says so: "Press again to confirm."

Nobody chooses between the two ways. A press that begins with a pointer or a key going down is a hold, and one that arrives with neither is the first of two.

## Say what holding does

The button's text is yours, and it's the only instruction a sighted person gets. Start it with "Hold to": "Hold to delete", "Hold to discard". A button that says only "Delete" and then does nothing on a click looks broken.

## Accessibility

| Key | What it does |
| --- | --- |
| Space or Enter, held down | Starts the wait. Confirms when the time is up. |
| Space or Enter, let go | Cancels, if the time isn't up. |
| Tab | Moves on, and cancels a hold. |

### What the component handles

- The button is described by `hint`, "Hold down to confirm.", which a screen reader reads after its name.
- Letting go too soon says the hint again, in a status that's in the page from the start.
- A press that can't be held is asked for twice, and the first one says "Press again to confirm."
- The bar is a picture and is hidden from screen readers.
- The bar is under the button's text and not behind it, so the text is as easy to read while it's held as when it isn't.
- The bar moves for everyone, including a visitor who asked for less motion. It's the only thing that shows how much longer to hold, and it's one slow fill, not a decoration.
- Where the browser forces its own colors the bar is drawn in the highlight color.
- A finger held on the button doesn't scroll the page or open the phone's menu.

### What you need to handle

- Translate `hint` and `againLabel`. [Translation](../translation.md) lists them.
- Say what happened afterwards, in a [toast](toast.md) or in the page. The button doesn't.
- Move focus somewhere sensible if confirming removes the button.
- Where a mistake would be costly, offer an undo as well, or use an [alert dialog](alert-dialog.md). Holding is harder for some people than a press, whatever they press with.

## On small screens

The button is 44 pixels tall with a finger, as any button is. A held finger covers a small button, and the bar with it, so let the button be as wide as its text and more.

## CSS variables

Set any of these on the `HoldToConfirm`, or on anything around it. The [button's own variables](button.md#css-variables) work here too.

```css
.danger-zone {
  --nuv-hold-to-confirm-progress-size: 6px;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-hold-to-confirm-progress-size` | `4px` | Thickness of the bar. |
| `--nuv-hold-to-confirm-progress` | `currentcolor` | Color of the bar. The button's text color by default, so it suits every intent. Keep it at 3:1 against the button. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-hold-to-confirm` | HoldToConfirm. On the button, with the button's own classes. |
| `.nuv-hold-to-confirm__label` | What wraps the button's content. |
| `.nuv-hold-to-confirm__progress` | The bar. |
| `.nuv-hold-to-confirm__status` | What's said to a screen reader, drawn for nobody. It comes after the button. |

What the button is doing is in a `data-state` attribute: `idle`, `holding`, or `armed` after the first of two presses.

## Server components

HoldToConfirm starts with `"use client"`: it keeps time. `onConfirm` is a function, so the component that renders it has to be a client component too, or pass a server action.

## Do and don't

**Do**

- Start the button's text with "Hold to".
- Use it where the action is clear from where the button is: in a row, on a card.

**Don't**

- Don't use it for an action that can be undone. A plain button and an undo is quicker for everyone.
- Don't use it for the main action of a form.
- Don't stack it with a dialog. One way of being sure is enough.
