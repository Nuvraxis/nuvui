# @nuvui/editor

A rich text editor for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react), on Tiptap.

This package isn't released yet. The [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

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

## What's in it

- `RichTextEditor`: a box to write formatted text in. Bold, italic, underline, strikethrough and code, headings, bulleted and numbered lists, quotes, blocks of code, dividers and links.
- `RichTextEditorToolbar`, `RichTextEditorFormats`, `RichTextEditorActions` and `RichTextEditorLink`: the toolbar and what goes in it, for a toolbar of your own choosing.
- `RichTextEditorContent`, `RichTextEditorBubbleMenu` and `RichTextEditorCount`: the text, the small toolbar over selected text, and the count.

## How it behaves

Its value is a string of HTML, and nothing written is the empty string. `onValueChange` gives the HTML and, beside it, the same text as data, as plain words, and its counts. With a `name`, the HTML is sent with the form the editor is in.

The toolbar is one stop for the Tab key, and the arrow keys move along it. Every control has a name, and a toggle says whether it's on. The usual shortcuts work, and so does typing `## `, `- ` or `> ` at the start of a line.

`maxLength` stops typing and pasting at a number of characters, and shows a count. `readOnly` shows text that can't be changed, which is also a safe way to show saved text.

The editor writes only the elements it knows, and a link can't have an address that runs something. That's what it writes: what reaches your server can be written by hand, so sanitize HTML on the server before showing it anywhere without the editor.

It's about 120 kB compressed, nearly all of it the editing engine. Load it with the screen that has one.

## Dependencies

`@nuvui/react` is a peer dependency: the toolbar, the box for a link and its field are the core's.

The editing is done by [Tiptap](https://tiptap.dev), on ProseMirror. Its packages are MIT and are ordinary dependencies. The component's props and what it gives back don't use Tiptap's types.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install them.

The docs are at https://nuvui.nuvraxis.com/docs/editor.

## License

MIT
