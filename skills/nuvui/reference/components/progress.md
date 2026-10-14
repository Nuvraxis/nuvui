<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/progress.mdx. Don't edit it here: run `pnpm skill`. -->

# Progress

A bar that fills as a task gets done.

Use a progress bar for work whose length you can measure: an upload, an import, the steps of a setup. For a wait with no known length, pass no value and the bar moves from side to side. For a short wait, a [spinner](spinner.md) takes less room.

```tsx
import { Progress } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <Progress aria-label="Storage used" value={64} />
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
import { Progress } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `number \| null` |  | How far along it is, from 0 to `max`. Pass `null`, or leave it out, while the amount isn't known: the bar then moves from side to side. |
| `max` | `number` | `100` |  |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` |  |
| `getValueLabel` | `((value: number, max: number) => string)` |  | The text a screen reader says for the value. By default it's the percentage, such as "40%". |

Everything else is passed to the `<div>` Radix renders, including `ref`, `className`, `aria-label` and `aria-labelledby`.

A value below 0 or above `max` is held to that range. A value that isn't a number counts as not known.

## With a label and a number

A bar needs a name. Where there's visible text that says what's being done, point `aria-labelledby` at it. The percentage next to the bar in this example is hidden from screen readers, because the bar already reports its value.

```tsx
"use client";

import { Button, Progress } from "@nuvui/react";
import { useEffect, useId, useState } from "react";

export default function Example() {
  const [value, setValue] = useState(0);
  const labelId = useId();
  const running = value > 0 && value < 100;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setValue((current) => Math.min(current + 10, 100)),
      400,
    );
    return () => clearInterval(timer);
  }, [running]);

  return (
    <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 320 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
        }}
      >
        <span id={labelId}>Uploading report.pdf</span>
        <span aria-hidden="true">{value}%</span>
      </div>
      <Progress aria-labelledby={labelId} value={value} />
      <Button
        intent="secondary"
        size="sm"
        style={{ justifySelf: "start" }}
        onClick={() => setValue(value === 0 || value === 100 ? 10 : value)}
        aria-disabled={running}
      >
        {value === 100 ? "Upload again" : "Start the upload"}
      </Button>
    </div>
  );
}
```

## When the amount isn't known

Leave `value` out, or pass `null`, and a short bar slides from one side to the other.

```tsx
import { Progress } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <Progress aria-label="Connecting to the server" />
    </div>
  );
}
```

With reduced motion the bar doesn't slide. It's shown full and paler, which can't be mistaken for a measured amount.

Start this way and switch to a value once you have one. An upload is a common case: the size is known a moment after it starts.

## Steps and sizes

`max` sets what counts as done, so a five-step setup can report 2 of 5. A screen reader says the value as a percentage unless `getValueLabel` gives it something better.

```tsx
"use client";

import { Progress } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 320 }}>
      <Progress
        aria-label="Setup"
        size="sm"
        value={2}
        max={5}
        getValueLabel={(value, max) => `Step ${value} of ${max}`}
      />
      <Progress aria-label="Setup" value={2} max={5} />
      <Progress aria-label="Setup" size="lg" value={2} max={5} />
    </div>
  );
}
```

The sizes are 6, 8 and 12 pixels tall.

## Accessibility

A progress bar has no keyboard behavior. It reports and can't be changed. For a value people set, use a [slider](slider.md).

### What the component handles

- It has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext`. This part is Radix.
- With no value it has no `aria-valuenow`, which is how a screen reader knows the amount isn't known.
- The bar's edge has at least 3:1 against the page in every theme, and the filled part at least 3:1 against the empty part.
- Where the browser forces its own colors, the filled part takes the system's color for something selected.
- It fills from the right in a right-to-left layout.
- The filled part's movement is only animated when the visitor hasn't asked for reduced motion.

### What you need to handle

- **Name it,** with `aria-label` or `aria-labelledby`. Two bars on one page need different names.
- **Don't expect every change to be read out.** A screen reader reads the value when the visitor moves to the bar, and some read changes while focus is on it. For work that takes a while, say the milestones in an element with `role="status"`: "Halfway", "Upload complete".
- **Say when it's done** in words, and say what happens next. A full bar that just sits there looks stuck.
- Mark the region that's being loaded with `aria-busy="true"`, and point its `aria-describedby` at the bar, where the bar is about one part of the page.

## CSS variables

Set any of these on the bar, or on anything around it.

```css
.upload {
  --nuv-progress-indicator: var(--color-success);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-progress-width` | `100%` | Width of the bar. |
| `--nuv-progress-height` | `0.5rem`, `0.375rem`, `0.75rem` | Height of the bar. Differs by size. |
| `--nuv-progress-border` | `var(--color-border-strong)` | Color of the edge. Keep it at 3:1 against the page, so the bar's full length can be seen. |
| `--nuv-progress-radius` | `var(--radius-full)` | Corner radius. Fully round by default. |
| `--nuv-progress-track` | `var(--color-muted)` | Color of the part that isn't filled. |
| `--nuv-progress-indicator` | `var(--color-primary)` | Color of the filled part. Keep it at 3:1 against the part that isn't. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-progress` | The bar. |
| `.nuv-progress--lg` | size="lg" |
| `.nuv-progress--sm` | size="sm" |
| `.nuv-progress__indicator` | The filled part. |

A medium bar also has the class `nuv-progress--md`, which has no rules of its own. Radix sets `data-state` to `loading`, `complete` or `indeterminate` on both elements, along with `data-value` and `data-max`.

## Server components

Progress is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the first example on this page does.

`getValueLabel` is a function, and a server component can't pass a function to a client component. A bar that uses it has to be rendered from a client component, as the steps example is.

## Do and don't

**Do**

- Show a real measure. A bar that crawls to 90% and waits there is worse than a spinner.
- Put the number next to the bar when the work is long. A bar's last tenth is hard to judge by eye.

**Don't**

- Don't let it go backwards. If the estimate was wrong, slow down.
- Don't use it for a value that isn't progress, such as disk space used against a warning level. That's a meter, and it wants the `meter` role.
