import { EmojiReaction } from "@nuvui/emoji";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export default function Example() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <EmojiReaction emoji="🚀" label="rocket" count={1284} pressed>
        {compact.format(1284)}
      </EmojiReaction>
      <EmojiReaction emoji="👀" label="eyes" count={3} disabled />
    </div>
  );
}
