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
