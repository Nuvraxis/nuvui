# @nuvui/icons

317 line icons drawn for [nuvui](https://nuvui.nuvraxis.com), on a 24 pixel grid, in three styles. Each is a React component and an SVG file.

This is early: the package is on npm as a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does.

```sh
pnpm add @nuvui/icons
```

```tsx
import { ArrowRightIcon } from "@nuvui/icons";

export function Next() {
  return (
    <a href="/next">
      Next <ArrowRightIcon size={16} />
    </a>
  );
}
```

It needs React 18.2 or newer and nothing else: no stylesheet, and not `@nuvui/react`.

## Three styles

| Style | Import from | How it's drawn |
| --- | --- | --- |
| Standard | `@nuvui/icons` | Round ends, sharp corners. |
| Rounded | `@nuvui/icons/rounded` | Round ends and rounded corners. |
| Sharp | `@nuvui/icons/sharp` | Square ends and mitered corners. |

The three have the same icons by the same names.

## How an icon behaves

- **Its name** is the icon's name in the set with `Icon` at the end: `arrow-right` is `ArrowRightIcon`. That's its only name.
- **Its color** is the text's around it (`currentColor`). No color is written into an icon.
- **Its size** is 24 pixels unless `size` says otherwise. The line is 1.5 units on the 24 unit grid, and `strokeWidth` changes it.
- **For screen readers** it's hidden, unless it has a `title` or an `aria-label`, which names it as a picture.
- **In a server component** it renders as markup. It has no state and no `"use client"`.
- **In a bundle** only the icons a page imports are kept. Each is a module of its own.

`createIcon` makes an icon of your own that's drawn the same way. Every icon is also an SVG file, such as `@nuvui/icons/svg/standard/arrow-right.svg`, and `@nuvui/icons/manifest.json` lists every icon with its category.

The [docs page](https://nuvui.nuvraxis.com/docs/icons) shows every icon, with a search.

## License

MIT, the code and the icons both. The icons were drawn for this library.
