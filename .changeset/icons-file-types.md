---
"@nuvui/icons": minor
---

`@nuvui/icons/file-types`: 24 icons for files by their extension, such as `TsFileIcon`, `JsonFileIcon` and `CppFileIcon`. Each is a page with the extension on a colored tag, on a 32 unit grid and 32 pixels unless `size` says otherwise. The page is drawn in the color of the text around it, and the tag keeps its own colors, which makes these the only icons in the package with colors written into them. They're hidden from screen readers unless they have a `title` or an `aria-label`, as the line icons are.

The SVG files are under `@nuvui/icons/svg/file-types/`, and `manifest.json` lists them under `fileTypes`, with each one's extension, component and description.
