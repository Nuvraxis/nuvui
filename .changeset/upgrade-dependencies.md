---
"@nuvui/react": patch
"@nuvui/editor": patch
"@nuvui/emoji": patch
---

Dependencies at their latest releases. `@nuvui/react` asks for the newest Radix primitives and react-resizable-panels, and `@nuvui/editor` the newest CodeMirror and Tiptap. `@nuvui/emoji`'s list is written from emojibase-data 18, which adds the emoji of Emoji 18 and updates some names and keywords. The picker still lists up to Emoji 15 unless `emojiVersion` says otherwise.

About 150 emoji that the list wrote with U+FE0F at the end, such as 👍 and ✅, are now written without it, as Unicode writes them. The picker's recent emoji count the two as one, as before. If you store the emoji people pick and compare them yourself, take U+FE0F off both before comparing.
