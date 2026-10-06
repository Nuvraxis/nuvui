---
"@nuvui/react": minor
---

Toast shows three toasts at a time and holds the rest back until one closes. `Toaster` has a `limit` prop to change the number.

Dialog has two new parts, `DialogHeader` and `DialogBody`. With a body, the title and the buttons stay in view while the content scrolls.

Popover can draw an arrow that points at its trigger, with `showArrow`. Its content now sits inside a `nuv-popover__body` element, which has the padding and does the scrolling.

A dialog body or a popover that scrolls, and has nothing inside that takes focus, becomes a tab stop so it can be scrolled from the keyboard.
