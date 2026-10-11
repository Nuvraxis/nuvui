"use client";

import {
  ToolCall,
  ToolCallApproval,
  ToolCallContent,
  ToolCallInput,
  ToolCallOutput,
  type ToolCallStatus,
  ToolCallTrigger,
} from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useEffect, useRef, useState } from "react";

export default function Example() {
  const [status, setStatus] = useState<ToolCallStatus>("approval");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Stands in for the tool doing its work.
  function approve() {
    setStatus("running");
    timer.current = setTimeout(() => setStatus("done"), 1500);
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        justifyItems: "start",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <ToolCall status={status}>
        <ToolCallTrigger>Send a reminder</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput
            value={{ invoice: "INV-1042", to: "billing@contoso.example" }}
          />
          {status === "done" ? <ToolCallOutput value="Sent at 10:42." /> : null}
        </ToolCallContent>
        <ToolCallApproval
          onApprove={approve}
          onDeny={() => setStatus("denied")}
        >
          Send a reminder for INV-1042 to Contoso?
        </ToolCallApproval>
      </ToolCall>
      <Button
        intent="secondary"
        size="sm"
        onClick={() => {
          clearTimeout(timer.current);
          setStatus("approval");
        }}
      >
        Ask again
      </Button>
    </div>
  );
}
