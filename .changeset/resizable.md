---
"@nuvui/react": minor
---

A new component.

- `Resizable`, with `ResizablePanel` and `ResizableHandle`, is panels with a handle between them to drag, side by side or one above another: a list beside what's chosen from it, an editor above its output. Panels have a least and a greatest size, can fold away, and can hold more panels lying the other way. A handle is moved with the arrow keys as well as a pointer, and what takes a finger is 44 pixels wide however thin the line. `useResizableLayout` keeps the sizes in the browser between visits, and works on a page drawn on a server.
- It's built on `react-resizable-panels`, which is now a dependency of `@nuvui/react`. Three things are added to what that does: a panel folded to nothing is out of reach of Tab, a panel that scrolls plain text can be scrolled from the keyboard, and the handles of a disabled `Resizable` say they're disabled.
