"use client";

import {
  Message,
  MessageContent,
  MessageLoader,
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
} from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useEffect, useState } from "react";

const steps = [
  "Looked up Contoso's open invoices",
  "Checked the payment terms",
  "Worked out how late each one is",
];

export default function Example() {
  // How many steps have been taken. One more than there are, and the
  // reply is written.
  const [taken, setTaken] = useState(steps.length + 1);
  const thinking = taken <= steps.length;

  // Stands in for the assistant: a step every 900 milliseconds.
  useEffect(() => {
    if (!thinking) return;
    const timer = setInterval(() => setTaken((now) => now + 1), 900);
    return () => clearInterval(timer);
  }, [thinking]);

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
      <Message from="assistant" streaming={thinking}>
        <Reasoning streaming={thinking}>
          <ReasoningTrigger>
            {thinking ? "Thinking" : "Thought for 3 seconds"}
          </ReasoningTrigger>
          <ReasoningContent>
            <ReasoningSteps>
              {steps.slice(0, taken + 1).map((step, index) => (
                <ReasoningStep
                  key={step}
                  label={step}
                  status={index === taken ? "active" : "done"}
                />
              ))}
            </ReasoningSteps>
          </ReasoningContent>
        </Reasoning>
        {thinking ? (
          <MessageLoader />
        ) : (
          <MessageContent>
            Two invoices are overdue: INV-1042 by 12 days and INV-1057 by 3.
          </MessageContent>
        )}
      </Message>
      <Button
        intent="secondary"
        size="sm"
        disabled={thinking}
        onClick={() => setTaken(0)}
      >
        Ask again
      </Button>
    </div>
  );
}
