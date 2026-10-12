"use client";

import { Message, MessageContent } from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import { Button, Switch } from "@nuvui/react";
import { useEffect, useState } from "react";

const reply = `A reminder goes out on **day 31**, and a late fee starts on ~~day 40~~ **day 45**.

In code, with \`dueDays\` as the invoice's own terms:

\`\`\`ts
function isLate(sentOn: Date, dueDays = 30) {
  const due = new Date(sentOn);
  due.setDate(due.getDate() + dueDays);
  return Date.now() > due.getTime();
}
\`\`\`

The [payment terms](#payment-terms) have the rest.`;

export default function Example() {
  // How many characters have arrived.
  const [arrived, setArrived] = useState(reply.length);
  const [closing, setClosing] = useState(true);
  const writing = arrived < reply.length;

  // Stands in for a model: four characters every 40 milliseconds.
  useEffect(() => {
    if (!writing) return;
    const timer = setInterval(
      () => setArrived((now) => Math.min(now + 4, reply.length)),
      40,
    );
    return () => clearInterval(timer);
  }, [writing]);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        justifyItems: "start",
        inlineSize: "100%",
        maxInlineSize: 560,
      }}
    >
      <Message
        from="assistant"
        streaming={writing}
        style={{ inlineSize: "100%", minBlockSize: 300 }}
      >
        <MessageContent style={{ inlineSize: "100%" }}>
          <Markdown streaming={writing && closing}>
            {reply.slice(0, arrived)}
          </Markdown>
        </MessageContent>
      </Message>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <Button
          intent="secondary"
          size="sm"
          disabled={writing}
          onClick={() => setArrived(0)}
        >
          Write it again
        </Button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Switch
            id="close-what-is-open"
            checked={closing}
            onCheckedChange={setClosing}
          />
          <label htmlFor="close-what-is-open">
            Close what's open while it arrives
          </label>
        </div>
      </div>
    </div>
  );
}
