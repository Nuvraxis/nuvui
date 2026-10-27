---
"@nuvui/react": minor
---

`ImageZoom`: a picture that's drawn larger where it's pointed at, inside its own box.

- A mouse zooms in while it rests on the picture, and what's in view follows it. A click zooms out, and in again. With `hover={false}`, only a click zooms, and the picture stays zoomed in until the next one.
- A tap zooms in where the finger is, and a drag then moves around the picture. Until it's zoomed in, a finger on the picture scrolls the page.
- A toggle button in the corner does the same from the keyboard: Enter or Space zooms in and out, the arrow keys move what's in view, and Escape zooms out. Its name, "Zoom", can be translated with `zoomLabel`.
- `scale` says how much larger it's drawn, twice by default. `zoomed`, `defaultZoomed` and `onZoomedChange` control it from outside, and `disabled` turns it off.
- For a visitor who asked for less motion, it zooms at once, without growing.
