"use client";

import { EmojiPicker, type EmojiSkinTone } from "@nuvui/emoji";
import { useState } from "react";

export default function Example() {
  // Kept here, where an app would keep them with the account, so they
  // follow someone from one device to the next.
  const [recent, setRecent] = useState(["👍", "🎉", "🚀"]);
  const [tone, setTone] = useState<EmojiSkinTone>(3);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <EmojiPicker
        storageKey={null}
        recent={recent}
        onRecentChange={setRecent}
        skinTone={tone}
        onSkinToneChange={setTone}
      />
      <p style={{ margin: 0, fontSize: "var(--text-sm)" }} data-kept>
        Recent: {recent.join(" ")}. Skin tone: {tone}.
      </p>
    </div>
  );
}
