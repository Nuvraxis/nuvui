---
"@nuvui/editor": patch
---

The letters on `CodeEditor`'s search options, Aa, ab and .*, are drawn by the stylesheet, from `data-glyph` on a `nuv-code-editor__glyph` span, so the buttons show no words that their names leave out. axe-core 4.14 checks for that by default, as WCAG's label in name. They look the same.
