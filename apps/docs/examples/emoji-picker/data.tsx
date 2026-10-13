"use client";

import { type EmojiItem, EmojiPicker } from "@nuvui/emoji";
import type { CSSProperties } from "react";
import { useState } from "react";

// The few a comment can be answered with, named in Dutch.
const reactions: EmojiItem[] = [
  { emoji: "👍", label: "duim omhoog", tags: ["goed", "ja"], group: "people" },
  {
    emoji: "👎",
    label: "duim omlaag",
    tags: ["slecht", "nee"],
    group: "people",
  },
  { emoji: "👏", label: "klappende handen", tags: ["bravo"], group: "people" },
  { emoji: "😀", label: "grijnzend gezicht", tags: ["blij"], group: "smileys" },
  {
    emoji: "😢",
    label: "huilend gezicht",
    tags: ["verdrietig"],
    group: "smileys",
  },
  {
    emoji: "🎉",
    label: "feestknaller",
    tags: ["feest", "hoera"],
    group: "activities",
  },
  { emoji: "❤️", label: "rood hart", tags: ["liefde"], group: "symbols" },
];

const small = { "--nuv-emoji-picker-height": "16rem" } as CSSProperties;

export default function Example() {
  const [picked, setPicked] = useState("");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <EmojiPicker
        data={reactions}
        storageKey={null}
        style={small}
        onEmojiSelect={(emoji, item) => setPicked(`${emoji} ${item.label}`)}
        labels={{
          search: "Emoji zoeken",
          list: "Emoji's",
          groups: "Groepen",
          results: "Gevonden",
          skinTone: "Huidskleur",
          skinTones: [
            "Standaard",
            "Licht",
            "Lichtgetint",
            "Getint",
            "Donkergetint",
            "Donker",
          ],
          group: {
            smileys: "Gezichten",
            people: "Mensen",
            activities: "Activiteiten",
            symbols: "Symbolen",
          },
          found: (count) =>
            count === 0 ? "Niets gevonden" : `${count} gevonden`,
        }}
      />
      <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        {picked}
      </p>
    </div>
  );
}
