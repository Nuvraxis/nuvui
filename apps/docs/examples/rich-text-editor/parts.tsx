"use client";

import {
  RichTextEditor,
  RichTextEditorActions,
  RichTextEditorContent,
  RichTextEditorCount,
  RichTextEditorFormats,
  RichTextEditorLink,
  RichTextEditorToolbar,
} from "@nuvui/editor";
import { ToolbarSeparator } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Comment"
        placeholder="Add a comment"
        headingLevels={[]}
      >
        <RichTextEditorToolbar>
          <RichTextEditorFormats
            items={["bold", "italic"]}
            aria-label="Text style"
          />
          <ToolbarSeparator />
          <RichTextEditorFormats
            items={["bulletList", "orderedList"]}
            aria-label="Lists"
          />
          <ToolbarSeparator />
          <RichTextEditorLink />
          <RichTextEditorActions items={["clearFormatting"]} />
        </RichTextEditorToolbar>
        <RichTextEditorContent />
        <RichTextEditorCount />
      </RichTextEditor>
    </div>
  );
}
