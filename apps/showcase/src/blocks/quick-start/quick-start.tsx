"use client";

import { CodeBlock } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import "./quick-start.scss";

const steps = [
  {
    title: "Install the package",
    text: "One package for the components, next to React 18 or 19.",
    language: "sh",
    code: "pnpm add @nuvui/react",
  },
  {
    title: "Load the stylesheet",
    text: "One plain CSS file, loaded once for the whole app. There's no build plugin to set up.",
    language: "tsx",
    code: `import "@nuvui/react/styles.css";`,
  },
  {
    title: "Use a component",
    text: "Import what you need and render it. Its look comes from the theme's variables.",
    language: "tsx",
    code: `import { Button } from "@nuvui/react";

export function Save() {
  return <Button>Save changes</Button>;
}`,
  },
];

export default function QuickStart() {
  return (
    <main className="quick-start">
      <header className="quick-start__header">
        <p className="quick-start__eyebrow">Quick start</p>
        <h1 className="quick-start__title">
          From an empty project to your first component
        </h1>
        <p className="quick-start__lead">
          Three steps, each with the code to copy.
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
        <Button intent="secondary">Browse the components</Button>
      </div>
    </main>
  );
}
