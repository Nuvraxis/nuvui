"use client";

import {
  RichTextEditor,
  RichTextEditorBubbleMenu,
  RichTextEditorContent,
} from "@nuvui/editor";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Release note"
        defaultValue="<p>Select a few of these words to format them.</p>"
      >
        <RichTextEditorContent />
        <RichTextEditorBubbleMenu />
      </RichTextEditor>
    </div>
  );
}
