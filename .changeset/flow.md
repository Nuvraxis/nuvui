---
"@nuvui/flow": minor
---

A new package, for flow diagrams.

- `Flow` draws shapes joined by arrows, as one SVG, in a frame that pans and zooms. A node is a `box`, a `rounded` box, a `circle`, a `diamond` for a decision or a `pill` for a start or an end, in one of five colors, with words that wrap inside it. An edge is `straight`, `curved` or a `step` at right angles, with arrowheads, words on the line, a dashed line, or one that moves.
- With `editable`, nodes are dragged, onto a grid if you like, joined by dragging from a handle, and removed, with a pointer or the keyboard. `onNodesChange` and `onEdgesChange` are called once per change, a drag when it ends. Kept by you, a change you don't take is undone. `canConnect` decides which links may be made.
- The diagram is a listbox for a screen reader. The arrow keys go to the nearest node that way, and each node is named for its label, what its shape means and where it leads. A button shows the same diagram as a list of steps.
- Only what's in view is drawn. From far out, or with too many nodes in view to draw one by one, the diagram is a few paths, one for each color. A pan or a zoom doesn't render React, and a moved node renders itself and its edges and nothing else.
- Every position is an SVG attribute, so a server sends the diagram whole, and a Content Security Policy without `style-src-attr 'unsafe-inline'` changes nothing.
- It has no dependencies of its own.
