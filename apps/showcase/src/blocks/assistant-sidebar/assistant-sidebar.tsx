"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
  Message,
  MessageActions,
  MessageContent,
  MessageCopyAction,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import { Badge, Button } from "@nuvui/react";
import { Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./assistant-sidebar.scss";

type Turn = { id: number; from: "user" | "assistant"; text: string };

// A made-up invoice. The assistant below answers about this one record,
// which is the point of putting it beside the record.
const invoice = {
  number: "INV-1042",
  customer: "Contoso",
  issued: "15 September 2026",
  due: "29 September 2026",
  lines: [
    { what: "Team plan, 40 seats", amount: "3,200" },
    { what: "Onboarding workshop", amount: "800" },
    { what: "Priority support", amount: "200" },
  ],
  total: "4,200",
};

// A stand-in for a model. A real one is fetched from your server, with the
// record sent along: this picks an answer by a word in the question and
// hands it out a few words at a time.
const answers = [
  {
    about: "summar",
    text: "INV-1042 is for Contoso, at 4,200 in all: 3,200 for 40 seats on the Team plan, 800 for an onboarding workshop and 200 for priority support. It was due on 29 September and hasn't been paid.",
  },
  {
    about: "overdue",
    text: "It was due on 29 September, which is 12 days ago. One reminder went out on 2 October and had no reply. Contoso's last three invoices were each paid within a week, so this one is out of character.",
  },
  {
    about: "remind",
    text: "Here's a draft:\n\nHello,\n\nThis is a second reminder that invoice INV-1042 for 4,200 was due on 29 September. If it's already on its way, thank you, and please ignore this.\n\nKind regards,\nNorthwind",
  },
];
const fallback =
  "I can answer questions about this invoice: what's on it, why it's overdue and what to send next. Try one of the suggestions.";

const starters = [
  "Summarize this invoice",
  "Why is it overdue?",
  "Draft a second reminder",
];

function answerTo(question: string) {
  const asked = question.toLowerCase();
  return answers.find(({ about }) => asked.includes(about))?.text ?? fallback;
}

export default function AssistantSidebar() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  // The reply on its way: its words, and how many have arrived.
  const [reply, setReply] = useState<{ words: string[]; count: number } | null>(
    null,
  );
  const toggle = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Set by a press, and used up by the effect that follows it.
  const pressed = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const next = useRef(1);

  // Open to begin with where there's room for it beside the record. The
  // width is the md breakpoint, the one the stylesheet puts them side by
  // side at. It's read once the page is in the browser, so the server and
  // the browser draw the same thing first.
  useEffect(() => {
    if (window.matchMedia("(min-width: 48rem)").matches) setOpen(true);
    return () => clearInterval(timer.current);
  }, []);

  // Beside the record, focus stays on the button that was pressed. On a
  // narrow screen the panel takes the record's place and the button is
  // gone, so focus goes to the top of the panel, and back to the button
  // when the panel closes.
  useEffect(() => {
    if (!pressed.current) return;
    pressed.current = false;
    if (!open) toggle.current?.focus();
    else if (toggle.current?.offsetParent === null) heading.current?.focus();
  }, [open]);

  function show(value: boolean) {
    pressed.current = true;
    setOpen(value);
  }

  function add(from: Turn["from"], text: string) {
    const id = next.current;
    next.current += 1;
    setTurns((now) => [...now, { id, from, text }]);
  }

  function ask(question: string) {
    add("user", question);
    const words = answerTo(question).split(" ");
    let count = 0;
    setReply({ words, count });
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      count = Math.min(count + 3, words.length);
      if (count < words.length) {
        setReply({ words, count });
        return;
      }
      clearInterval(timer.current);
      setReply(null);
      add("assistant", words.join(" "));
    }, 90);
  }

  // What has arrived so far stays, as the answer.
  function stop() {
    clearInterval(timer.current);
    if (reply && reply.count > 0) {
      add("assistant", reply.words.slice(0, reply.count).join(" "));
    }
    setReply(null);
  }

  return (
    <div className="assistant-sidebar" data-open={open ? "" : undefined}>
      <main className="assistant-sidebar__page">
        <header className="assistant-sidebar__head">
          <div className="assistant-sidebar__heading">
            <h1 className="assistant-sidebar__title">
              Invoice {invoice.number}
            </h1>
            <Badge intent="danger" variant="outline">
              Overdue
            </Badge>
          </div>
          <Button
            ref={toggle}
            intent="secondary"
            className="assistant-sidebar__toggle"
            aria-expanded={open}
            aria-controls="assistant-sidebar-panel"
            onClick={() => show(!open)}
          >
            <Sparkles aria-hidden="true" size={16} />
            Ask the assistant
          </Button>
        </header>

        <dl className="assistant-sidebar__facts">
          <div className="assistant-sidebar__fact">
            <dt className="assistant-sidebar__label">Customer</dt>
            <dd className="assistant-sidebar__value">{invoice.customer}</dd>
          </div>
          <div className="assistant-sidebar__fact">
            <dt className="assistant-sidebar__label">Issued</dt>
            <dd className="assistant-sidebar__value">{invoice.issued}</dd>
          </div>
          <div className="assistant-sidebar__fact">
            <dt className="assistant-sidebar__label">Due</dt>
            <dd className="assistant-sidebar__value">{invoice.due}</dd>
          </div>
        </dl>

        <table className="assistant-sidebar__lines">
          <caption className="assistant-sidebar__caption">
            What it's for
          </caption>
          <thead>
            <tr>
              <th scope="col" className="assistant-sidebar__cell">
                Item
              </th>
              <th
                scope="col"
                className="assistant-sidebar__cell assistant-sidebar__cell--number"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.what}>
                <td className="assistant-sidebar__cell">{line.what}</td>
                <td className="assistant-sidebar__cell assistant-sidebar__cell--number">
                  {line.amount}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="assistant-sidebar__cell">
                Total
              </th>
              <td className="assistant-sidebar__cell assistant-sidebar__cell--number">
                {invoice.total}
              </td>
            </tr>
          </tfoot>
        </table>
      </main>

      <aside
        id="assistant-sidebar-panel"
        className="assistant-sidebar__panel"
        aria-labelledby="assistant-sidebar-name"
        hidden={!open}
      >
        <header className="assistant-sidebar__bar">
          <div className="assistant-sidebar__who">
            <h2
              ref={heading}
              id="assistant-sidebar-name"
              className="assistant-sidebar__name"
              tabIndex={-1}
            >
              Assistant
            </h2>
            <p className="assistant-sidebar__about">
              Answers about {invoice.number}
            </p>
          </div>
          <Button
            intent="ghost"
            className="assistant-sidebar__close"
            aria-label="Close the assistant"
            onClick={() => show(false)}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </header>

        {/* Only while the panel is open, so that each time it opens the
            conversation starts at its end. The messages are kept above. */}
        {open ? (
          <Conversation className="assistant-sidebar__conversation">
            <ConversationContent
              aria-label={`Conversation about ${invoice.number}`}
            >
              {turns.length === 0 && !reply ? (
                <ConversationEmpty>
                  <p className="assistant-sidebar__hello">
                    Ask about this invoice.
                  </p>
                  <PromptSuggestions>
                    {starters.map((starter) => (
                      <PromptSuggestion
                        key={starter}
                        onClick={() => ask(starter)}
                      >
                        {starter}
                      </PromptSuggestion>
                    ))}
                  </PromptSuggestions>
                </ConversationEmpty>
              ) : null}

              {turns.map((turn) => (
                <Message key={turn.id} from={turn.from}>
                  <MessageContent>{turn.text}</MessageContent>
                  {turn.from === "assistant" ? (
                    <MessageActions>
                      <MessageCopyAction text={turn.text} />
                    </MessageActions>
                  ) : null}
                </Message>
              ))}

              {reply ? (
                <Message from="assistant" streaming>
                  {reply.count === 0 ? (
                    <MessageLoader />
                  ) : (
                    <MessageContent>
                      {reply.words.slice(0, reply.count).join(" ")}
                    </MessageContent>
                  )}
                </Message>
              ) : null}
            </ConversationContent>
            <ConversationScrollButton />

            <div className="assistant-sidebar__foot">
              <PromptInput busy={reply !== null} onStop={stop} onSubmit={ask}>
                <PromptInputTextarea
                  aria-label={`Question about ${invoice.number}`}
                  placeholder="Ask about this invoice"
                />
                <PromptInputToolbar>
                  <PromptInputSubmit />
                </PromptInputToolbar>
              </PromptInput>
              <p className="assistant-sidebar__note">
                Written by a model, and can be wrong.
              </p>
            </div>
          </Conversation>
        ) : null}
      </aside>
    </div>
  );
}
