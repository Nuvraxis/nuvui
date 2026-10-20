---
"@nuvui/react": minor
---

Two new components.

- `ScrollProgress` is a bar that fills as the page, or a box given as `target`, is scrolled. It follows scrolling down the page or along the line, in a right-to-left box too, and stands up with `orientation="vertical"`. It's hidden from screen readers, moves with a transform so a scroll renders nothing in React, and follows the scroll exactly for less motion.
- `PinnedList` is a list in two groups, pinned at the top and the rest under it. Each `PinnedListItem` has a pin, a toggle button, and pressing it slides the item to the other group while the others make room. Both groups keep the order of `items`. The focus stays on the pin as its item moves, a status region says what was pinned, and every piece of text is a prop. It keeps what's pinned itself, from `defaultPinned`, or you do, with `pinned` and `onPinnedChange`.
