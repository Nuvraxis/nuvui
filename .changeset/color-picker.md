---
"@nuvui/react": minor
---

A new component.

- `ColorPicker` picks a color, as `#rrggbb`. It's built from parts: a trigger that opens a popover, an area and a hue slider to pick with, a field to type into, and presets. Use all of them, or only a row of presets, or put the panel in the page with no popover. `onValueChange` follows a drag and `onValueCommit` is called once it ends, which is the place to save from. With `name` the color goes into a form. `parseHex`, `hexToHsv` and `hsvToHex` are exported for working with a color yourself.
