"use client";

import { RichTextEditor } from "@nuvui/editor";
import { Button } from "@nuvui/react";
import { useState } from "react";

const start =
  "<p>Payment is due <strong>30 days</strong> after the invoice.</p>";

export default function Example() {
  const [html, setHtml] = useState(start);
  const [counts, setCounts] = useState("8 words");

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 640,
      }}
    >
      <RichTextEditor
        aria-label="Payment terms"
        value={html}
        onValueChange={(next, change) => {
          setHtml(next);
          setCounts(`${change.words} words`);
        }}
      />
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Button
          intent="secondary"
          onClick={() => {
            setHtml(start);
            setCounts("8 words");
          }}
        >
          Put it back
        </Button>
        <span role="status">{counts}</span>
      </div>
      <pre
        data-html=""
        style={{
          margin: 0,
          padding: "0.75rem",
          overflowX: "auto",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-muted)",
          fontSize: "var(--text-xs)",
          whiteSpace: "pre-wrap",
        }}
      >
        {html || "(nothing written)"}
      </pre>
    </div>
  );
}
