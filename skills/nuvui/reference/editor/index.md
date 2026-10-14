<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/editor/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Editor

The @nuvui/editor package. A rich text editor on Tiptap, installed next to @nuvui/react, with a toolbar, a menu on the selection, links, a character count, and HTML as its value.

The rich text editor is a package of its own, `@nuvui/editor`, since editing formatted text needs an engine the core doesn't have:

| Component | What it is |
| --- | --- |
| [RichTextEditor](rich-text-editor.md) | A box to write formatted text in: bold and italic, headings, lists, quotes, code and links, with a toolbar over it and a small one that comes up over selected text. |

```tsx
"use client";

import { RichTextEditor } from "@nuvui/editor";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Note to the customer"
        placeholder="Write a note. Select some text to format it."
        defaultValue="<p>Thanks for your order. It ships on <strong>Monday</strong>.</p>"
      />
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/editor @nuvui/react
```

`@nuvui/react` is a peer dependency: the toolbar is the core's [Toolbar](../components/toolbar.md), and the box for a link is its Popover, Input and Button.

The editing is done by [Tiptap](https://tiptap.dev), which is built on ProseMirror. Its packages are MIT licensed and are installed with this one. You don't import them yourself.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/editor/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The editor's styles are also on their own, at `@nuvui/editor/css/rich-text-editor.css`. With that one, load `toolbar.css`, `popover.css`, `input.css` and `button.css` from `@nuvui/react/css/` as well.

Tiptap would otherwise add a few rules of its own in a `style` element it makes at run time. That's turned off, and the rules are in this stylesheet, so a page with a strict content security policy needs no exception for it.

## It's large, so load it when it's needed

The editor is about 120 kB compressed, nearly all of it ProseMirror. Most screens of an app don't have one. Load it with the screen that does:

```tsx
import { lazy, Suspense } from "react";

const RichTextEditor = lazy(() =>
  import("@nuvui/editor").then((module) => ({
    default: module.RichTextEditor,
  })),
);

<Suspense fallback={<Skeleton style={{ blockSize: "12rem" }} />}>
  <RichTextEditor aria-label="Notes" />
</Suspense>;
```

In Next.js, `next/dynamic` does the same.

## The value is HTML

`value` is a string of HTML, and `onValueChange` is called with one. It's kept the way any field's value is, shown again on any page without the editor, and sent in an email. Nothing written is the empty string.

Beside the HTML, `onValueChange` gives the same text as data, as plain words, and its counts. [RichTextEditor](rich-text-editor.md#the-value) has the details.

## Sanitize before you show it

The editor only writes the elements it knows: paragraphs, headings, lists, quotes, code, links, and the marks for bold and the like. A link's address is the web, email, a phone number or a place on your site, and nothing that runs. What's pasted in goes through the same rules.

That's what the editor writes. What reaches your server is whatever was sent to it, which someone can write by hand. So before HTML from a database is put in a page, pass it through a sanitizer such as [DOMPurify](https://github.com/cure53/DOMPurify) or [sanitize-html](https://github.com/apostrophecms/sanitize-html), on the server, with a list of the elements above. Or show it with the editor itself, [read only](rich-text-editor.md#read-only), which reads HTML through the same rules it writes with.

## What it leaves out

- **Tiptap extensions of your own.** The engine isn't part of what the component takes or gives, so that it can be changed without changing your code. A mention, a table or an image that uploads isn't built.
- **Images, tables, text color and alignment.**
- **Markdown as the value.** Underline, and anything that's added later, has no markdown to be written as.
- **Several people writing at once.**
- **Uploading.** Nothing is uploaded, so nothing is pasted as a file.
