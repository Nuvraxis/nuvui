---
"@nuvui/react": minor
---

Four new components.

- `ActionBar`, with `ActionBarSelection`, is a bar that appears while something is selected, with your buttons for what can be done to it. It can be fixed to the bottom of the window, stuck to the bottom of what scrolls, or left in place, and it tells a screen reader how much is selected.
- `HoldToConfirm` is a button that acts only after it's been held down, with the wait drawn across it. Holding Space or Enter works too, and a screen reader or a switch confirms with a second press.
- `TableOfContents` is the headings of a page as a list of links, with the one being read marked as the page scrolls.
- `TextShimmer` is text with a highlight that moves across it, for a short wait. It's still for anyone who asked for less motion.

`Rating` now takes the up and down arrow keys as well as left and right, as its page said it did. `NumberField` submits the number that was just typed when Enter is pressed in Firefox, where it had sent the one before.
