/** The groups emoji are listed in, in the order Unicode lists them. */
export const emojiGroups = [
  "smileys",
  "people",
  "animals",
  "food",
  "travel",
  "activities",
  "objects",
  "symbols",
  "flags",
] as const;

export type EmojiGroup = (typeof emojiGroups)[number];

/** One emoji, as the picker lists it. */
export interface EmojiItem {
  /** The emoji itself, as text. */
  emoji: string;
  /** Its name, which is what's read out and what's searched. */
  label: string;
  /** Other words it's found by. */
  tags?: string[];
  group: EmojiGroup;
  /**
   * The version of Emoji it came in. One newer than the picker's
   * `emojiVersion` is left out.
   */
  version?: number;
  /**
   * The same emoji in the five skin tones, from light to dark, where it
   * has them.
   */
  skins?: string[];
}

// The built-in list is kept as rows, which are a third smaller than
// objects: the emoji, its name, its other words in one string, the place
// of its group in the list above, its version, and its skin tones.
export type EmojiRow =
  | [string, string, string, number, number]
  | [string, string, string, number, number, string[]];

export function toItems(rows: EmojiRow[]): EmojiItem[] {
  return rows.map(([emoji, label, tags, group, version, skins]) => ({
    emoji,
    label,
    tags: tags ? tags.split(" ") : undefined,
    group: emojiGroups[group] as EmojiGroup,
    version,
    skins,
  }));
}
