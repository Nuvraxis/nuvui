<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/emoji/emoji-reaction.mdx. Don't edit it here: run `pnpm skill`. -->

# EmojiReaction

A button with an emoji and how many reacted with it, pressed when the reader is one of them. For the row of reactions under a message or a comment.

Use an emoji reaction for each emoji people have reacted with, under the thing they reacted to. It shows the emoji and the count, and a press joins the reaction or takes the reader's away. To pick an emoji that isn't there yet, put an [EmojiPicker](emoji-picker.md) beside the row.

```tsx
"use client";

import { EmojiReaction } from "@nuvui/emoji";
import { useState } from "react";

// Made up, and stands in for what your server has kept: who else reacted,
// and whether the reader did.
const kept = [
  { emoji: "🎉", label: "party popper", others: 4, mine: true },
  { emoji: "👏", label: "clapping hands", others: 2, mine: false },
  { emoji: "👍", label: "thumbs up", others: 11, mine: false },
];

export default function Example() {
  const [reactions, setReactions] = useState(kept);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          label={reaction.label}
          count={reaction.others + (reaction.mine ? 1 : 0)}
          pressed={reaction.mine}
          onPressedChange={(mine) =>
            setReactions((now) =>
              now.map((entry) =>
                entry.emoji === reaction.emoji ? { ...entry, mine } : entry,
              ),
            )
          }
        />
      ))}
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/emoji @nuvui/react
```

## Import

```tsx
import { EmojiReaction } from "@nuvui/emoji";
```

The styles come from `@nuvui/emoji/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Emoji](index.md) covers that. From `@nuvui/emoji/emoji-reaction` the button comes without the picker, and its styles are at `@nuvui/emoji/css/emoji-reaction.css`.

```tsx
<EmojiReaction
  emoji="👍"
  label="thumbs up"
  count={others + (mine ? 1 : 0)}
  pressed={mine}
  onPressedChange={setMine}
/>
```

## The count is yours

The button keeps nothing. `count` is what it shows and `pressed` is whether the reader is one of them, and a press only calls `onPressedChange` with what `pressed` would become. So the count can come from your server, be changed at once and put back if the request fails, or change when someone else reacts.

Count the reader in: three others and the reader is `count={4}` with `pressed`.

A reaction nobody is left on is yours to take off the row. The button doesn't hide itself at zero.

## With a picker

A row of reactions and a button that opens a picker, to add one that isn't there. An emoji that's picked and is there already is joined, and not added twice.

```tsx
"use client";

import { EmojiPicker, EmojiReaction } from "@nuvui/emoji";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";
import { type CSSProperties, useRef, useState } from "react";

interface Reaction {
  emoji: string;
  label: string;
  others: number;
  mine: boolean;
}

const bare = {
  "--nuv-popover-width": "auto",
  "--nuv-popover-padding": "0px",
  "--nuv-emoji-picker-border": "transparent",
} as CSSProperties;

// The same emoji is written with or without a mark that asks for it to be
// drawn in color, and the picker's list writes it for some. Compared
// without it, a thumbs up that's there is joined and not added twice.
const plain = (emoji: string) => emoji.replaceAll("\uFE0F", "");
const same = (one: string, other: string) => plain(one) === plain(other);

