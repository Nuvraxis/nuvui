"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  TableOfContents,
  type TableOfContentsItem,
} from "@nuvui/react";
import { ChevronsUpDown } from "lucide-react";
import "./article.scss";

// A made-up page of a made-up handbook. In an app the sections come from
// your content, and the list of headings is made from them, as it is here.
const sections = [
  {
    id: "what-counts",
    title: "What counts as an expense",
    depth: 1,
    text: [
      "An expense is something you paid for so that you could do your work: a train to a customer, a book for a course, a meal on a trip.",
      "Things the company already pays for, such as your laptop and the software on it, aren't expenses. Ask for those through the equipment form.",
    ],
  },
  {
    id: "limits",
    title: "Limits",
    depth: 2,
    text: [
      "A meal on a trip is covered up to $40. A night in a hotel is covered up to $220. Anything over $500 needs your manager's word before you pay for it.",
    ],
  },
  {
    id: "receipts",
    title: "Receipts",
    depth: 2,
    text: [
      "Keep the receipt for everything over $25. A photo is enough, as long as the date, the amount and the seller can be read.",
    ],
  },
  {
    id: "claiming",
    title: "Claiming it back",
    depth: 1,
    text: [
      "Add each expense in the app within thirty days of paying for it, with its receipt. Your manager approves it, and it's paid with your next salary.",
      "A claim sent after the twentieth of the month is paid the month after.",
    ],
  },
  {
    id: "abroad",
    title: "Trips abroad",
    depth: 1,
    text: [
      "Claim in the currency you paid in. We convert it at the rate on the day you paid, which the app looks up for you.",
    ],
  },
  {
    id: "questions",
    title: "Who to ask",
    depth: 1,
    text: [
      "Your manager knows what your team's budget allows. For everything else, write to finance@example.com.",
    ],
  },
] satisfies (TableOfContentsItem & { text: string[] })[];

const contents = sections.map(({ id, title, depth }) => ({ id, title, depth }));

export default function Article() {
  return (
    <div className="article">
      <main className="article__main">
        <header className="article__head">
          <p className="article__kicker">Handbook</p>
          <h1 className="article__title">Expenses</h1>
          <p className="article__lead">
            What you can claim back, how much, and how to do it.
          </p>
        </header>

        {/* On a narrow screen the list is behind a button, above the text.
            It's the same list, so it marks the same heading. */}
        <Collapsible className="article__drawer">
          <CollapsibleTrigger asChild>
            <Button intent="secondary" className="article__toggle">
              On this page
              <ChevronsUpDown aria-hidden="true" size={16} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <TableOfContents
              aria-label="On this page"
              items={contents}
              className="article__contents"
            />
          </CollapsibleContent>
        </Collapsible>

        {sections.map((section) => {
          const Heading = section.depth === 1 ? "h2" : "h3";
          return (
            <section key={section.id} className="article__section">
              <Heading
                id={section.id}
                className={
                  section.depth === 1
                    ? "article__heading"
                    : "article__subheading"
                }
              >
                {section.title}
              </Heading>
              {section.text.map((paragraph) => (
                <p key={paragraph} className="article__text">
                  {paragraph}
                </p>
              ))}
            </section>
          );
        })}
      </main>

      {/* Beside the text on a wide screen, where it stays in view. */}
      <aside className="article__side">
        <p className="article__label" id="article-contents">
          On this page
        </p>
        <TableOfContents aria-labelledby="article-contents" items={contents} />
      </aside>
    </div>
  );
}
