"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  Message,
  MessageContent,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import { useState } from "react";

const starters = [
  "Summarize last month's invoices",
  "Who hasn't paid yet?",
  "Draft a reminder",
];

export default function Example() {
  const [sent, setSent] = useState<string[]>([]);

  return (
    <Conversation
      style={{
        inlineSize: "100%",
        maxInlineSize: 520,
        blockSize: 380,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <ConversationContent aria-label="A new conversation">
        {sent.length === 0 ? (
          <ConversationEmpty>
            <p style={{ margin: 0, fontWeight: 600 }}>
              What do you want to know?
            </p>
            <PromptSuggestions>
              {starters.map((text) => (
                <PromptSuggestion
                  key={text}
                  onClick={() => setSent((now) => [...now, text])}
                >
                  {text}
                </PromptSuggestion>
              ))}
            </PromptSuggestions>
          </ConversationEmpty>
        ) : (
          sent.map((text, index) => (
            <Message key={index} from="user">
              <MessageContent>{text}</MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <div style={{ padding: "0 1rem 1rem" }}>
        <PromptInput onSubmit={(text) => setSent((now) => [...now, text])}>
          <PromptInputTextarea
            aria-label="Message"
            placeholder="Ask anything"
          />
          <PromptInputToolbar>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </Conversation>
  );
}
