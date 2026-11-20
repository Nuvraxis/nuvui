"use client";

import { CodeEditor, CodeEditorContent } from "@nuvui/editor/code";
import { Button } from "@nuvui/react/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@nuvui/react/field";
import { type FormEvent, useState } from "react";

export default function Example() {
  const [sent, setSent] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(String(new FormData(event.currentTarget).get("template")));
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 560,
      }}
    >
      <Field>
        <FieldLabel>Receipt template</FieldLabel>
        <FieldControl>
          <CodeEditor
            name="template"
            language="html"
            defaultValue={
              "<p>Thanks, {{ name }}.</p>\n<p>Order {{ number }} is on its way.</p>\n"
            }
            minLines={4}
            lineNumbers={false}
            foldGutter={false}
          >
            <CodeEditorContent />
          </CodeEditor>
        </FieldControl>
        <FieldDescription>
          The HTML sent with each receipt. Words in braces are filled in.
        </FieldDescription>
      </Field>
      <Button type="submit" style={{ justifySelf: "start" }}>
        Save template
      </Button>
      {sent === null ? null : (
        <pre style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {sent}
        </pre>
      )}
    </form>
  );
}
