---
"@nuvui/react": minor
---

`Compare`: two pictures of the same thing, before and after, in one box.

- With `mode="slider"`, the default, a divider shows before on one side and after on the other. It moves only when it's dragged, by its handle or by its line, so a drag anywhere else on the picture scrolls the page. The divider is a slider for screen readers and the keyboard, `position` says how much of before shows, and `orientation="vertical"` puts before on top.
- With `mode="toggle"`, one picture shows at a time, with a switch under it. The one it hides is hidden from screen readers and can't take focus.
- The names on the picture, "Before" and "After", and what a screen reader says can be translated. On a right-to-left page, before is on the right.
- The position is a `style` attribute in the page from the server. Under a Content Security Policy without `style-src-attr 'unsafe-inline'`, the divider is in the middle until the page's script runs.
