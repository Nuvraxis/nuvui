"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useEffect, useRef, useState } from "react";

type Line = { id: number; from: "user" | "assistant"; text: string };

// A stand-in for a model: the same answer, a few words at a time.
const answer =
  "Invoices are sent on the first working day of the month. To change that, open Billing, then Schedule, and pick another day. The change applies from the next invoice. Invoices already sent keep their dates, and a customer who pays by card is charged on the day the invoice is sent.";

const first: Line[] = [
  { id: 1, from: "user", text: "When do invoices go out?" },
  {
    id: 2,
    from: "assistant",
    text: "On the first working day of each month, at 09:00 in your workspace's time zone.",
  },
  { id: 3, from: "user", text: "And if that's a public holiday?" },
  {
    id: 4,
    from: "assistant",
    text: "Then they go out on the next working day. Holidays come from the country your workspace is set to, under Settings, then Region.",
  },
];

export default function Example() {
  const [lines, setLines] = useState(first);
  // Words of the reply so far, or null when none is on its way.
  const [words, setWords] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const all = answer.split(" ");

  useEffect(() => () => clearInterval(timer.current), []);

  function finish(count: number) {
    clearInterval(timer.current);
    setWords(null);
    if (count === 0) return;
    setLines((now) => [
      ...now,
      {
        id: Date.now(),
        from: "assistant",
        text: all.slice(0, count).join(" "),
      },
    ]);
  }

  function send(text: string) {
    setLines((now) => [...now, { id: Date.now(), from: "user", text }]);
    setWords(0);
    let count = 0;
    timer.current = setInterval(() => {
      count += 2;
      if (count >= all.length) finish(all.length);
      else setWords(count);
    }, 120);
  }

  return (
    <Conversation
      style={{
        inlineSize: "100%",
        maxInlineSize: 520,
        blockSize: 400,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <ConversationContent aria-label="Billing questions">
        {lines.map((line) => (
          <Message key={line.id} from={line.from}>
            <MessageContent>{line.text}</MessageContent>
          </Message>
        ))}
        {words === null ? null : (
          <Message from="assistant" streaming>
            {words === 0 ? (
              <MessageLoader />
            ) : (
              <MessageContent>{all.slice(0, words).join(" ")}</MessageContent>
            )}
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
      <div style={{ padding: "0 1rem 1rem" }}>
        <PromptInput
          busy={words !== null}
          onStop={() => finish(words ?? 0)}
          onSubmit={send}
        >
          <PromptInputTextarea
            aria-label="Message"
            placeholder="Ask about billing"
          />
          <PromptInputToolbar>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </Conversation>
  );
}
