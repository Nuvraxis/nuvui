<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/text-shimmer.mdx. Don't edit it here: run `pnpm skill`. -->

# TextShimmer

Text with a highlight that moves across it, for a short wait such as "Thinking". It's still for anyone who asked for less motion.

Use a text shimmer for a few words that say something is being worked on: "Thinking", "Reading the report", "Searching". For a wait with nothing to say, use a [spinner](spinner.md). For content that's on its way, use a [skeleton](skeleton.md).

```tsx
import { TextShimmer } from "@nuvui/react";

export default function Example() {
  return <TextShimmer>Thinking</TextShimmer>;
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { TextShimmer } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `active` | `boolean` | `true` | Whether the highlight is moving. Turn it off when the wait is over and the text stays, and it becomes plain text in the same color. |

It's a `span`, and takes what a `span` takes, including `ref` and `className`. The size, the weight and the font are the ones of the text around it.

## While something is worked on

The shimmer is a look and says nothing by itself. To have a screen reader read the words when they appear, put them in an element with `role="status"` that's in the page from the start.

```tsx
"use client";

import { Button, TextShimmer } from "@nuvui/react";
import { useEffect, useState } from "react";

export default function Example() {
  const [waiting, setWaiting] = useState(false);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setWaiting(false);
      setAnswer("Revenue rose 12% over last quarter.");
    }, 3000);
    return () => clearTimeout(timer);
  }, [waiting]);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <Button
        intent="secondary"
        disabled={waiting}
        onClick={() => {
          setAnswer("");
          setWaiting(true);
        }}
      >
        Summarize the quarter
      </Button>
      {/* In the page from the start, so a screen reader hears each change. */}
      <p role="status" style={{ margin: 0, minBlockSize: "1.5em" }}>
        {waiting ? <TextShimmer>Reading the report</TextShimmer> : answer}
      </p>
    </div>
  );
}
```

## When the wait is over

Take the shimmer out and put the result in its place. Where the same words stay, such as a step that has finished in a list of steps, set `active={false}`: the text keeps its color and stops moving.

## Accessibility

A text shimmer has no keyboard behavior. It can't take focus.

### What the component handles

- The text is ordinary text. A screen reader reads it, and it can be selected and found.
- For a visitor who asked for less motion, nothing moves and the text is drawn in one color.
- The resting color is the muted text color, which the theme holds to 4.5:1 against the background, and the highlight is the stronger text color. So the words can be read at every moment of the sweep.
- Where the browser forces its own colors, the text is drawn in the browser's text color and nothing moves.
- In a right-to-left page the highlight runs from the right.

### What you need to handle

- Give it words. A shimmer on a blank shape is a [skeleton](skeleton.md).
- Put it in a `role="status"` element when its appearing should be read out.
- Don't leave it running. Motion that goes on for more than five seconds beside other content is something WCAG asks for a way to stop, and a wait that long deserves more than three words anyway.

## CSS variables

Set any of these on the `TextShimmer`, or on anything around it.

```css
.assistant {
  --nuv-text-shimmer-duration: 3s;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-text-shimmer-fg` | `var(--color-muted-foreground)` | Color of the text at rest. Keep it at 4.5:1 against the background. |
| `--nuv-text-shimmer-highlight` | `var(--color-foreground)` | Color of the moving highlight. Keep it at 4.5:1 against the background too. |
| `--nuv-text-shimmer-duration` | `2s` | How long one sweep takes. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-text-shimmer` | TextShimmer |
| `.nuv-text-shimmer--active` | While the highlight moves. Left off with active={false}. |

Whether it's moving is also in a `data-state` attribute: `active` or `still`.

## Server components

TextShimmer has no `"use client"` directive and uses no state, so it renders in a server component as it is.

## Do and don't

**Do**

- Keep it to a few words on one line.
- Say what's happening: "Searching the docs" tells more than "Loading".

**Don't**

- Don't use it for a heading or anything else that stays. Moving text is hard to read.
- Don't show several at once.
