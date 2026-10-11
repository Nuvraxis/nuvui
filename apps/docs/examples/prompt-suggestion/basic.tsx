"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import { useRef, useState } from "react";

const starters = [
  "Summarize last month's invoices",
  "Who hasn't paid yet?",
  "Draft a reminder for an overdue invoice",
];

export default function Example() {
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptSuggestions style={{ justifyContent: "start" }}>
        {starters.map((starter) => (
          <PromptSuggestion
            key={starter}
            onClick={() => {
              // Into the box, to be changed before it's sent.
              setText(starter);
              field.current?.focus();
            }}
          >
            {starter}
          </PromptSuggestion>
        ))}
      </PromptSuggestions>
      <PromptInput value={text} onValueChange={setText} onSubmit={() => {}}>
        <PromptInputTextarea
          ref={field}
          aria-label="Message"
          placeholder="Ask anything"
        />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
