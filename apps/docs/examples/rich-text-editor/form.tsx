"use client";

import { RichTextEditor } from "@nuvui/editor";
import { Button } from "@nuvui/react";
import { type FormEvent, useId, useState } from "react";

export default function Example() {
  const id = useId();
  const [sent, setSent] = useState("Nothing sent yet.");
  const [missing, setMissing] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = String(new FormData(event.currentTarget).get("body") ?? "");
    setMissing(body === "");
    if (body !== "") setSent(`Sent: ${body}`);
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 640,
      }}
    >
      <span id={`${id}-label`} style={{ fontWeight: 500 }}>
        Reply
      </span>
      <RichTextEditor
        name="body"
        aria-labelledby={`${id}-label`}
        aria-describedby={missing ? `${id}-error` : undefined}
        aria-invalid={missing || undefined}
        aria-required
        onValueChange={() => setMissing(false)}
      />
      {missing ? (
        <p
          id={`${id}-error`}
          style={{ margin: 0, color: "var(--color-danger)" }}
        >
          Write a reply before you send it.
        </p>
      ) : null}
      <div>
        <Button type="submit">Send</Button>
      </div>
      <p role="status" style={{ margin: 0, overflowWrap: "anywhere" }}>
        {sent}
      </p>
    </form>
  );
}
