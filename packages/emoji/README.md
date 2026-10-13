# @nuvui/emoji

An emoji picker for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react): a search box, the emoji in their groups, a choice of skin tone, and the ones picked before.

This package isn't released yet. The [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/emoji @nuvui/react
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/emoji/styles.css";
import { EmojiPicker } from "@nuvui/emoji";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";

export function AddEmoji({ onAdd }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Add an emoji</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Pick an emoji">
        <EmojiPicker autoFocus onEmojiSelect={(emoji) => onAdd(emoji)} />
      </PopoverContent>
    </Popover>
  );
}
```

## What's in it

- `EmojiPicker`: the panel. It's given `onEmojiSelect`, which is called with the emoji as text.
- It draws the device's own emoji, as text. So they look as they do everywhere else on that device, there's no artwork to load or to license, and an emoji a device doesn't have isn't one it can draw. `emojiVersion` says how new an emoji may be to be listed, and flags are left out where the device doesn't draw them, which Windows doesn't.
- Only the rows in view are drawn, so nineteen hundred emoji are a few dozen elements.
- The list is a grid with one stop for the Tab key. The arrow keys move over it, Enter picks, and each emoji is read by its name.
- A skin tone that's chosen is drawn on every emoji that has one, and remembered. So are the last sixteen emoji picked. Both are kept in the browser's local storage unless you keep them yourself.
- The names and the words emoji are found by are English. `data` takes a list of your own, and `labels` the picker's own words.

The list of emoji is loaded when a picker is first drawn, and is about 33 kB compressed. The picker without it is about 4 kB.

## Where the list comes from

The list is written from [emojibase-data](https://github.com/milesj/emojibase), which is MIT, by Miles Johnson, and takes the names and the keywords from Unicode's CLDR. `pnpm --filter @nuvui/emoji generate` writes it again.

The docs are at [nuvui.nuvraxis.com/docs/emoji](https://nuvui.nuvraxis.com/docs/emoji).

## License

MIT
