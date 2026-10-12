"use client";

import { RichTextEditor } from "@nuvui/editor";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Summary"
        maxLength={140}
        placeholder="A summary in 140 characters"
        defaultValue="<p>Two invoices are overdue.</p>"
      />
    </div>
  );
}
