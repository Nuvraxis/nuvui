# @nuvui/editor

Editors for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react): a rich text editor on Tiptap, and a code editor and a diff editor on CodeMirror.

This is early: the package is on npm as a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/editor @nuvui/react
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/editor/styles.css";
import { RichTextEditor } from "@nuvui/editor";
import { useState } from "react";

export function Notes() {
  const [html, setHtml] = useState("");

  return (
    <RichTextEditor
      aria-label="Notes"
      placeholder="Write a note"
      value={html}
      onValueChange={setHtml}
    />
  );
}
```

## The code editors

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/editor/styles.css";
import { CodeEditor, DiffEditor } from "@nuvui/editor/code";

<CodeEditor aria-label="Query" language="sql" value={query} onValueChange={setQuery} />

<DiffEditor aria-label="Changes to shipping.ts" original={before} defaultModified={after} language="typescript" />
```

They're imported from `@nuvui/editor/code`, so a screen with only the rich text editor doesn't load CodeMirror.

## What's in it

- `RichTextEditor`: a box to write formatted text in. Bold, italic, underline, strikethrough and code, headings, bulleted and numbered lists, quotes, blocks of code, dividers and links.
- `RichTextEditorToolbar`, `RichTextEditorFormats`, `RichTextEditorActions` and `RichTextEditorLink`: the toolbar and what goes in it, for a toolbar of your own choosing.
- `RichTextEditorContent`, `RichTextEditorBubbleMenu` and `RichTextEditorCount`: the text, the small toolbar over selected text, and the count.
- `CodeEditor`: a box to write code in, colored as `CodeBlock` colors code, with line numbers, folding, search, completion, problems marked in the code, a `format` you give, and a file's own undo history, selection and scroll when it's one of a set. Its parts are `CodeEditorToolbar`, `CodeEditorContent` and `CodeEditorStatus`.
- `DiffEditor`: two texts and what changed between them, side by side or in one column, with unchanged lines folded away, a way to move between changes, and each change kept or undone. Its parts are `DiffEditorToolbar`, `DiffEditorContent` and `DiffEditorStatus`.

## How it behaves

Its value is a string of HTML, and nothing written is the empty string. `onValueChange` gives the HTML and, beside it, the same text as data, as plain words, and its counts. With a `name`, the HTML is sent with the form the editor is in.

The toolbar is one stop for the Tab key, and the arrow keys move along it. Every control has a name, and a toggle says whether it's on. The usual shortcuts work, and so does typing `## `, `- ` or `> ` at the start of a line.

`maxLength` stops typing and pasting at a number of characters, and shows a count. `readOnly` shows text that can't be changed, which is also a safe way to show saved text.

The editor writes only the elements it knows, and a link can't have an address that runs something. That's what it writes: what reaches your server can be written by hand, so sanitize HTML on the server before showing it anywhere without the editor.

It's about 120 kB compressed, nearly all of it the editing engine. The code editor is about 120 kB and the diff editor about 95, nearly all of them CodeMirror, and each language is fetched on its own the first time it's used. Load each with the screen that has one.

The code editors are drawn by CodeMirror, which adds its styles to the page as it runs. On a page with a strict content security policy, give them the policy's nonce with `nonce`.

## Dependencies

`@nuvui/react` is a peer dependency: the toolbar, the box for a link and its field are the core's.

The rich text is edited by [Tiptap](https://tiptap.dev), on ProseMirror, and code by [CodeMirror](https://codemirror.net). Their packages are MIT and are ordinary dependencies. The rich text editor's props don't use Tiptap's types. The code editors take CodeMirror's own extensions and language supports, for anything they don't do themselves.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install them.

The docs are at https://nuvui.nuvraxis.com/docs/editor.

## License

MIT
