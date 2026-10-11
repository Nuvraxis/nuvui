"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useState } from "react";

const limit = 280;

export default function Example() {
  const [text, setText] = useState("");

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <PromptInput
        value={text}
        onValueChange={(next) => setText(next.slice(0, limit))}
        onSubmit={() => {}}
      >
        <PromptInputTextarea
          aria-label="Message"
          aria-describedby="prompt-left"
          placeholder="Ask anything"
        />
        <PromptInputToolbar>
          <span id="prompt-left" style={{ fontSize: "var(--text-sm)" }}>
            {limit - text.length} characters left
          </span>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
