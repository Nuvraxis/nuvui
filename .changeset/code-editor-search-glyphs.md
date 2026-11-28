---
"@nuvui/editor": patch
---

The letters on buttons are drawn by the stylesheet, so a button shows no words that its name leaves out. axe-core 4.14 checks for that by default, as WCAG's label in name. They look the same.

- `CodeEditor`'s search options, Aa, ab and .*, from `data-glyph` on a new `nuv-code-editor__glyph` span.
- `RichTextEditor`'s formats known by a letter, B, I, U, S and the headings, from `data-letter` on `nuv-rich-text-editor__glyph`.
