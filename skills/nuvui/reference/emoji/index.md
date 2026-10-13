<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/emoji/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Emoji

The @nuvui/emoji package. An emoji picker with search, groups, skin tones and recently used emoji, in a list that draws only the rows in view, and a reaction button with a count, installed next to @nuvui/react.

Picking an emoji is a package of its own, `@nuvui/emoji`, since it comes with a list of nineteen hundred emoji that an app with no picker shouldn't carry:

| Component | What it is |
| --- | --- |
| [EmojiPicker](emoji-picker.md) | A panel with a search box, the emoji in their groups, a choice of skin tone, and the ones picked before. |
| [EmojiReaction](emoji-reaction.md) | A button with an emoji and how many reacted with it, pressed when the reader is one of them. |

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

`@nuvui/react` is a peer dependency: the picker is drawn with the core's tokens, and its search box and its menu of skin tones are the core's. Nothing else is installed with it.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/emoji/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The picker's styles are also on their own, at `@nuvui/emoji/css/emoji-picker.css`.

## The device's own emoji

The picker draws emoji as text, in the device's own emoji font. So they look as they do everywhere else on that device: in the message the emoji is put into, in a notification, in another app. There's no artwork to load and none to license.

What that costs:

- **They look different from one device to the next.** An emoji picked on a phone is the same character on a laptop, drawn by the laptop.
- **A device only draws the emoji it has.** One that's newer than the device is an empty box there. So the picker lists emoji up to a version, 15 unless you say otherwise with `emojiVersion`, which is from 2022 and is on what people use now.
- **Windows draws no flags.** It draws a flag's two letters. So flags are left out where the device doesn't draw them. `flags` says otherwise.

To draw emoji the same everywhere takes a set of pictures, which this package doesn't have.

## The list, and its size

The list of emoji, with their names and the words they're found by, is loaded the first time a picker is drawn, and not before. It's about 33 kB compressed. The picker itself is about 4 kB. A reaction button needs no list, and a page with reactions and no picker loads none.

The names are English. For another language, or for fewer emoji, give the picker a list of your own with `data`. [EmojiPicker](emoji-picker.md#a-list-of-your-own) shows one.

The list is written from [emojibase-data](https://github.com/milesj/emojibase), which is MIT and takes the names and the keywords from Unicode's CLDR. It has the emoji of Emoji 17.

## What it leaves out

- **Pictures of emoji.** See above.
- **A button that opens it.** It's a panel. Put it in a [popover](../components/popover.md), a [sheet](../components/sheet.md), or on the page.
- **Putting the emoji in your text.** It hands you the emoji. Where it goes, at the caret of a field or at the end of a message, is yours.
- **Who reacted.** A reaction shows a count. The names behind it, in a tooltip or a list, are yours.
- **Shortcodes,** such as `:smile:`.
