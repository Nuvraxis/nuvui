# @nuvui/editor

## 0.2.0

### Minor Changes

- [#124](https://github.com/Nuvraxis/nuvui/pull/124) [`d5f228b`](https://github.com/Nuvraxis/nuvui/commit/d5f228b94cb17b3660e3e63b855bde15e2342335) Thanks [@sajanv88](https://github.com/sajanv88)! - `CodeEditor` and `DiffEditor` are new, on CodeMirror, at `@nuvui/editor/code`. They aren't in the package's main entry, so importing the rich text editor doesn't bring CodeMirror with it. Each also has an entry of its own, `@nuvui/editor/code-editor` and `@nuvui/editor/diff-editor`, with its styles at `css/code-editor.css` and `css/diff-editor.css`.
  
  `CodeEditor` is a box to write code in. Its code is colored as `CodeBlock` colors it, through the same variables, and a language is fetched by its name the first time it's used. It has line numbers, folding, wrapping, search and replace in a panel of the core's own fields, completion where the language has it, and problems given as `diagnostics`, underlined in the code and marked in the gutter by a word, an icon and a shape. `format` takes a formatter of yours, from the toolbar and from Shift-Alt-F. With a `path` for each file of a set, one editor keeps each file's undo history, selection and scroll. Tab indents, and Escape then Tab leaves, which a screen reader is told; `tabBehavior="focus"` makes Tab leave at once. On a server, the code is drawn in a `<pre>` at the editor's height.
  
  `DiffEditor` shows two texts and what changed between them, side by side or in one column, and in one column by itself in a box narrower than `minSplitWidth`. Unchanged lines are folded away. The toolbar and Alt with the arrow keys move between changes, and a screen reader is told which. With `editable`, each change can be kept or undone beside it, from the keyboard as well as the mouse, and `onModifiedChange` and `onOriginalChange` say what's left. A change is drawn with + and −, and said as added or removed, as well as by its color.
  
  Both take a `nonce` for the styles CodeMirror adds as it runs, and `labels` for every word they say, which also go into CodeMirror's own `phrases`.

## 0.1.6

### Patch Changes

- Updated dependencies [[`20f9c69`](https://github.com/Nuvraxis/nuvui/commit/20f9c696f944c91c1fd84fef58f5357f18bf46c0)]:
  - @nuvui/react@0.10.0

## 0.1.5

### Patch Changes

- Updated dependencies [[`cd1b218`](https://github.com/Nuvraxis/nuvui/commit/cd1b218dc5bc36f69e00b2deed7c6a7bb05abfe6)]:
  - @nuvui/react@0.9.0

## 0.1.4

### Patch Changes

- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d)]:
  - @nuvui/react@0.7.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c38570b5b1952dcadc34f90c39ae9fdc592)]:
  - @nuvui/react@0.6.0

## 0.1.1

### Patch Changes

- [#62](https://github.com/Nuvraxis/nuvui/pull/62) [`679eae4`](https://github.com/Nuvraxis/nuvui/commit/679eae458b8565660a5bfbc31a9c1f1bd8d64db8) Thanks [@sajanv88](https://github.com/sajanv88)! - `RichTextEditorContent` is no longer a stop for the Tab key of its own in Firefox. When the text is taller than `--nuv-rich-text-editor-max-height`, the box around it scrolls, and Firefox made that box a stop with no name, before the text. The text is the stop, as in other browsers. A read-only editor keeps the box as a stop, since its text takes no focus and the keys that scroll it need somewhere to be.

## 0.1.0

### Minor Changes

- [#55](https://github.com/Nuvraxis/nuvui/pull/55) [`38a0ca9`](https://github.com/Nuvraxis/nuvui/commit/38a0ca97ca75839071cf8f042028d9696c9ac3d2) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for a rich text editor on Tiptap.
  
  - `RichTextEditor`, a box to write formatted text in: bold, italic, underline, strikethrough and code, headings, bulleted and numbered lists, quotes, blocks of code, dividers and links.
  - Its value is a string of HTML, kept by you with `value` and `onValueChange` or by the editor with `defaultValue`. Nothing written is the empty string. `onValueChange` also gives the text as data, as plain words, and its counts. With a `name`, the HTML is sent with a form.
  - `RichTextEditorToolbar`, with `RichTextEditorFormats`, `RichTextEditorActions` and `RichTextEditorLink` for a toolbar of your own choosing, `RichTextEditorContent`, `RichTextEditorBubbleMenu` for a small toolbar over selected text, drawn when you add it, and `RichTextEditorCount`.
  - The toolbar is the core's, one stop for the Tab key with the arrow keys moving along it. Every control is named, and a toggle says whether it's on.
  - A link's address is the web, email, a phone number or a place on the same site. Anything that would run is refused, in the box for a link and in what's pasted or set.
  - `maxLength` stops typing and pasting at a number of characters and shows a count. `headingLevels` chooses the headings the text can have. `readOnly`, `disabled`, `placeholder` and `autoFocus` are what they are on a field.
  - `editorRef` gives `focus`, `clear`, `setHTML`, `insertText`, `getHTML`, `getText` and `getJSON`. `labels` takes every name in another language.
  - Tiptap's packages are installed with this one. `@nuvui/react` is a peer dependency. None of Tiptap's types are in the component's props.

### Patch Changes

- Updated dependencies [[`0fc08bc`](https://github.com/Nuvraxis/nuvui/commit/0fc08bc21adea0d24f54ef688a3575243d4694a3)]:
  - @nuvui/react@0.5.0
