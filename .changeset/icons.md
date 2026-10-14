---
"@nuvui/icons": minor
---

The first release of `@nuvui/icons`: 317 line icons drawn for nuvui, on a 24 pixel grid, in three styles. `@nuvui/icons` is the Standard style, and `@nuvui/icons/rounded` and `@nuvui/icons/sharp` have the same icons by the same names in the other two.

Each icon is a React component named for what it shows with `Icon` at the end, such as `ArrowRightIcon`. It's drawn in the color of the text around it, is 24 pixels unless `size` says otherwise, and is hidden from screen readers unless it has a `title` or an `aria-label`. Icons have no state and no `"use client"`, so a server component renders them as markup. Each is a module of its own, so a bundler leaves out the ones a page doesn't import.

`createIcon` makes an icon of your own that's drawn the same way. Every icon also ships as an SVG file, under `@nuvui/icons/svg/`, and `@nuvui/icons/manifest.json` lists them all. The package needs only React.
