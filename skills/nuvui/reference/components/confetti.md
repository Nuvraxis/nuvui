<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/confetti.mdx. Don't edit it here: run `pnpm skill`. -->

# Confetti

A burst of confetti from an element, for a moment worth marking, such as a first sale or a finished setup. The pieces fall back and rest on the element. It's decoration, and isn't thrown for anyone who asked for less motion.

Use confetti for a moment someone worked toward: the last step of a setup, a first sale, a goal reached. It's thrown up from an element, the pieces fall back, and those that come down on the element rest on it a moment before they fade. Keep it for the rare moment. For an everyday success, such as a saved form, use a [toast](toast.md).

```tsx
"use client";

import { Button, burstConfetti } from "@nuvui/react";

export default function Example() {
  return (
    <Button onClick={(event) => burstConfetti(event.currentTarget)}>
      Publish
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
import { burstConfetti } from "@nuvui/react";
```

It's a function, not a component: call it with the element the confetti comes from, from an event handler or an effect.

```tsx
<Button onClick={(event) => burstConfetti(event.currentTarget)}>
  Publish
</Button>
```

## Options

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `count` | `number` | `80` | How many pieces are thrown. At most 150. |
| `colors` | `string[]` |  | The pieces' colors, as any CSS color, or a variable such as `var(--color-primary)`, read where the target is. Without them the pieces take the theme's chart colors. |

`burstConfetti` returns a promise that settles when its last piece is gone, for anything that should wait until then.

## Colors

The pieces take the theme's chart colors, `--color-chart-1` and on, as they are where the element is. So a theme set on a part of the page colors what's thrown from it. `colors` takes your own: any CSS color, or a variable such as `var(--color-primary)`, which is read where the element is.

## Say it in words too

Confetti says nothing to someone who can't see it, and nothing at all to someone who asked for less motion, for whom it isn't thrown. So the moment it marks has to be said another way as well: a heading, a message, an element with `role="status"`.

```tsx
"use client";

import { burstConfetti, Checkbox, Label } from "@nuvui/react";
import { useId, useRef, useState } from "react";

const steps = ["Invite your team", "Connect a data source", "Share a report"];

export default function Example() {
  const id = useId();
  const [done, setDone] = useState<string[]>([]);
  const list = useRef<HTMLUListElement>(null);

  function check(step: string, checked: boolean) {
    const next = checked
      ? [...done, step]
      : done.filter((each) => each !== step);
    setDone(next);
    // The last step, done just now.
    if (checked && next.length === steps.length && list.current) {
      burstConfetti(list.current);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ul
        ref={list}
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {steps.map((step, index) => (
          <li
            key={step}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <Checkbox
              id={`${id}-${index}`}
              checked={done.includes(step)}
              onCheckedChange={(checked) => check(step, checked === true)}
            />
            <Label htmlFor={`${id}-${index}`}>{step}</Label>
          </li>
        ))}
      </ul>
      {/* Words for everyone. The confetti is only decoration. */}
      <p role="status" style={{ margin: 0, minBlockSize: "1.5em" }}>
        {done.length === steps.length ? "All set up." : ""}
      </p>
    </div>
  );
}
```

## Accessibility

Confetti has no role and can't take focus.

### What the component handles

- The pieces are drawn on one canvas over the page, which is hidden from screen readers and lets every press through to what's under it.
- For a visitor who asked for less motion, nothing is thrown.
- Where the browser forces its own colors, nothing is thrown either: the pieces are colors and nothing else.
- A burst is over in about three seconds, and the canvas is taken out of the page when its last piece is gone.
- No more than 150 pieces are thrown at once, and no more than 300 are in the air however many bursts there are. A tab that's hidden stops drawing.

### What you need to handle

- Say what happened in words, as above.
- Keep it for a moment that matters. Thrown every time something is saved, it becomes noise.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-confetti-z-index` | `calc(var(--nuv-z-toast) + 1)` | Where the canvas is in the stack. Over toasts unless you say otherwise. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-confetti` | The canvas the pieces are drawn on. |

The canvas is put at the end of the page's `body` while pieces are in the air. It's fixed over the window, whatever stylesheet is loaded.

## Server components

`burstConfetti` runs in the browser, from a client component's event handler or effect. It has no `"use client"` directive of its own, since it isn't a component, and a server component has nothing to call it with.

## Do and don't

**Do**

- Throw it from the thing that was done: the button that finished it, or the list that's now complete.
- Say the same thing in words.

**Don't**

- Don't throw it when a page opens.
- Don't throw it for a mistake put right, or anything someone would rather not be congratulated on.
