---
"@nuvui/react": minor
---

Rows of a Tree can be moved.

- Give `Tree` an `onMove` and its rows can be dragged with a mouse, picked up with a finger held down for a moment, or walked up and down with Alt and an arrow key. The tree tells you what moved and where to, as a `TreeMove`: the rows' `values`, the `target` row, and `"before"`, `"after"` or `"inside"` it. You change your data to match. Without `onMove` nothing about the tree changes.
- `canDrop` says where rows may go, for a tree where only a folder holds things. A selected row takes every selected row with it. A drag held over a closed row opens it, a drag near the edge scrolls, and Escape puts the rows back.
- After a move, focus stays on the row and a screen reader is told where it went. `getMoveText` puts that in another language.
- With `onMove`, the tree draws a `status` element beside itself. If your styles count the tree's siblings, that's one more.
