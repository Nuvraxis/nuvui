"use client";

import { CodeBlock } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import "./quick-start.scss";

const steps = [
  {
    title: "Install the package",
    text: "One package for the components, and nothing else to set up.",
    language: "sh",
    code: "pnpm add @acme/payments",
  },
  {
    title: "Add your key",
    text: "Your key is on the settings page of your dashboard. Keep it on the server.",
    language: "sh",
    code: "ACME_SECRET_KEY=sk_test_your_key",
  },
  {
    title: "Take a payment",
    text: "A checkout in a few lines, with cards, wallets and bank transfers.",
    language: "tsx",
    code: `import { Checkout } from "@acme/payments";

export function Pay() {
  return <Checkout amount={4900} currency="EUR" />;
}`,
  },
];

export default function QuickStart() {
  return (
    <main className="quick-start">
      <header className="quick-start__header">
        <p className="quick-start__eyebrow">Quick start</p>
        <h1 className="quick-start__title">Take your first payment today</h1>
        <p className="quick-start__lead">
          Three steps from an empty project to a working checkout.
        </p>
      </header>
      <ol className="quick-start__steps">
        {steps.map((step, index) => (
          <li key={step.title} className="quick-start__step">
            <span className="quick-start__number" aria-hidden="true">
              {index + 1}
            </span>
            <div className="quick-start__body">
              <h2 className="quick-start__heading">{step.title}</h2>
              <p className="quick-start__text">{step.text}</p>
              <CodeBlock
                code={step.code}
                language={step.language}
                label={`Code for ${step.title.toLowerCase()}`}
                typing
                typingTrigger="view"
                typingDelay={index * 150}
              />
            </div>
          </li>
        ))}
      </ol>
      <div className="quick-start__actions">
        <Button>Read the guide</Button>
        <Button intent="secondary">See an example app</Button>
      </div>
    </main>
  );
}
