---
"@nuvui/editor": minor
---

`CodeEditor` and `DiffEditor` are new, on CodeMirror, at `@nuvui/editor/code`. They aren't in the package's main entry, so importing the rich text editor doesn't bring CodeMirror with it. Each also has an entry of its own, `@nuvui/editor/code-editor` and `@nuvui/editor/diff-editor`, with its styles at `css/code-editor.css` and `css/diff-editor.css`.

`CodeEditor` is a box to write code in. Its code is colored as `CodeBlock` colors it, through the same variables, and a language is fetched by its name the first time it's used. It has line numbers, folding, wrapping, search and replace in a panel of the core's own fields, completion where the language has it, and problems given as `diagnostics`, underlined in the code and marked in the gutter by a word, an icon and a shape. `format` takes a formatter of yours, from the toolbar and from Shift-Alt-F. With a `path` for each file of a set, one editor keeps each file's undo history, selection and scroll. Tab indents, and Escape then Tab leaves, which a screen reader is told; `tabBehavior="focus"` makes Tab leave at once. On a server, the code is drawn in a `<pre>` at the editor's height.

`DiffEditor` shows two texts and what changed between them, side by side or in one column, and in one column by itself in a box narrower than `minSplitWidth`. Unchanged lines are folded away. The toolbar and Alt with the arrow keys move between changes, and a screen reader is told which. With `editable`, each change can be kept or undone beside it, from the keyboard as well as the mouse, and `onModifiedChange` and `onOriginalChange` say what's left. A change is drawn with + and −, and said as added or removed, as well as by its color.

Both take a `nonce` for the styles CodeMirror adds as it runs, and `labels` for every word they say, which also go into CodeMirror's own `phrases`.
