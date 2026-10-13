"use client";

import { EmojiPicker, EmojiReaction } from "@nuvui/emoji";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";
import { type CSSProperties, useRef, useState } from "react";
import "./message-reactions.scss";

interface Reaction {
  emoji: string;
  // What it's read as, since an emoji's own name varies from one screen
  // reader to the next.
  name: string;
  // Who else reacted with it. You're counted on top when `mine` is true.
  others: number;
  mine: boolean;
}

interface Message {
  id: number;
  author: string;
  when: string;
  text: string;
  reactions: Reaction[];
}

// Made up, and stands in for the messages your server has kept.
const kept: Message[] = [
  {
    id: 1,
    author: "Priya Nair",
    when: "10:02",
    text: "The Contoso renewal is signed. Three years, all forty seats.",
    reactions: [
      { emoji: "🎉", name: "party popper", others: 4, mine: true },
      { emoji: "👏", name: "clapping hands", others: 2, mine: false },
    ],
  },
  {
    id: 2,
    author: "Tom Becker",
    when: "10:05",
    text: "Invoice goes out on Monday. I'll need the purchase order number before then.",
    reactions: [],
  },
];

// The popover is the picker's edge, so it gives up its own width and
// padding, and the picker its border.
const bare = {
  "--nuv-popover-width": "auto",
  "--nuv-popover-padding": "0px",
  "--nuv-emoji-picker-border": "transparent",
} as CSSProperties;

// The same emoji is written with or without a mark that asks for it to be
// drawn in color, and the picker's list writes it for some. Compared
// without it, a thumbs up that's there is joined and not added twice.
const plain = (emoji: string) => emoji.replaceAll("\uFE0F", "");
const same = (one: string, other: string) => plain(one) === plain(other);

export default function MessageReactions() {
  const [messages, setMessages] = useState(kept);
  // Which message's picker is open, if any.
  const [open, setOpen] = useState<number | null>(null);
  const [said, setSaid] = useState("");
  // Each message's button for adding a reaction, to give the focus to
  // when the reaction that had it is taken away.
  const adders = useRef(new Map<number, HTMLButtonElement>());

  // Reacting with an emoji that's there joins it, or takes yours away.
  // One that isn't there is added at the end.
  function react(id: number, emoji: string, name: string) {
    setMessages((now) =>
      now.map((message) => {
        if (message.id !== id) return message;
        const there = message.reactions.find((entry) =>
          same(entry.emoji, emoji),
        );
        const reactions = there
          ? message.reactions
              .map((entry) =>
                same(entry.emoji, emoji)
                  ? { ...entry, mine: !entry.mine }
                  : entry,
              )
              .filter((entry) => entry.mine || entry.others > 0)
          : [...message.reactions, { emoji, name, others: 0, mine: true }];
        return { ...message, reactions };
      }),
    );
    const message = messages.find((entry) => entry.id === id);
    const before = message?.reactions.find((entry) => same(entry.emoji, emoji));
    const mine = before?.mine;
    // The last one of a reaction was yours: its button goes, and the
    // focus with it unless it's given somewhere to be.
    if (before?.mine && before.others === 0) {
      requestAnimationFrame(() => adders.current.get(id)?.focus());
    }
    setSaid(
      mine
        ? `Took your ${name} off ${message?.author}'s message.`
        : `Reacted to ${message?.author}'s message with ${name}.`,
    );
  }

  return (
    <main className="message-reactions">
      <h1 className="message-reactions__title">Sales</h1>
      <ol className="message-reactions__list">
        {messages.map((message) => (
          <li key={message.id} className="message-reactions__message">
            <p className="message-reactions__by">
              <span className="message-reactions__author">
                {message.author}
              </span>
              <span className="message-reactions__when">{message.when}</span>
            </p>
            <p className="message-reactions__text">{message.text}</p>
            <div className="message-reactions__row">
              {message.reactions.map((reaction) => (
                <EmojiReaction
                  key={reaction.emoji}
                  emoji={reaction.emoji}
                  label={reaction.name}
                  count={reaction.others + (reaction.mine ? 1 : 0)}
                  pressed={reaction.mine}
                  onPressedChange={() =>
                    react(message.id, reaction.emoji, reaction.name)
                  }
                />
              ))}
              <Popover
                open={open === message.id}
                onOpenChange={(next) => setOpen(next ? message.id : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    ref={(button) => {
                      if (button) adders.current.set(message.id, button);
                      else adders.current.delete(message.id);
                    }}
                    intent="secondary"
                    size="sm"
                    aria-label={`Add a reaction to ${message.author}'s message`}
                  >
                    Add reaction
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  aria-label="Pick an emoji"
                  align="start"
                  style={bare}
                >
                  <EmojiPicker
                    autoFocus
                    onEmojiSelect={(emoji, item) => {
                      react(message.id, emoji, item.label);
                      setOpen(null);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </li>
        ))}
      </ol>
      <p className="message-reactions__said" role="status">
        {said}
      </p>
    </main>
  );
}
