"use client";

import { EmojiPicker } from "@nuvui/emoji";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const versions = ["13", "14", "15", "16", "17"] as const;

export function EmojiPickerPlayground() {
  const [flags, setFlags] = useState(true);
  const [remember, setRemember] = useState(false);
  const [version, setVersion] = useState<(typeof versions)[number]>("15");
  const [picked, setPicked] = useState("");

  const props = [
    version === "15" ? "" : ` emojiVersion={${version}}`,
    flags ? "" : " flags={false}",
    remember ? "" : " storageKey={null}",
  ].join("");
  const code = `<EmojiPicker${props} onEmojiSelect={(emoji) => add(emoji)} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="emojiVersion"
            value={version}
            options={versions}
            onChange={setVersion}
          />
          <CheckboxControl label="flags" checked={flags} onChange={setFlags} />
          <CheckboxControl
            label="remember"
            checked={remember}
            onChange={setRemember}
          />
        </>
      }
    >
      <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
        <EmojiPicker
          emojiVersion={Number(version)}
          flags={flags ? "auto" : false}
          storageKey={remember ? "nuvui-emoji-playground" : null}
          onEmojiSelect={(emoji) => setPicked(emoji)}
        />
        <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
          {picked ? `You picked ${picked}` : "Nothing picked yet"}
        </p>
      </div>
    </Playground>
  );
}
