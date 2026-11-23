# @nuvui/icons

## 0.3.0

### Minor Changes

- [#130](https://github.com/Nuvraxis/nuvui/pull/130) [`f2ae87c`](https://github.com/Nuvraxis/nuvui/commit/f2ae87c36283a6d5b939bcd36b12b9f4b76bea26) Thanks [@sajanv88](https://github.com/sajanv88)! - `@nuvui/icons/file-types`: 24 icons for files by their extension, such as `TsFileIcon`, `JsonFileIcon` and `CppFileIcon`. Each is a page with the extension on a colored tag, on a 32 unit grid and 32 pixels unless `size` says otherwise. The page is drawn in the color of the text around it, and the tag keeps its own colors, which makes these the only icons in the package with colors written into them. They're hidden from screen readers unless they have a `title` or an `aria-label`, as the line icons are.
  
  The SVG files are under `@nuvui/icons/svg/file-types/`, and `manifest.json` lists them under `fileTypes`, with each one's extension, component and description.

## 0.2.0

### Minor Changes

- [#128](https://github.com/Nuvraxis/nuvui/pull/128) [`f9c9738`](https://github.com/Nuvraxis/nuvui/commit/f9c973852a650b30a6c754689f7cf707312ab4c9) Thanks [@sajanv88](https://github.com/sajanv88)! - 21 icons for a code editor or a developer tool, in a new IDE category, in all three styles: `FolderCodeIcon`, `RunIcon`, `DebugPauseIcon`, `DebugContinueIcon`, `DebugStopIcon`, `DebugRestartIcon`, `BreakpointIcon`, `DebugStepOverIcon`, `DebugStepIntoIcon`, `DebugStepOutIcon`, `ExtensionsIcon`, `SplitEditorIcon`, `PanelBottomIcon`, `CommandIcon`, `SymbolMethodIcon`, `FileTreeIcon`, `SearchCodeIcon`, `SnippetIcon`, `MinimapIcon`, `CallStackIcon` and `LivePreviewIcon`. That makes 338.
  
  Some of the SVG files are written differently, with lines that share a style in one `<path>`, as Figma now exports them. They draw the same.

## 0.1.0

### Minor Changes

- [#68](https://github.com/Nuvraxis/nuvui/pull/68) [`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c38570b5b1952dcadc34f90c39ae9fdc592) Thanks [@sajanv88](https://github.com/sajanv88)! - The first release of `@nuvui/icons`: 317 line icons drawn for nuvui, on a 24 pixel grid, in three styles. `@nuvui/icons` is the Standard style, and `@nuvui/icons/rounded` and `@nuvui/icons/sharp` have the same icons by the same names in the other two.
  
  Each icon is a React component named for what it shows with `Icon` at the end, such as `ArrowRightIcon`. It's drawn in the color of the text around it, is 24 pixels unless `size` says otherwise, and is hidden from screen readers unless it has a `title` or an `aria-label`. Icons have no state and no `"use client"`, so a server component renders them as markup. Each is a module of its own, so a bundler leaves out the ones a page doesn't import.
  
  `createIcon` makes an icon of your own that's drawn the same way. Every icon also ships as an SVG file, under `@nuvui/icons/svg/`, and `@nuvui/icons/manifest.json` lists them all. The package needs only React.
