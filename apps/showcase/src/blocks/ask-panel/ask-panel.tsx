"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldControl,
  FieldLabel,
  Input,
  TextShimmer,
} from "@nuvui/react";
import { type FormEvent, useEffect, useState } from "react";
import "./ask-panel.scss";

// Made-up questions with made-up answers. Nothing here asks a model: the
// answer is looked up below, after a wait that stands in for one.
const examples = [
  {
    question: "Which product sold most last month?",
    answer:
      "The Standing Desk, with 214 orders. That's 31 more than the month before.",
  },
  {
    question: "How many refunds are still open?",
    answer: "Seven, worth $1,284 together. The oldest is nine days old.",
  },
  {
    question: "Who placed the largest order?",
    answer: "Northwind Traders, on 3 October: 40 chairs for $9,960.",
  },
];

export default function AskPanel() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState("");
  const waiting = asked !== "" && answer === "";

  // Send the question to your own server from here, and set the answer
  // when it comes back.
  useEffect(() => {
    if (asked === "") return;
    const timer = setTimeout(() => {
      setAnswer(
        examples.find((example) => example.question === asked)?.answer ??
          "This is an example, with three questions it knows. Try one of those.",
      );
    }, 2500);
    return () => clearTimeout(timer);
  }, [asked]);

  const ask = (text: string) => {
    if (text.trim() === "") return;
    setQuestion(text);
    setAnswer("");
    setAsked(text.trim());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  return (
    <section className="ask-panel">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>Ask about your orders</h2>
          </CardTitle>
          <CardDescription>
            A question in your own words, answered from last month's figures.
          </CardDescription>
        </CardHeader>
        <CardContent className="ask-panel__body">
          <form className="ask-panel__form" onSubmit={submit}>
            <Field className="ask-panel__field">
              <FieldLabel>Your question</FieldLabel>
              <FieldControl>
                <Input
                  name="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  autoComplete="off"
                />
              </FieldControl>
            </Field>
            <Button type="submit" disabled={waiting}>
              Ask
            </Button>
          </form>

          <ul className="ask-panel__examples" aria-label="Questions to try">
            {examples.map((example) => (
              <li key={example.question}>
                <Button
                  intent="secondary"
                  size="sm"
                  className="ask-panel__example"
                  disabled={waiting}
                  onClick={() => ask(example.question)}
                >
                  {example.question}
                </Button>
              </li>
            ))}
          </ul>

          {/* In the page from the start, so a screen reader hears the wait
              begin and the answer arrive. */}
          <div role="status" className="ask-panel__answer">
            {waiting ? (
              <TextShimmer>Reading last month's orders</TextShimmer>
            ) : null}
            {answer ? (
              <>
                <p className="ask-panel__asked">{asked}</p>
                <p className="ask-panel__text">{answer}</p>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
