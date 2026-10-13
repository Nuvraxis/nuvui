"use client";

import { EmojiPicker } from "@nuvui/emoji";
import { useState } from "react";

export default function Example() {
  const [picked, setPicked] = useState("");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <EmojiPicker onEmojiSelect={(emoji) => setPicked(emoji)} />
      <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        {picked ? `You picked ${picked}` : "Nothing picked yet"}
      </p>
    </div>
  );
}
