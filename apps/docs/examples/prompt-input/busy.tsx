"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useEffect, useRef, useState } from "react";

export default function Example() {
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("Nothing sent yet.");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function send(text: string) {
    setBusy(true);
    setSaid(`Replying to: ${text}`);
    // A reply that takes four seconds.
    timer.current = setTimeout(() => {
      setBusy(false);
      setSaid("Replied.");
    }, 4000);
  }

  function stop() {
    clearTimeout(timer.current);
    setBusy(false);
    setSaid("Stopped.");
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput busy={busy} onStop={stop} onSubmit={send}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="status" style={{ margin: 0 }}>
        {said}
      </p>
    </div>
  );
}
