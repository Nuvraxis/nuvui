"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageMeta,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { Avatar, AvatarFallback, Badge, Button } from "@nuvui/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./team-chat.scss";

// Made-up people and made-up messages. Nothing here is sent anywhere: a
// real one loads each conversation from your server and posts to it.

interface Line {
  id: number;
  // Who wrote it, or nobody's name for the person reading.
  from: string | null;
  text: string;
  when: string;
}

interface Thread {
  id: string;
  name: string;
  about: string;
  unread: number;
  lines: Line[];
}

const threads: Thread[] = [
  {
    id: "grace",
    name: "Grace Hopper",
    about: "Finance",
    unread: 2,
    lines: [
      {
        id: 1,
        from: null,
        text: "Morning. Is the October close still on for Friday?",
        when: "9:12",
      },
      {
        id: 2,
        from: "Grace Hopper",
        text: "It is. Two invoices are holding it up, both from Contoso.",
        when: "9:15",
      },
      {
        id: 3,
        from: "Grace Hopper",
        text: "Can you chase them today? I've put the numbers in the sheet.",
        when: "9:16",
      },
    ],
  },
  {
    id: "launch",
    name: "Launch team",
    about: "Four people",
    unread: 0,
    lines: [
      {
        id: 1,
        from: "Alan Turing",
        text: "The pricing page is ready to look at.",
        when: "Yesterday",
      },
      {
        id: 2,
        from: "Ada Lovelace",
        text: "Read it. The yearly price is missing its currency on a phone.",
        when: "Yesterday",
      },
      {
        id: 3,
        from: null,
        text: "Good catch. I'll fix that before the review.",
        when: "Yesterday",
      },
      {
        id: 4,
        from: "Alan Turing",
        text: "Thanks. Review is at two tomorrow.",
        when: "Yesterday",
      },
    ],
  },
  {
    id: "katherine",
    name: "Katherine Johnson",
    about: "Operations",
    unread: 0,
    lines: [
      {
        id: 1,
        from: "Katherine Johnson",
        text: "The carrier moved Thursday's pickup to the afternoon.",
        when: "Monday",
      },
      {
        id: 2,
        from: null,
        text: "Thanks for the warning. I'll tell the warehouse.",
        when: "Monday",
      },
    ],
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

export default function TeamChat() {
  const [all, setAll] = useState(threads);
  const [openId, setOpenId] = useState(threads[0]?.id);
  // On a narrow screen one of the two is shown: the list, or a conversation.
  const [view, setView] = useState<"list" | "thread">("list");
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const heading = useRef<HTMLHeadingElement>(null);
  // Set by a press, and used up by the effect that follows it.
  const moved = useRef<"in" | "out" | null>(null);
  const thread = all.find((item) => item.id === openId) ?? all[0];

  // Where the two are side by side, focus stays on what was pressed. Where
  // one replaces the other, what was pressed is gone, and focus goes to
  // the top of what's shown in its place.
  useEffect(() => {
    const row = openId ? rows.current.get(openId) : undefined;
    if (view === "thread" && moved.current === "in") {
      if (row?.offsetParent === null) heading.current?.focus();
    }
    if (view === "list" && moved.current === "out") row?.focus();
    moved.current = null;
  }, [view, openId]);

  if (!thread) return null;

  function open(id: string) {
    moved.current = "in";
    setOpenId(id);
    setView("thread");
    setAll((now) =>
      now.map((item) => (item.id === id ? { ...item, unread: 0 } : item)),
    );
  }

  function send(text: string) {
    setAll((now) =>
      now.map((item) =>
        item.id === openId
          ? {
              ...item,
              lines: [
                ...item.lines,
                {
                  id: item.lines.length + 1,
                  from: null,
                  text,
                  when: "Just now",
                },
              ],
            }
          : item,
      ),
    );
  }

  return (
    <main className="team-chat" data-view={view}>
      <section className="team-chat__list" aria-labelledby="team-chat-title">
        <h1 id="team-chat-title" className="team-chat__title">
          Messages
        </h1>
        <ul className="team-chat__threads">
          {all.map((item) => {
            const last = item.lines.at(-1);
            return (
              <li key={item.id}>
                <button
                  ref={(node) => {
                    if (node) rows.current.set(item.id, node);
                    else rows.current.delete(item.id);
                  }}
                  type="button"
                  className="team-chat__row"
                  aria-current={item.id === thread.id ? "true" : undefined}
                  onClick={() => open(item.id)}
                >
                  <Avatar
                    size="md"
                    className="team-chat__picture"
                    aria-hidden="true"
                  >
                    <AvatarFallback>{initials(item.name)}</AvatarFallback>
                  </Avatar>
                  <span className="team-chat__summary">
                    <span className="team-chat__name">{item.name}</span>
                    <span className="team-chat__last">
                      {last?.from === null ? "You: " : ""}
                      {last?.text}
                    </span>
                  </span>
                  <span className="team-chat__side">
                    <span className="team-chat__when">{last?.when}</span>
                    {item.unread > 0 ? (
                      <Badge intent="primary">{item.unread} new</Badge>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="team-chat__thread" aria-labelledby="team-chat-with">
        <header className="team-chat__head">
          <Button
            intent="ghost"
            className="team-chat__back"
            aria-label="Back to all messages"
            onClick={() => {
              moved.current = "out";
              setView("list");
            }}
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </Button>
          <Avatar size="sm" aria-hidden="true">
            <AvatarFallback>{initials(thread.name)}</AvatarFallback>
          </Avatar>
          <div className="team-chat__who">
            <h2
              ref={heading}
              id="team-chat-with"
              className="team-chat__with"
              tabIndex={-1}
            >
              {thread.name}
            </h2>
            <p className="team-chat__about">{thread.about}</p>
          </div>
        </header>

        {/* A conversation of its own for each, so that opening another
            starts at its end and not where the last one was scrolled to. */}
        <Conversation key={thread.id} className="team-chat__conversation">
          <ConversationContent aria-label={`Messages with ${thread.name}`}>
            {thread.lines.map((line) =>
              line.from === null ? (
                <Message key={line.id} from="user">
                  <MessageContent>{line.text}</MessageContent>
                  <MessageMeta>{line.when}</MessageMeta>
                </Message>
              ) : (
                // The name is in the line above the message, for everyone,
                // so the words for a screen reader alone aren't needed.
                <Message
                  key={line.id}
                  from="assistant"
                  label={null}
                  avatar={
                    <Avatar size="sm">
                      <AvatarFallback>{initials(line.from)}</AvatarFallback>
                    </Avatar>
                  }
                >
                  <MessageMeta>
                    <span className="team-chat__author">{line.from}</span>{" "}
                    {line.when}
                  </MessageMeta>
                  <MessageContent>{line.text}</MessageContent>
                </Message>
              ),
            )}
          </ConversationContent>
          <ConversationScrollButton />

          <div className="team-chat__foot">
            <PromptInput onSubmit={send}>
              <PromptInputTextarea
                aria-label={`Message to ${thread.name}`}
                placeholder={`Message ${thread.name}`}
              />
              <PromptInputToolbar>
                <PromptInputSubmit />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </Conversation>
      </section>
    </main>
  );
}
