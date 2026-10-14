<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/emoji/emoji-picker.mdx. Don't edit it here: run `pnpm skill`. -->

# EmojiPicker

A panel to pick an emoji from, with a search box, the emoji in their groups, a choice of skin tone and the ones picked before. It draws the device's own emoji, and only the rows in view.

Use an emoji picker where someone writes to other people: a message, a comment, a status, a reaction. For a choice from a handful of emoji that never changes, a [toggle group](../components/toggle-group.md) of them is lighter.

```tsx
"use client";

import { EmojiPicker } from "@nuvui/emoji";
import { useState } from "react";

export default function Example() {
  const [picked, setPicked] = useState("");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <EmojiPicker onEmojiSelect={(emoji) => setPicked(emoji)} />
      <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        {picked ? `You picked ${picked}` : "Nothing picked yet"}
      </p>
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
import { EmojiPicker } from "@nuvui/emoji";
```

The styles come from `@nuvui/emoji/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Emoji](index.md) covers that, and what it means that the emoji are the device's own.

```tsx
<EmojiPicker onEmojiSelect={(emoji) => setText((text) => text + emoji)} />
```

## In a popover

The picker is a panel, and has no button of its own. Most often it opens from one, in a [popover](../components/popover.md). `autoFocus` puts the caret in the search box when it opens, so a name can be typed at once and Enter picks the first emoji found.

```tsx
"use client";

import { EmojiPicker } from "@nuvui/emoji";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";
import { type CSSProperties, useState } from "react";

// The popover is the panel's edge here, so it gives up its own width and
// padding, and the picker gives up its border.
const bare = {
  "--nuv-popover-width": "auto",
  "--nuv-popover-padding": "0px",
  "--nuv-emoji-picker-border": "transparent",
} as CSSProperties;

