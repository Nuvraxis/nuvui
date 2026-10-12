"use client";

import { CodeBlock } from "@nuvui/chat";
import { createShikiHighlighter } from "@nuvui/chat/shiki";

// One for the whole app, made outside any component.
const highlighter = createShikiHighlighter();

const code = `type Invoice = { number: string; amount: number; daysLate: number };

// The ones a reminder should go out for today.
export function overdue(invoices: Invoice[], after = 0) {
  return invoices
    .filter((invoice) => invoice.daysLate > after)
    .sort((a, b) => b.daysLate - a.daysLate);
}`;

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 560,
      }}
    >
      <CodeBlock code={code} language="ts" highlighter={highlighter} />
      <CodeBlock
        code={`pnpm add @nuvui/chat @nuvui/react`}
        language="sh"
        title="Terminal"
      />
    </div>
  );
}
