---
"@nuvui/react": minor
---

A new component, `HoloCard`: a 3D tilting card with a pointer-tracked holographic glare and texture overlay, built for membership cards, passes, and collectibles.

- A mouse or a pen moves it. A finger doesn't, and neither does the keyboard. It lies flat for anyone who asked for less motion, and has no shine where the browser forces its own colors.
- What's in it is ordinary content. The glare and the texture are hidden from screen readers and let presses through.
- What's on the card rises off its face under the pointer and floats over it as the card tilts. The face's color is the card's, with `--nuv-holo-card-bg`, and the glare and the texture are on the face, under the content.
- `shine={false}` leaves the glare out, `texture={false}` leaves the embossed texture out, `lift={false}` keeps the content on the face, and `disabled` keeps it flat.
- The tilt, the corners, the depth, the speed and the shine's colors are CSS variables. The shine's band is made of the theme's own colors.
