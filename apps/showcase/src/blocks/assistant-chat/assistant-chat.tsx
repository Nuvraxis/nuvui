"use client";

import {
  Attachment,
  Attachments,
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageCopyAction,
  MessageLoader,
  PromptInput,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import { Badge, NativeSelect } from "@nuvui/react";
import { useEffect, useRef, useState } from "react";
import "./assistant-chat.scss";

type Turn = {
  id: number;
  from: "user" | "assistant";
  text: string;
  // What was sent with it: the names and sizes, which is all that's shown.
  files?: { name: string; size: number }[];
};

// A stand-in for a model. A real one is fetched from your server: this
// picks an answer by a word in the question and hands it out a few words
// at a time. Every figure in it is made up. The answers are markdown, as
// a model's are.
const answers = [
  {
    about: "paid",
    text: "Two invoices are overdue.\n\n| Invoice | Customer | Amount | Days late |\n| :-- | :-- | --: | --: |\n| INV-1042 | Contoso | 4,200 | 12 |\n| INV-1057 | Fabrikam | 1,850 | 3 |\n\nEveryone else has paid, or isn't due yet.",
  },
  {
    about: "summar",
    text: "In September you sent **38 invoices** worth **96,400** in all.\n\n- 33 are paid\n- 3 are due this week\n- 2 are overdue\n\nThat's 8% more invoiced than in August, most of it from three new customers on the Team plan.",
  },
  {
    about: "remind",
    text: "Here's a draft:\n\n> Hello,\n>\n> This is a reminder that invoice **INV-1042** for 4,200 was due on 29 September. If it's already on its way, thank you, and please ignore this.\n>\n> Kind regards,  \n> Northwind",
  },
];
const fallback =
  "I can answer questions about your invoices, your customers and what's overdue. Try one of the suggestions, or ask in your own words.";

const starters = [
  "Who hasn't paid yet?",
  "Summarize last month's invoices",
  "Draft a reminder for an overdue invoice",
];

function answerTo(question: string) {
  const asked = question.toLowerCase();
  return answers.find(({ about }) => asked.includes(about))?.text ?? fallback;
}

export default function AssistantChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  // The reply on its way: its words, and how many have arrived.
  const [reply, setReply] = useState<{ words: string[]; count: number } | null>(
    null,
  );
  const [scope, setScope] = useState("All customers");
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const next = useRef(1);

  useEffect(() => () => clearInterval(timer.current), []);

  function add(from: Turn["from"], text: string, files?: Turn["files"]) {
    const id = next.current;
    next.current += 1;
    setTurns((now) => [...now, { id, from, text, files }]);
  }

  function ask(question: string, files: File[] = []) {
    add(
      "user",
      question,
      files.map(({ name, size }) => ({ name, size })),
    );
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

  // The same question again, for another answer.
  function again(index: number) {
    const question = turns[index - 1];
    if (!question || reply) return;
    setTurns((now) => now.slice(0, index - 1));
    ask(question.text);
  }

  return (
    <main className="assistant-chat">
      <header className="assistant-chat__head">
        <h1 className="assistant-chat__title">Billing assistant</h1>
        <Badge variant="outline">Preview</Badge>
      </header>

      <Conversation className="assistant-chat__conversation">
        <ConversationContent aria-label="Conversation with the billing assistant">
          {turns.length === 0 && !reply ? (
            <ConversationEmpty>
              <p className="assistant-chat__hello">
                Ask about invoices, customers and what's overdue.
              </p>
              <PromptSuggestions>
                {starters.map((starter) => (
                  <PromptSuggestion key={starter} onClick={() => ask(starter)}>
                    {starter}
                  </PromptSuggestion>
                ))}
              </PromptSuggestions>
            </ConversationEmpty>
          ) : null}

          {turns.map((turn, index) => (
            <Message key={turn.id} from={turn.from}>
              {turn.text ? (
                <MessageContent>
                  {turn.from === "assistant" ? (
                    <Markdown headingOffset={1}>{turn.text}</Markdown>
                  ) : (
                    turn.text
                  )}
                </MessageContent>
              ) : null}
              {turn.files && turn.files.length > 0 ? (
                <Attachments aria-label="Files with this message">
                  {turn.files.map((file) => (
                    <Attachment key={file.name} {...file} />
                  ))}
                </Attachments>
              ) : null}
              {turn.from === "assistant" ? (
                <MessageActions>
                  <MessageCopyAction text={turn.text} />
                  <MessageAction
                    label="Try again"
                    disabled={reply !== null}
                    onClick={() => again(index)}
                  >
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v2.5H11" />
                    </svg>
                  </MessageAction>
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
                  <Markdown streaming headingOffset={1}>
                    {reply.words.slice(0, reply.count).join(" ")}
                  </Markdown>
                </MessageContent>
              )}
            </Message>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />

        <div className="assistant-chat__foot">
          <PromptInput
            busy={reply !== null}
            maxFiles={4}
            onStop={stop}
            onSubmit={(text, { files }) => ask(text, files)}
          >
            <PromptInputAttachments />
            <PromptInputTextarea
              aria-label="Message to the billing assistant"
              placeholder="Ask about your invoices"
            />
            <PromptInputToolbar>
              <PromptInputTools className="assistant-chat__tools">
                <PromptInputAttach />
                <NativeSelect
                  className="assistant-chat__scope"
                  aria-label="Which customers to look at"
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                >
                  <option>All customers</option>
                  <option>Overdue only</option>
                  <option>New this quarter</option>
                </NativeSelect>
              </PromptInputTools>
              <PromptInputSubmit />
            </PromptInputToolbar>
          </PromptInput>
          <p className="assistant-chat__note">
            Answers are written by a model and can be wrong. Check a figure
            before you act on it.
          </p>
        </div>
      </Conversation>
    </main>
  );
}
