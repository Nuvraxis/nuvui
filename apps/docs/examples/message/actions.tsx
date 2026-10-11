"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageCopyAction,
} from "@nuvui/chat";
import { useState } from "react";

const text =
  "Two invoices are overdue: INV-1042 for Contoso, 12 days, and INV-1057 for Fabrikam, 3 days.";

const icon = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export default function Example() {
  const [tries, setTries] = useState(1);

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="assistant">
        <MessageContent>{text}</MessageContent>
        <MessageActions>
          <MessageCopyAction text={text} />
          <MessageAction
            label="Try again"
            onClick={() => setTries((now) => now + 1)}
          >
            <svg aria-hidden="true" {...icon}>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v2.5H11" />
            </svg>
          </MessageAction>
        </MessageActions>
      </Message>
      <p role="status" style={{ marginBlock: "0.75rem 0" }}>
        Answer {tries}
      </p>
    </div>
  );
}