export default function Example() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Shipped");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <p style={{ margin: 0 }} data-text>
        {text}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button intent="secondary">Add an emoji</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Pick an emoji" align="start" style={bare}>
          <EmojiPicker
            autoFocus
            onEmojiSelect={(emoji) => {
              setText((now) => `${now} ${emoji}`);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

The popover gives up its width and its padding here, and the picker its border, so the two are one panel. Where there's less room than the picker's height, the picker is made shorter to fit, and its list stays the one thing that scrolls.

## What's picked

`onEmojiSelect` is called with the emoji as text, in the skin tone that's set, and with what the list knows of it: its name, its group, and the emoji with no tone.

```tsx
<EmojiPicker
  onEmojiSelect={(emoji, item) => {
    insert(emoji); // "👋🏽"
    log(item.label); // "waving hand"
  }}
/>
```

## Searching

What's typed is looked for in each emoji's name and in the other words it's found by, a word at a time: "hello" finds the waving hand, and "face big" the grinning face with big eyes. How many were found is said to a screen reader.

Enter in the search box picks the first one found. The down arrow goes from the search box into the list.

## Skin tones

The hand beside the search box opens the six tones. The one that's chosen is drawn on every emoji that has tones, and remembered. `defaultSkinTone` is where it starts, and `skinTone` with `onSkinToneChange` is for keeping it yourself.

Emoji of two people who each have a tone are listed with none.

## The ones picked before

The last sixteen emoji picked are listed first the next time the picker is drawn. They aren't added while it's open, so nothing moves under the pointer as emoji are picked.

They're kept in the browser's local storage, with the skin tone, under the name `storageKey` gives, which is `"nuvui-emoji"`. To keep them with someone's account, so they follow from one device to the next, give `recent` and `onRecentChange`, and `storageKey={null}` to keep nothing in the browser.

```tsx
"use client";

import { EmojiPicker, type EmojiSkinTone } from "@nuvui/emoji";
import { useState } from "react";

export default function Example() {
  // Kept here, where an app would keep them with the account, so they
  // follow someone from one device to the next.
  const [recent, setRecent] = useState(["👍", "🎉", "🚀"]);
  const [tone, setTone] = useState<EmojiSkinTone>(3);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <EmojiPicker
        storageKey={null}
        recent={recent}
        onRecentChange={setRecent}
        skinTone={tone}
        onSkinToneChange={setTone}
      />
      <p style={{ margin: 0, fontSize: "var(--text-sm)" }} data-kept>
        Recent: {recent.join(" ")}. Skin tone: {tone}.
      </p>
    </div>
  );
}
```

Kept by you, the list is drawn as you give it. Give it the new list when the picker is next opened, and not while it's open, if emoji shouldn't move.

## Which emoji are listed

- `emojiVersion` is the newest version of Emoji to list, 15 by default. A device draws an empty box for an emoji it doesn't have, and raising this lists more of those.
- `flags` is `"auto"` by default, which lists flags where the device draws them. `true` and `false` say so yourself.

## A list of your own

`data` takes the emoji to list: other names, another language, or only the ones that fit. Each is an emoji, a name, the group it's in, and optionally other words to find it by, its version, and its five skin tones.

```tsx
"use client";

import { type EmojiItem, EmojiPicker } from "@nuvui/emoji";
import type { CSSProperties } from "react";
import { useState } from "react";

// The few a comment can be answered with, named in Dutch.
const reactions: EmojiItem[] = [
  { emoji: "👍", label: "duim omhoog", tags: ["goed", "ja"], group: "people" },
  {
    emoji: "👎",
    label: "duim omlaag",
    tags: ["slecht", "nee"],
    group: "people",
  },
  { emoji: "👏", label: "klappende handen", tags: ["bravo"], group: "people" },
  { emoji: "😀", label: "grijnzend gezicht", tags: ["blij"], group: "smileys" },
  {
    emoji: "😢",
    label: "huilend gezicht",
    tags: ["verdrietig"],
    group: "smileys",
  },
  {
    emoji: "🎉",
    label: "feestknaller",
    tags: ["feest", "hoera"],
    group: "activities",
  },
  { emoji: "❤️", label: "rood hart", tags: ["liefde"], group: "symbols" },
];

const small = { "--nuv-emoji-picker-height": "16rem" } as CSSProperties;

export default function Example() {
  const [picked, setPicked] = useState("");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <EmojiPicker
        data={reactions}
        storageKey={null}
        style={small}
        onEmojiSelect={(emoji, item) => setPicked(`${emoji} ${item.label}`)}
        labels={{
          search: "Emoji zoeken",
          list: "Emoji's",
          groups: "Groepen",
          results: "Gevonden",
          skinTone: "Huidskleur",
          skinTones: [
            "Standaard",
            "Licht",
            "Lichtgetint",
            "Getint",
            "Donkergetint",
            "Donker",
          ],
          group: {
            smileys: "Gezichten",
            people: "Mensen",
            activities: "Activiteiten",
            symbols: "Symbolen",
          },
          found: (count) =>
            count === 0 ? "Niets gevonden" : `${count} gevonden`,
        }}
      />
      <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        {picked}
      </p>
    </div>
  );
}
```

With `data`, the list the package comes with isn't loaded.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onEmojiSelect` | `((emoji: string, item: EmojiItem) => void)` |  | Called when an emoji is picked, with the emoji as text, in the skin tone that's set, and with what the list knows about it. |
| `data` | `EmojiItem[]` |  | The emoji to list, when the ones it comes with aren't the ones you want: another language's names, or fewer. Without it, the list it comes with is loaded when the picker is first drawn. |
| `emojiVersion` | `number` | `15` | The newest version of Emoji to list. Newer ones are left out, since a device that doesn't have them draws an empty box. |
| `skinTone` | `0 \| 1 \| 2 \| 3 \| 4 \| 5` |  | The skin tone, when you keep it. Use it with `onSkinToneChange`. |
| `defaultSkinTone` | `0 \| 1 \| 2 \| 3 \| 4 \| 5` | `0` | The skin tone to begin with, when it's kept here. |
| `onSkinToneChange` | `((tone: EmojiSkinTone) => void)` |  | Called when another skin tone is chosen. |
| `recent` | `string[]` |  | The emoji picked before, newest first, when you keep them. Use it with `onRecentChange`. An empty list shows none. |
| `onRecentChange` | `((recent: string[]) => void)` |  | Called with the new list when an emoji is picked. |
| `maxRecent` | `number` | `16` | How many picked emoji are remembered. |
| `storageKey` | `string \| null` | `"nuvui-emoji"` | The name the recent emoji and the skin tone are kept under in the browser's local storage. `null` keeps nothing there. |
| `flags` | `"auto" \| boolean` | `"auto"` | Whether flags are listed. `"auto"` lists them where the device draws them, which Windows doesn't. |
| `autoFocus` | `boolean` | `false` | Puts the caret in the search box when it's first drawn. |
| `labels` | `EmojiPickerLabels` |  | What's said and not drawn, and the headings, for another language. |

It's a `div`, and takes what a `div` takes, including `ref` and `className`.

## Translation

`labels` takes the picker's own words. The emoji's names come with `data`.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `search` | `string` |  | The name of the search box, and what's written in it while it's empty. |
| `list` | `string` |  | The name of the list of emoji. |
| `groups` | `string` |  | The name of the row of buttons that jump to a group. |
| `recent` | `string` |  | The heading over the ones picked before. |
| `results` | `string` |  | The heading over what a search found. |
| `group` | `Partial<Record<"activities" \| "animals" \| "flags" \| "food" \| "objects" \| "people" \| "smileys" \| "symbols" \| "travel", string>>` |  | The name of each group. |
| `skinTone` | `string` |  | The name of the control for the skin tone. |
| `skinTones` | `[string, string, string, string, string, string]` |  | The six tones, from none to dark. |
| `found` | `((count: number) => string)` |  | Said after a search, with how many it found. |
| `loading` | `string` |  | Shown and said while the list is on its way. |

## Accessibility

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Goes to the search box, the skin tone, the list, and each group's button. The list is one stop. |
| <kbd>↓</kbd> in the search box | Goes into the list. |
| <kbd>Enter</kbd> in the search box | Picks the first emoji found. |
| <kbd>←</kbd> <kbd>→</kbd> | In the list, the emoji before and after. |
| <kbd>↑</kbd> <kbd>↓</kbd> | The emoji in the row above and below. |
| <kbd>Home</kbd> <kbd>End</kbd> | The ends of the row. With <kbd>Ctrl</kbd>, the ends of the list. |
| <kbd>Page Up</kbd> <kbd>Page Down</kbd> | A screenful of rows. |
| <kbd>Enter</kbd> <kbd>Space</kbd> | Picks the emoji the keys are on. |

### What the component handles

- The list is a grid with a name. It holds the focus and says which emoji the keys are on, so only the rows in view have to be on the page. It says how many rows and columns there are in all.
- Each emoji is read by its name, "waving hand", and not as the character.
- A group's heading is a header in the grid, and its button is named by the group. The button of the group in view is marked as the current one.
- After a search, how many emoji were found is said. When none were, that's shown as well.
- The skin tones are a menu of six, one of them checked. The button says which.
- An emoji's square is 44 pixels on a touch screen, as are the buttons.
- Where text reads from the right, the left arrow goes on and the right one back.
- Where the browser forces its own colors, the emoji the keys are on has an edge.

### What you need to handle

- Name the popover or the dialog you put it in.
- Say what was picked where the emoji lands, if it isn't where the reader is: the picker says which emoji the keys are on, and not what your app did with it.
- Close the popover when an emoji is picked, or leave it open to pick several. Either is right for something.

## On small screens

The picker is never wider than the room it's given, and the emoji in a row fill it. On a phone a [sheet](../components/sheet.md) from the bottom holds it better than a popover does: set `--nuv-emoji-picker-width` to `100%` there.

The search box is 16 pixels on a touch screen, so iOS doesn't zoom the page when it's tapped.

## CSS variables

Set any of these on an `EmojiPicker`, or on anything around it.

```css
.composer {
  --nuv-emoji-picker-width: 22rem;
  --nuv-emoji-picker-height: 20rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-emoji-picker-width` | `20rem` | Width of the panel. It's never wider than the room it's given. |
| `--nuv-emoji-picker-height` | `24rem` | Height of the panel. The list scrolls in it. |
| `--nuv-emoji-picker-border` | `var(--color-border)` | Color of the panel's border. |
| `--nuv-emoji-picker-radius` | `var(--radius-lg)` | Corner radius of the panel. |
| `--nuv-emoji-picker-bg` | `var(--color-surface)` | Background of the panel. |
| `--nuv-emoji-picker-fg` | `var(--color-surface-foreground)` | Color of the text. |
| `--nuv-emoji-picker-cell` | `2.75rem`, `2.25rem` | Size of an emoji's square, and of the buttons. 2.25rem with a mouse and 2.75rem on a touch screen. Set it for both if you set it. |
| `--nuv-emoji-picker-font` | `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif` | The fonts the emoji are drawn in. The device's emoji fonts by default. |
| `--nuv-emoji-picker-hover-bg` | `var(--color-muted)` | Background of an emoji or a button under the pointer, and of the emoji the keys are on. |
| `--nuv-emoji-picker-heading-height` | `2rem` | Height of a group's heading. |
| `--nuv-emoji-picker-heading-fg` | `var(--color-muted-foreground)` | Color of the headings and of the words shown when nothing is found. Keep it at 4.5:1 against the panel. |
| `--nuv-emoji-picker-emoji-size` | `1.375rem` | Size of the emoji in its square. |
| `--nuv-emoji-picker-current-bg` | `var(--color-muted)` | Background of the button of the group in view. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-emoji-picker` | EmojiPicker |
| `.nuv-emoji-picker__body` | What holds the list. |
| `.nuv-emoji-picker__emoji` | An emoji. |
| `.nuv-emoji-picker__group` | A group's button. |
| `.nuv-emoji-picker__groups` | The row of group buttons. |
| `.nuv-emoji-picker__hand` | The hand in each choice of tone. |
| `.nuv-emoji-picker__head` | The search box and the skin tone. |
| `.nuv-emoji-picker__heading` | A group's heading. |
| `.nuv-emoji-picker__note` | The words shown while the list is on its way, and when nothing is found. |
| `.nuv-emoji-picker__row` | A row that's in view. |
| `.nuv-emoji-picker__rows` | As tall as every row together. |
| `.nuv-emoji-picker__search` | The search box. |
| `.nuv-emoji-picker__sizer` | Never seen. The component reads the sizes from it. |
| `.nuv-emoji-picker__status` | What's said after a search. Not drawn. |
| `.nuv-emoji-picker__tone` | The button for the skin tone. |
| `.nuv-emoji-picker__viewport` | The list, which is what scrolls. |

The emoji the keys are on has a `data-active` attribute, and the panel has `data-loading` while the list is on its way.

## Server components

EmojiPicker starts with `"use client"`, and `onEmojiSelect` is a function, so the component that renders it has to be a client component too. On a server the panel is drawn with its search box and no emoji: the list, what the browser remembers and the room there is are all known only in a browser.

## Do and don't

**Do**

- Put it where the emoji goes: beside the field, under the message.
- Keep the recent ones with the account when people use more than one device.

**Don't**

- Don't raise `emojiVersion` past what the people who read the text can see. An emoji the reader's device doesn't have is a box to them, whoever picked it.
- Don't use an emoji as the only way to say something that matters. It's read as its name, and the name may not be what you meant.
