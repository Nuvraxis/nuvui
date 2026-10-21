---
"@nuvui/chat": minor
---

`CodeBlock` can type its code out, with `typing`: a character at a time, with a cursor after the last one, over `typingDuration`, after `typingDelay`, and with `typingTrigger="view"` the first time it's scrolled into view. `onTyped` is called once all the code is there. The box has its full size from the start, and a screen reader and the copy button get the whole code. For less motion, and where the browser forces its own colors, the code is all there at once.
