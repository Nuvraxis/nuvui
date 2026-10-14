# @nuvui/emoji

## 0.1.0

### Minor Changes

- [#62](https://github.com/Nuvraxis/nuvui/pull/62) [`679eae4`](https://github.com/Nuvraxis/nuvui/commit/679eae458b8565660a5bfbc31a9c1f1bd8d64db8) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for picking an emoji.
  
  - `EmojiPicker`, a panel with a search box, the emoji in their groups, a row of buttons that jump to a group, a choice of skin tone, and the ones picked before. `onEmojiSelect` is called with the emoji as text.
  - It draws the device's own emoji, as text. There's no artwork to load or to license. `emojiVersion` says how new an emoji may be to be listed, 15 by default, and flags are left out where the device doesn't draw them.
  - Only the rows in view are drawn. The list is a grid with one stop for the Tab key: the arrow keys, Home, End and the page keys move over it, Enter picks, and each emoji is read by its name.
  - A search looks in each emoji's name and the other words it's found by, and says how many it found. Enter in the search box picks the first.
  - The skin tone and the last sixteen emoji picked are remembered in the browser's local storage, under `storageKey`. `skinTone` and `recent`, with their change handlers, are for keeping them yourself.
  - `data` takes a list of your own, for another language or for fewer emoji, and `labels` the picker's own words.
  - The list it comes with is loaded when a picker is first drawn. It's written from emojibase-data, which is MIT, and nothing is installed with the package but the package.
  - `EmojiReaction`, a button with an emoji and how many reacted with it, for the row of reactions under a message. `pressed` says the reader is one of them, and `onPressedChange` is called when it's pressed. The count is yours. It's read by the emoji's name and the count, and it comes without the picker from `@nuvui/emoji/emoji-reaction`.
  - `@nuvui/react` is a peer dependency.
