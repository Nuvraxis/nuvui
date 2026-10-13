"use client";

import { EmojiReaction } from "@nuvui/emoji";
import { useState } from "react";

// Made up, and stands in for what your server has kept: who else reacted,
// and whether the reader did.
const kept = [
  { emoji: "🎉", label: "party popper", others: 4, mine: true },
  { emoji: "👏", label: "clapping hands", others: 2, mine: false },
  { emoji: "👍", label: "thumbs up", others: 11, mine: false },
];

export default function Example() {
  const [reactions, setReactions] = useState(kept);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          label={reaction.label}
          count={reaction.others + (reaction.mine ? 1 : 0)}
          pressed={reaction.mine}
          onPressedChange={(mine) =>
            setReactions((now) =>
              now.map((entry) =>
                entry.emoji === reaction.emoji ? { ...entry, mine } : entry,
              ),
            )
          }
        />
      ))}
    </div>
  );
}
