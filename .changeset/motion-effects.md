---
"@nuvui/react": minor
---

Three motion effects: `AnimatedNumber`, `TextReveal` and `burstConfetti`. Each is still, or isn't run at all, for anyone who asked for less motion.

- `AnimatedNumber` moves to its new value when the value changes. With `animation="roll"` each digit that changes turns through the digits between, like a counter. With `animation="pop"` the old digit rises out as the new one rises into focus. It takes `FormattedNumber`'s props, rolls through a language's own digits, and is read by a screen reader as one number. The page from the server has the number written out.
- `TextReveal` takes `lines`, which rise into place one after another, when the page is drawn or, with `trigger="view"`, the first time they're scrolled into view. The text is in the page from the server, and only hidden by the rise itself or once the script knows it's out of view.
- `burstConfetti(element, options)` throws confetti up from an element, on a canvas over the page that's hidden from screen readers and lets presses through. The pieces take the theme's chart colors, or `colors` of your own. It returns a promise that settles when the last piece is gone.
- `TextReveal` sets which line is which in a `style` attribute. Under a Content Security Policy without `style-src-attr 'unsafe-inline'`, its lines rise together.
