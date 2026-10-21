---
"@nuvui/map": patch
---

A map that was moved before React had drawn it with its `center` and `zoom` is no longer moved back to them. An app that keeps the view from `onMove` could see the map jump back to where it started, when it was moved as soon as it loaded.
