---
"@nuvui/react": minor
---

A new component, `HoloCard`: a card that tilts toward the pointer with a shine that follows it, for a membership card, a pass or a badge.

- A mouse or a pen moves it. A finger doesn't, and neither does the keyboard. It lies flat for anyone who asked for less motion, and has no shine where the browser forces its own colors.
- What's in it is ordinary content. The shine is hidden from screen readers and lets presses through.
- `shine={false}` leaves the shine out, and `disabled` keeps it flat.
- The tilt, the corners, the depth, the speed and the shine's colors are CSS variables. The shine's band is made of the theme's own colors.