export default function Example() {
  const [reactions, setReactions] = useState<Reaction[]>([
    { emoji: "👍", label: "thumbs up", others: 2, mine: false },
  ]);
  const [open, setOpen] = useState(false);
  const add = useRef<HTMLButtonElement>(null);

  // An emoji that's there is joined, or the reader's is taken away. A
  // reaction nobody is left on is taken off the row.
  function react(emoji: string, label: string) {
    const there = reactions.find((entry) => same(entry.emoji, emoji));
    // Its button is about to go, and the focus with it unless it's given
    // somewhere to be.
    if (there?.mine && there.others === 0) add.current?.focus();
    setReactions((now) =>
      there
        ? now
            .map((entry) =>
              same(entry.emoji, emoji)
                ? { ...entry, mine: !entry.mine }
                : entry,
            )
            .filter((entry) => entry.mine || entry.others > 0)
        : [...now, { emoji, label, others: 0, mine: true }],
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          label={reaction.label}
          count={reaction.others + (reaction.mine ? 1 : 0)}
          pressed={reaction.mine}
          onPressedChange={() => react(reaction.emoji, reaction.label)}
        />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button ref={add} intent="secondary" size="sm">
            Add reaction
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Pick an emoji" align="start" style={bare}>
          <EmojiPicker
            autoFocus
            onEmojiSelect={(emoji, item) => {
              react(emoji, item.label);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

The picker hands over the emoji's name with the emoji, as `item.label`, which is what `label` wants.

Compare two emoji with the character U+FE0F taken out of both, as the example does. It asks for an emoji to be drawn in color and isn't seen, and the same emoji is written with it in one place and without it in another: the picker's thumbs up has it, and one typed on a keyboard may not.

## Large counts, and reactions that can't be pressed

Children are drawn in place of the count, for a number written shorter. The button is still read with the number itself.

`disabled` is for a reader who may look and not react: someone signed out, or a thread that's closed.

```tsx
import { EmojiReaction } from "@nuvui/emoji";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export default function Example() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <EmojiReaction emoji="🚀" label="rocket" count={1284} pressed>
        {compact.format(1284)}
      </EmojiReaction>
      <EmojiReaction emoji="👀" label="eyes" count={3} disabled />
    </div>
  );
}
```

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `emoji` (required) | `string` |  | The emoji, as text. |
| `label` (required) | `string` |  | The emoji's name, such as "thumbs up". It's what the button is read as, with the count, since a screen reader's own name for an emoji varies from one to the next. |
| `count` (required) | `number` |  | How many reacted with it, the reader included when it's theirs. |
| `pressed` | `boolean` | `false` | Whether the reader is one of them. |
| `onPressedChange` | `((pressed: boolean) => void)` |  | Called when it's pressed, with what `pressed` would become. The count is yours to change with it. |

It's a `button`, and takes what a `button` takes, including `ref`, `className`, `disabled` and `onClick`. An `onClick` that calls `preventDefault()` stops the press.

## Translation

The button is named `label` and the count, as in "thumbs up, 4", and whether it's pressed is said by the screen reader in its own language. `label` is the one word of yours in it. For a name put together another way, give `aria-label`.

## Accessibility

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Goes to each reaction in turn. |
| <kbd>Enter</kbd> <kbd>Space</kbd> | Joins the reaction, or takes the reader's away. |

### What the component handles

- It's a button that says whether it's pressed.
- It's read by the emoji's name and the count, and not as the character, which a screen reader may name another way or not at all.
- The reader's own has an edge in another color that's also twice as thick, so it isn't told apart by color alone. Where the browser forces its own colors the border is the thick one.
- It's 44 pixels tall on a touch screen, and 32 with a mouse.
- The count asks for figures of one width, so the row doesn't shift as a count changes where the font has them.

### What you need to handle

- Give `label` the emoji's name, in the reader's language.
- Say what a press did, in a [live region](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions), if it isn't plain from the button: the new count is in its name, and a screen reader doesn't read a name again because it changed.
- When the reader takes away the last of a reaction and you take its button off the row, put the focus somewhere, such as on the button that adds one. The second example does.
- Name the row if there's more than one on the page, with `role="group"` and an `aria-label` such as "Reactions to Priya's message".

## On small screens

Put the reactions in a row that wraps. Each keeps its size, and a count never wraps inside its button.

## CSS variables

Set any of these on an `EmojiReaction`, or on anything around it.

```css
.thread {
  --nuv-emoji-reaction-radius: var(--radius-md);
  --nuv-emoji-reaction-height: 2.25rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-emoji-reaction-gap` | `calc(var(--spacing) * 1.5)` | Space between the emoji and the count. |
| `--nuv-emoji-reaction-height` | `var(--nuv-touch-size, 2.75rem)`, `2rem` | Least height of the button. The touch size on a touch screen and 2rem with a mouse. Set it for both if you set it. |
| `--nuv-emoji-reaction-padding-inline` | `calc(var(--spacing) * 3)`, `calc(var(--spacing) * 2.5)` | Space at each end. |
| `--nuv-emoji-reaction-border` | `var(--color-border-strong)` | Color of the border. Keep it at 3:1 against what's behind it. |
| `--nuv-emoji-reaction-radius` | `var(--radius-full)` | Corner radius. A pill by default. |
| `--nuv-emoji-reaction-bg` | `transparent` | Background. |
| `--nuv-emoji-reaction-fg` | `var(--color-foreground)` | Color of the count. |
| `--nuv-emoji-reaction-hover-bg` | `var(--color-muted)` | Background under the pointer. |
| `--nuv-emoji-reaction-pressed-border` | `var(--color-primary)` | Color of the edge of the reader's own, which is twice as thick. |
| `--nuv-emoji-reaction-pressed-bg` | `var(--color-muted)` | Background of the reader's own. |
| `--nuv-emoji-reaction-font` | `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif` | The fonts the emoji is drawn in. The device's emoji fonts by default. |
| `--nuv-emoji-reaction-emoji-size` | `var(--text-base)` | Size of the emoji. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-emoji-reaction` | EmojiReaction |
| `.nuv-emoji-reaction__count` | The count. |
| `.nuv-emoji-reaction__emoji` | The emoji. |

The reader's own has `aria-pressed="true"` and a `data-pressed` attribute.

## Server components

EmojiReaction starts with `"use client"`. One that only shows a count, with `disabled` and no `onPressedChange`, can be rendered from a server component. With `onPressedChange`, which is a function, the component that renders it has to be a client component too.

## Do and don't

**Do**

- Change the count at once when it's pressed, and put it back if saving fails.
- Keep the order of the row as it is when a count changes, so nothing moves under the pointer.

**Don't**

- Don't use it for a vote that decides something. A reaction is light, and is read as one.
- Don't leave `label` as the emoji itself. It's the name that's read.
