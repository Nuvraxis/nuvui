# @nuvui/flow

## 0.1.2

### Patch Changes

- Updated dependencies [[`cd1b218`](https://github.com/Nuvraxis/nuvui/commit/cd1b218dc5bc36f69e00b2deed7c6a7bb05abfe6)]:
  - @nuvui/react@0.9.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0

## 0.1.0

### Minor Changes

- [#79](https://github.com/Nuvraxis/nuvui/pull/79) [`6eade34`](https://github.com/Nuvraxis/nuvui/commit/6eade340092a56957ed449f592baa40f64ba8eab) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for flow diagrams.
  
  - `Flow` draws shapes joined by arrows, as one SVG, in a frame that pans and zooms. A node is a `box`, a `rounded` box, a `circle`, a `diamond` for a decision or a `pill` for a start or an end, in one of five colors, with words that wrap inside it. An edge is `straight`, `curved` or a `step` at right angles, with arrowheads, words on the line, a dashed line, or one that moves.
  - With `editable`, nodes are dragged, onto a grid if you like, joined by dragging from a handle, and removed, with a pointer or the keyboard. `onNodesChange` and `onEdgesChange` are called once per change, a drag when it ends. Kept by you, a change you don't take is undone. `canConnect` decides which links may be made.
  - The diagram is a listbox for a screen reader. The arrow keys go to the nearest node that way, and each node is named for its label, what its shape means and where it leads. A button shows the same diagram as a list of steps.
  - Only what's in view is drawn. From far out, or with too many nodes in view to draw one by one, the diagram is a few paths, one for each color. A pan or a zoom doesn't render React, and a moved node renders itself and its edges and nothing else.
  - Every position is an SVG attribute, so a server sends the diagram whole, and a Content Security Policy without `style-src-attr 'unsafe-inline'` changes nothing.
  - It has no dependencies of its own.
