"use client";

import { Message, MessageContent } from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import { createShikiHighlighter } from "@nuvui/chat/shiki";

// One for the whole app, made outside any component.
const highlighter = createShikiHighlighter();

const reply = `## Two invoices are overdue

Both are for **Contoso**. The older one is past the day a [late fee](#late-fees) starts.

| Invoice | Amount | Days late |
| :-- | --: | --: |
| INV-1042 | 4,200 | 12 |
| INV-1057 | 1,150 | 3 |

What I'd do next:

1. Send a reminder for \`INV-1042\` today.
2. Leave \`INV-1057\` until Friday.

To find them yourself:

\`\`\`ts
const overdue = invoices.filter(
  (invoice) => invoice.customer === "Contoso" && invoice.daysLate > 0,
);
\`\`\`
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 560 }}>
      <Message from="assistant">
        <MessageContent>
          <Markdown highlighter={highlighter} headingOffset={1}>
            {reply}
          </Markdown>
        </MessageContent>
      </Message>
    </div>
  );
}
