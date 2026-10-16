# @nuvui/editor

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
