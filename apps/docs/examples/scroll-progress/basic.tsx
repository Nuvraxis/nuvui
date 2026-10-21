"use client";

import { ScrollProgress } from "@nuvui/react";
import { useRef } from "react";

const sections = [
  {
    title: "What changed",
    text: "Invoices can now be sent in the customer's own currency. The rate is fixed on the day the invoice is raised, and shown on it.",
  },
  {
    title: "Who it's for",
    text: "Any team that bills customers abroad. Nothing changes for invoices in your own currency.",
  },
  {
    title: "How to turn it on",
    text: "Open Billing, then Currencies, and choose the ones you bill in. Each customer can then be given one of them.",
  },
  {
    title: "What it costs",
    text: "Nothing more on any plan. The bank's own fees for a payment in another currency still apply.",
  },
  {
    title: "What's next",
    text: "Rates that follow the market until an invoice is paid, for teams that would rather the customer took the risk.",
  },
];

export default function Example() {
  const article = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        position: "relative",
        inlineSize: "100%",
        maxInlineSize: 480,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <ScrollProgress
        target={article}
        style={{ position: "absolute", insetBlockStart: 0, zIndex: 1 }}
      />
      <section
        ref={article}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable with the keyboard
        tabIndex={0}
        aria-label="Release notes"
        style={{ blockSize: 260, overflowY: "auto", padding: 20 }}
      >
        <h2 style={{ marginBlock: "0 12px", fontSize: "var(--text-lg)" }}>
          Invoices in your customer's currency
        </h2>
        {sections.map((section) => (
          <div key={section.title}>
            <h3
              style={{ marginBlock: "16px 4px", fontSize: "var(--text-base)" }}
            >
              {section.title}
            </h3>
            <p style={{ margin: 0 }}>{section.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
