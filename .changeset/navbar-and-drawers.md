---
"@nuvui/react": minor
---

A new component, and additions to two.

- `Navbar`, with `NavbarBrand`, `NavbarNav`, `NavbarLink`, `NavbarActions` and `NavbarMenu`, is the bar across the top of a site or an app. Its links are in the bar on a wide screen and in a panel behind a button on a narrow one, at a breakpoint you choose. It can stay at the top, and can slide out of the way while the page scrolls down.
- `Sheet` can be swiped away. `swipe` on `SheetContent` lets a finger drag it towards its edge, and `stops` gives it sizes to rest at on the way, with `stop`, `defaultStop` and `onStopChange` to control which. `SheetHandle` is a new part: the bar a sheet is dragged by, which goes to the next stop when pressed.
- `SelectTrigger` has a `variant`. `"inline"` is a select with no box that sits in a sentence, at the size of the text around it.
