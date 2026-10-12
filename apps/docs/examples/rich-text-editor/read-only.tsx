"use client";

import { RichTextEditor, RichTextEditorContent } from "@nuvui/editor";

// What someone wrote, shown again. The editor reads the HTML through its
// own rules for what text can hold, so nothing in it can run.
const saved =
  '<h3>Late payments</h3><p>A reminder goes out on <strong>day 31</strong>.</p><ul><li><p>Late fees start at day 45.</p></li><li><p>Questions go to <a href="mailto:billing@example.com">billing@example.com</a>.</p></li></ul>';

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Payment terms, as saved"
        readOnly
        headingLevels={[3]}
        value={saved}
        style={{ "--nuv-rich-text-editor-min-height": "0" } as never}
      >
        <RichTextEditorContent />
      </RichTextEditor>
    </div>
  );
}
