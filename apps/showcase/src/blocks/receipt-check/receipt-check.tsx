"use client";

import { Badge, Button, ImageZoom } from "@nuvui/react";
import { useState } from "react";
import "./receipt-check.scss";

type Decision = "waiting" | "approved" | "returned";

const badges = {
  waiting: { intent: "warning", text: "Waiting for you" },
  approved: { intent: "success", text: "Approved" },
  returned: { intent: "danger", text: "Sent back" },
} as const;

// What was bought, as the receipt prints it. The same lines are listed
// beside it in words, for anyone who can't see the picture.
const lines = [
  { item: "2 × Soup of the day", amount: "15.00" },
  { item: "2 × Flatbread, roast pepper", amount: "19.60" },
  { item: "2 × Sparkling water", amount: "6.00" },
  { item: "2 × Flat white", amount: "8.00" },
];

const claim = [
  { term: "Spent at", value: "Halden Street Café" },
  { term: "On", value: "14 October 2026" },
  { term: "For", value: "Lunch with Orrin Freight, two people" },
  { term: "Claimed", value: "€48.60" },
];

// A photographed receipt, drawn so the block needs no file. The print is
// small, as on a real one: zooming in is how it's read.
function Receipt() {
  return (
    <svg
      role="img"
      aria-label="Receipt from Halden Street Café, 14 October 2026, total €48.60"
      viewBox="0 0 300 400"
      className="receipt-check__receipt"
    >
      <rect
        className="receipt-check__paper"
        x="50"
        y="20"
        width="200"
        height="360"
      />
      <g className="receipt-check__print" textAnchor="middle">
        <text x="150" y="52" className="receipt-check__print--bold">
          HALDEN STREET CAFÉ
        </text>
        <text x="150" y="66">
          12 Halden Street, Northgate
        </text>
        <text x="150" y="80">
          14/10/2026 12:47 Table 6
        </text>
      </g>
      <path className="receipt-check__rule" d="M62 96h176M62 220h176" />
      <g className="receipt-check__print">
        {lines.map((line, index) => (
          <g key={line.item}>
            <text x="62" y={116 + index * 22}>
              {line.item}
            </text>
            <text x="238" y={116 + index * 22} textAnchor="end">
              {line.amount}
            </text>
          </g>
        ))}
        <text x="62" y="242" className="receipt-check__print--bold">
          TOTAL EUR
        </text>
        <text
          x="238"
          y="242"
          textAnchor="end"
          className="receipt-check__print--bold"
        >
          48.60
        </text>
        <text x="62" y="260">
          incl. VAT 10%
        </text>
        <text x="238" y="260" textAnchor="end">
          4.42
        </text>
        <text x="62" y="284">
          Paid by card
        </text>
        <text x="238" y="284" textAnchor="end">
          48.60
        </text>
      </g>
      <text
        x="150"
        y="340"
        textAnchor="middle"
        className="receipt-check__print"
      >
        Thank you. Receipt 0418-2291
      </text>
    </svg>
  );
}

export default function ReceiptCheck() {
  const [decision, setDecision] = useState<Decision>("waiting");
  const [said, setSaid] = useState("");
  const badge = badges[decision];

  // Each would call your server.
  const decide = (next: Decision, words: string) => {
    setDecision(next);
    setSaid(words);
  };

  return (
    <main className="receipt-check">
      <header className="receipt-check__head">
        <div className="receipt-check__heading">
          <h1 className="receipt-check__title">Expense claim EX-2291</h1>
          <p className="receipt-check__meta">
            From Ines Porter, sent on 15 October 2026
          </p>
        </div>
        <Badge intent={badge.intent}>{badge.text}</Badge>
      </header>

      <div className="receipt-check__layout">
        <ImageZoom scale={2.5} className="receipt-check__zoom">
          <Receipt />
        </ImageZoom>

        <aside
          className="receipt-check__side"
          aria-labelledby="receipt-check-claim"
        >
          <h2 className="receipt-check__subtitle" id="receipt-check-claim">
            What was claimed
          </h2>
          <dl className="receipt-check__claim">
            {claim.map((fact) => (
              <div key={fact.term} className="receipt-check__fact">
                <dt className="receipt-check__term">{fact.term}</dt>
                <dd className="receipt-check__value">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="receipt-check__subtitle" id="receipt-check-lines">
            On the receipt
          </h2>
          <ul
            className="receipt-check__lines"
            aria-labelledby="receipt-check-lines"
          >
            {lines.map((line) => (
              <li key={line.item} className="receipt-check__line">
                <span>{line.item}</span>
                <span>€{line.amount}</span>
              </li>
            ))}
            <li className="receipt-check__line receipt-check__line--total">
              <span>Total</span>
              <span>€48.60</span>
            </li>
          </ul>

          <div className="receipt-check__actions">
            <Button
              disabled={decision === "approved"}
              onClick={() =>
                decide("approved", "Approved. Ines Porter has been told.")
              }
            >
              Approve
            </Button>
            <Button
              intent="secondary"
              disabled={decision === "returned"}
              onClick={() =>
                decide("returned", "Sent back. Ines Porter has been told.")
              }
            >
              Send back
            </Button>
          </div>
          {/* In the page from the start, so a screen reader hears each
              change. */}
          <p role="status" className="receipt-check__said">
            {said}
          </p>
        </aside>
      </div>
    </main>
  );
}
