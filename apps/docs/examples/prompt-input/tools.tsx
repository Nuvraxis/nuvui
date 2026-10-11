"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@nuvui/chat";
import { Button, NativeSelect } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [scope, setScope] = useState("This workspace");
  const [sent, setSent] = useState("Nothing sent yet.");

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput onSubmit={(text) => setSent(`Asked ${scope}: ${text}`)}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputTools>
            <NativeSelect
              aria-label="Where to look"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option>This workspace</option>
              <option>Invoices</option>
              <option>Customers</option>
            </NativeSelect>
            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={() => setSent("Cleared.")}
            >
              Clear
            </Button>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="status" style={{ margin: 0 }}>
        {sent}
      </p>
    </div>
  );
}
