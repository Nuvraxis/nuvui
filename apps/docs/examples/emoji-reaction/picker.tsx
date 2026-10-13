"use client";

import { EmojiPicker, EmojiReaction } from "@nuvui/emoji";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";
import { type CSSProperties, useRef, useState } from "react";

interface Reaction {
  emoji: string;
  label: string;
  others: number;
  mine: boolean;
}

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

export default function Example() {
  const [reactions, setReactions] = useState<Reaction[]>([
    { emoji: "👍", label: "thumbs up", others: 2, mine: false },
  ]);
  const [open, setOpen] = useState(false);
  const add = useRef<HTMLButtonElement>(null);

  // An emoji that's there is joined, or the reader's is taken away. A
  // reaction nobody is left on is taken off the row.
  function react(emoji: string, label: string) {
    const there = reactions.find((entry) => same(entry.emoji, emoji));
    // Its button is about to go, and the focus with it unless it's given
    // somewhere to be.
    if (there?.mine && there.others === 0) add.current?.focus();
    setReactions((now) =>
      there
        ? now
            .map((entry) =>
              same(entry.emoji, emoji)
                ? { ...entry, mine: !entry.mine }
                : entry,
            )
            .filter((entry) => entry.mine || entry.others > 0)
        : [...now, { emoji, label, others: 0, mine: true }],
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          label={reaction.label}
          count={reaction.others + (reaction.mine ? 1 : 0)}
          pressed={reaction.mine}
          onPressedChange={() => react(reaction.emoji, reaction.label)}
        />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button ref={add} intent="secondary" size="sm">
            Add reaction
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Pick an emoji" align="start" style={bare}>
          <EmojiPicker
            autoFocus
            onEmojiSelect={(emoji, item) => {
              react(emoji, item.label);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
