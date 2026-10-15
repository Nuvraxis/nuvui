"use client";

import {
  Badge,
  Button,
  burstConfetti,
  Checkbox,
  Label,
  Progress,
} from "@nuvui/react";
import { useId, useRef, useState } from "react";
import "./setup-checklist.scss";

// Made up, and stands in for what your app knows is done. Two are done
// already, as they would be for someone who signed up a moment ago.
const steps = [
  {
    id: "account",
    title: "Create your account",
    text: "Your name and a password.",
  },
  {
    id: "workspace",
    title: "Name your workspace",
    text: "What your team will see at the top of every page.",
  },
  {
    id: "invite",
    title: "Invite your team",
    text: "Anyone you add gets an email with a link to join.",
  },
  {
    id: "connect",
    title: "Connect a data source",
    text: "A database, a spreadsheet or another app.",
  },
  {
    id: "share",
    title: "Share your first report",
    text: "With your team, or with a link.",
  },
];

export default function SetupChecklist() {
  const id = useId();
  const [done, setDone] = useState<string[]>(["account", "workspace"]);
  const progress = useRef<HTMLDivElement>(null);
  const finished = done.length === steps.length;

  function check(step: string, checked: boolean) {
    const next = checked
      ? [...done, step]
      : done.filter((each) => each !== step);
    setDone(next);
    // The last step, done just now. The confetti comes up from the bar
    // that's just filled.
    if (checked && next.length === steps.length && progress.current) {
      burstConfetti(progress.current);
    }
  }

  return (
    <main className="setup-checklist">
      <section className="setup-checklist__panel" aria-labelledby={id}>
        <header className="setup-checklist__head">
          <h1 className="setup-checklist__title" id={id}>
            Get started
          </h1>
          <p className="setup-checklist__text">
            Five steps to a workspace your team can use.
          </p>
        </header>
        <div className="setup-checklist__progress" ref={progress}>
          <div className="setup-checklist__count" id={`${id}-count`}>
            {done.length} of {steps.length} done
          </div>
          <Progress
            value={(done.length / steps.length) * 100}
            aria-labelledby={`${id}-count`}
          />
        </div>
        <ul className="setup-checklist__steps">
          {steps.map((step) => {
            const checked = done.includes(step.id);
            return (
              <li key={step.id} className="setup-checklist__step">
                <Checkbox
                  id={`${id}-${step.id}`}
                  checked={checked}
                  aria-describedby={`${id}-${step.id}-text`}
                  onCheckedChange={(value) => check(step.id, value === true)}
                />
                <div className="setup-checklist__words">
                  <Label
                    htmlFor={`${id}-${step.id}`}
                    className="setup-checklist__name"
                  >
                    {step.title}
                  </Label>
                  <p
                    className="setup-checklist__hint"
                    id={`${id}-${step.id}-text`}
                  >
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        {/* In the page from the start, so a screen reader hears it when the
            last step is done. The confetti says nothing to anyone. */}
        <div role="status" className="setup-checklist__status">
          {finished ? (
            <div className="setup-checklist__done">
              <Badge intent="success">Done</Badge>
              <span>You're set up. Your team can start now.</span>
            </div>
          ) : null}
        </div>
        {finished ? (
          <Button asChild className="setup-checklist__next">
            <a href="#dashboard">Go to your dashboard</a>
          </Button>
        ) : null}
      </section>
    </main>
  );
}
