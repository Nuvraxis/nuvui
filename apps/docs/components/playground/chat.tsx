"use client";

import {
  Message,
  MessageContent,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const sides = ["user", "assistant"] as const;

export function MessagePlayground() {
  const [from, setFrom] = useState<(typeof sides)[number]>("assistant");
  const [waiting, setWaiting] = useState(false);

  const code = waiting
    ? `<Message from="${from}" streaming>
  <MessageLoader />
</Message>`
    : `<Message from="${from}">
  <MessageContent>Two invoices are overdue.</MessageContent>
</Message>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="from"
            value={from}
            options={sides}
            onChange={setFrom}
          />
          <CheckboxControl
            label="waiting for the reply"
            checked={waiting}
            onChange={setWaiting}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 420 }}>
        <Message from={from} streaming={waiting}>
          {waiting ? (
            <MessageLoader />
          ) : (
            <MessageContent>Two invoices are overdue.</MessageContent>
          )}
        </Message>
      </div>
    </Playground>
  );
}

export function PromptInputPlayground() {
  const [busy, setBusy] = useState(false);
  const [stoppable, setStoppable] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [sent, setSent] = useState("Nothing sent yet.");

  const code = `<PromptInput${busy ? " busy" : ""}${
    busy && stoppable ? " onStop={stop}" : ""
  }${disabled ? " disabled" : ""} onSubmit={send}>
  <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
  <PromptInputToolbar>
    <PromptInputSubmit />
  </PromptInputToolbar>
</PromptInput>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl label="busy" checked={busy} onChange={setBusy} />
          <CheckboxControl
            label="onStop"
            checked={stoppable}
            onChange={setStoppable}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          inlineSize: "100%",
          maxInlineSize: 420,
        }}
      >
        <PromptInput
          busy={busy}
          disabled={disabled}
          onStop={
            stoppable
              ? () => {
                  setBusy(false);
                  setSent("Stopped.");
                }
              : undefined
          }
          onSubmit={(text) => setSent(`Sent: ${text}`)}
        >
          <PromptInputTextarea
            aria-label="Message"
            placeholder="Ask anything"
          />
          <PromptInputToolbar>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
        <p role="status" style={{ margin: 0 }}>
          {sent}
        </p>
      </div>
    </Playground>
  );
}
