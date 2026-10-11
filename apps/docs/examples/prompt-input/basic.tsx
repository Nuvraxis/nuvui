"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput onSubmit={setSent}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="status" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {sent ? `Sent: ${sent}` : "Nothing sent yet."}
      </p>
    </div>
  );
}
