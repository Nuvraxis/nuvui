"use client";

import { Badge, ScrollProgress } from "@nuvui/react";
import { useRef } from "react";
import "./release-notes.scss";

interface Release {
  version: string;
  date: string;
  title: string;
  changes: { kind: "New" | "Better" | "Fixed"; text: string }[];
}

const releases: Release[] = [
  {
    version: "4.2",
    date: "14 October 2026",
    title: "Invoices in your customer's currency",
    changes: [
      {
        kind: "New",
        text: "Send an invoice in any of 34 currencies. The rate is fixed on the day it's raised, and shown on it.",
      },
      {
        kind: "Better",
        text: "Reminders for an unpaid invoice now go out in the customer's own language.",
      },
      {
        kind: "Fixed",
        text: "A credit note for part of an invoice no longer takes the whole amount off the balance.",
      },
    ],
  },
  {
    version: "4.1",
    date: "30 September 2026",
    title: "Approvals for large purchases",
    changes: [
      {
        kind: "New",
        text: "Purchases over an amount you set wait for a manager to approve them before they're paid.",
      },
      {
        kind: "Better",
        text: "The list of purchases can be filtered by who approved them, and when.",
      },
      {
        kind: "Fixed",
        text: "Receipts photographed on a phone are no longer turned on their side.",
      },
    ],
  },
  {
    version: "4.0",
    date: "9 September 2026",
    title: "A new home page",
    changes: [
      {
        kind: "New",
        text: "The home page shows what's due this week, what's overdue and what's waiting for you, in that order.",
      },
      {
        kind: "Better",
        text: "Search finds customers by their tax number as well as their name.",
      },
      {
        kind: "Fixed",
        text: "Exports to a spreadsheet keep the dates in the format your account uses.",
      },
    ],
  },
  {
    version: "3.9",
    date: "19 August 2026",
    title: "Bank feeds every hour",
    changes: [
      {
        kind: "Better",
        text: "Payments from the bank arrive every hour instead of once a night.",
      },
      {
        kind: "Fixed",
        text: "A payment matched to the wrong invoice can be unmatched without deleting it.",
      },
    ],
  },
];

const intent = {
  New: "success",
  Better: "primary",
  Fixed: "neutral",
} as const;

export default function ReleaseNotes() {
  const notes = useRef<HTMLElement>(null);

  return (
    <main className="release-notes">
      <div className="release-notes__panel">
        <header className="release-notes__header">
          <h1 className="release-notes__title">What's new</h1>
          <p className="release-notes__lead">
            Every change to the app, newest first.
          </p>
        </header>
        <div className="release-notes__body">
          <ScrollProgress target={notes} className="release-notes__progress" />
          <section
            ref={notes}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls has to be reachable with the keyboard
            tabIndex={0}
            aria-label="Release notes"
            className="release-notes__scroller"
          >
            {releases.map((release) => (
              <article key={release.version} className="release-notes__release">
                <p className="release-notes__meta">
                  Version {release.version}
                  <span aria-hidden="true"> · </span>
                  <time>{release.date}</time>
                </p>
                <h2 className="release-notes__heading">{release.title}</h2>
                <ul className="release-notes__changes">
                  {release.changes.map((change) => (
                    <li key={change.text} className="release-notes__change">
                      <Badge
                        intent={intent[change.kind]}
                        className="release-notes__kind"
                      >
                        {change.kind}
                      </Badge>
                      <span>{change.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
