"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
} from "@nuvui/chat";
import {
  Avatar,
  AvatarFallback,
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";
import { Bot, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./support-chat.scss";

type Line =
  | { id: number; kind: "message"; from: "user" | "assistant"; text: string }
  | { id: number; kind: "notice"; text: string };

// A stand-in for a help desk. A real one is your server's: this picks an
// answer by a word in the question, after a wait. The order, the dates and
// the times are made up.
const answers = [
  {
    about: "order",
    text: "Order NW-48213 left the warehouse yesterday and is due on Thursday. The tracking link is in the email we sent when it shipped.",
  },
  {
    about: "address",
    text: "The address can be changed until the parcel leaves the warehouse. Order NW-48213 has left already, so the carrier has to do it: the tracking page has a link for that.",
  },
  {
    about: "refund",
    text: "A refund goes back to the card you paid with, within five working days of the parcel reaching us.",
  },
];
const fallback =
  'I don\'t have an answer to that one. Choose "Talk to a person" and the support team will pick it up from here.';

const starters = [
  "Where is my order?",
  "Change my delivery address",
  "Talk to a person",
];

const hello: Line = {
  id: 0,
  kind: "message",
  from: "assistant",
  text: "Hello. I can answer questions about orders, deliveries and refunds, or pass you to a person.",
};

const picture = (
  <Avatar size="sm">
    <AvatarFallback>
      <Bot aria-hidden="true" size={16} />
    </AvatarFallback>
  </Avatar>
);

export default function SupportChat() {
  const [lines, setLines] = useState<Line[]>([hello]);
  const [typing, setTyping] = useState(false);
  // Once a person has the conversation, the automatic answers stop.
  const [handed, setHanded] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const next = useRef(1);

  useEffect(() => () => clearTimeout(timer.current), []);

  function say(from: "user" | "assistant", text: string) {
    const id = next.current;
    next.current += 1;
    setLines((now) => [...now, { id, kind: "message", from, text }]);
  }

  function note(text: string) {
    const id = next.current;
    next.current += 1;
    setLines((now) => [...now, { id, kind: "notice", text }]);
  }

  function ask(question: string) {
    say("user", question);
    if (handed) return;

    const asked = question.toLowerCase();
    const person = asked.includes("person");
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      if (person) {
        setHanded(true);
        say(
          "assistant",
          "I've passed this conversation to the support team. They can see everything above, so there's no need to say it again.",
        );
        note("With the support team. Replies usually take about ten minutes.");
        return;
      }
      say(
        "assistant",
        answers.find(({ about }) => asked.includes(about))?.text ?? fallback,
      );
    }, 1400);
  }

  const started = lines.some(
    (line) => line.kind === "message" && line.from === "user",
  );

  return (
    <main className="support-chat">
      <h1 className="support-chat__title">Help center</h1>
      <p className="support-chat__text">
        Most questions about orders, deliveries and refunds are answered here.
        For anything else, open the chat at the bottom of the screen.
      </p>
      <ul className="support-chat__topics">
        <li className="support-chat__topic">Tracking a parcel</li>
        <li className="support-chat__topic">Sending something back</li>
        <li className="support-chat__topic">Changing an order</li>
      </ul>

      <Popover>
        <PopoverTrigger asChild>
          <Button className="support-chat__launcher">
            <MessageCircle aria-hidden="true" size={18} />
            Chat with us
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          aria-label="Chat with support"
          className="support-chat__panel"
          // With a keyboard, start in the field. On a touch screen that
          // would bring the keyboard up over the conversation before
          // anything had been read, so focus stays where Radix puts it.
          onOpenAutoFocus={(event) => {
            if (!window.matchMedia("(pointer: fine)").matches) return;
            event.preventDefault();
            field.current?.focus();
          }}
        >
          <div className="support-chat__window">
            <header className="support-chat__head">
              {picture}
              <div className="support-chat__who">
                <h2 className="support-chat__name">Northwind support</h2>
                <p className="support-chat__status">
                  {handed
                    ? "With the support team"
                    : "Automatic answers, and a person when you need one"}
                </p>
              </div>
              <PopoverClose asChild>
                <Button
                  intent="ghost"
                  className="support-chat__close"
                  aria-label="Close the chat"
                >
                  <X aria-hidden="true" size={18} />
                </Button>
              </PopoverClose>
            </header>

            <Conversation className="support-chat__conversation">
              <ConversationContent aria-label="Conversation with support">
                {lines.map((line) =>
                  line.kind === "notice" ? (
                    <p key={line.id} className="support-chat__notice">
                      {line.text}
                    </p>
                  ) : (
                    <Message
                      key={line.id}
                      from={line.from}
                      label={line.from === "user" ? "You" : "Support"}
                      avatar={line.from === "assistant" ? picture : undefined}
                    >
                      <MessageContent>{line.text}</MessageContent>
                    </Message>
                  ),
                )}

                {typing ? (
                  <Message
                    from="assistant"
                    label="Support"
                    avatar={picture}
                    streaming
                  >
                    <MessageLoader />
                  </Message>
                ) : null}

                {started ? null : (
                  <PromptSuggestions className="support-chat__starters">
                    {starters.map((starter) => (
                      <PromptSuggestion
                        key={starter}
                        onClick={() => ask(starter)}
                      >
                        {starter}
                      </PromptSuggestion>
                    ))}
                  </PromptSuggestions>
                )}
              </ConversationContent>
              <ConversationScrollButton />

              <div className="support-chat__foot">
                <PromptInput busy={typing} onSubmit={ask}>
                  <PromptInputTextarea
                    ref={field}
                    aria-label="Message to support"
                    placeholder="Write a message"
                  />
                  <PromptInputToolbar>
                    <PromptInputSubmit />
                  </PromptInputToolbar>
                </PromptInput>
              </div>
            </Conversation>
          </div>
        </PopoverContent>
      </Popover>
    </main>
  );
}
