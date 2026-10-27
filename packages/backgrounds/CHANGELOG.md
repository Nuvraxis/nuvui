# @nuvui/backgrounds

## 0.1.1

### Patch Changes

- Updated dependencies [[`cd1b218`](https://github.com/Nuvraxis/nuvui/commit/cd1b218dc5bc36f69e00b2deed7c6a7bb05abfe6)]:
  - @nuvui/react@0.9.0

## 0.1.0

### Minor Changes

- [#89](https://github.com/Nuvraxis/nuvui/pull/89) [`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for moving backgrounds to lay a headline, a form or an empty state on.
  
  - `GradientBackground` is soft fields of the theme's colors that drift slowly. It's drawn in CSS alone, so it works in a server component and needs no script.
  - `GridBackground` is lines, or dots with `variant="dots"`, that fade out toward the edges, and light up in the accent color under the pointer or a finger.
  - `StarsBackground` is a starfield drifting the way the page reads, the nearer stars larger and faster, leaning away from the pointer.
  - `TopographyBackground` is contour lines of a land that shifts slowly. The pointer raises a hill, and a press sends a wave across.
  - `HexagonBackground` is a grid of hexagons that light up under the pointer and fade after it.
  - `FireworksBackground` is rockets that burst into sparks in the theme's chart colors. A press bursts one where it lands.
  - `HoleBackground` is a tunnel of rings with motes rising through it. Its far end leans toward the pointer, and a press speeds it up.
  - `GlyphBackground` is a field of characters lit by wandering glows, with a trail behind the pointer and a ring of light from a press. `glyphs` sets the characters.
  - Each takes its content as children, and `scrim` lays its own color over what it draws: with `strong`, body text reads at 4.5:1 or more over any part of it. Colors are CSS variables that default to the theme's.
  - Those that move take `paused`, and those on a canvas `speed`, `density` and `interactive`. For anyone who asked for less motion, each is a finished frame that holds still. Where the browser forces its colors, nothing is drawn. Each stops while it's out of view and while the tab is hidden, and every background on a page shares one animation frame.
  - Nothing needs a `style` attribute, so a strict Content Security Policy changes nothing.
  - It has no dependencies.

### Patch Changes

- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0
