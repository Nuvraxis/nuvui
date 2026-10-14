---
"@nuvui/editor": patch
---

`RichTextEditorContent` is no longer a stop for the Tab key of its own in Firefox. When the text is taller than `--nuv-rich-text-editor-max-height`, the box around it scrolls, and Firefox made that box a stop with no name, before the text. The text is the stop, as in other browsers. A read-only editor keeps the box as a stop, since its text takes no focus and the keys that scroll it need somewhere to be.
