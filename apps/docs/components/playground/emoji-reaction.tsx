"use client";

import { EmojiReaction } from "@nuvui/emoji";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const emoji = {
  "thumbs up": "👍",
  "party popper": "🎉",
  "red heart": "❤️",
} as const;
const names = Object.keys(emoji) as (keyof typeof emoji)[];

export function EmojiReactionPlayground() {
  const [name, setName] = useState<keyof typeof emoji>("thumbs up");
  const [pressed, setPressed] = useState(false);
  const [disabled, setDisabled] = useState(false);
  // Three others reacted, and the reader is counted on top.
  const count = 3 + (pressed ? 1 : 0);

  const props = [
    ` emoji="${emoji[name]}"`,
    ` label="${name}"`,
    ` count={${count}}`,
    pressed ? " pressed" : "",
    disabled ? " disabled" : "",
  ].join("");
  const code = `<EmojiReaction${props} onPressedChange={setMine} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="emoji"
            value={name}
            options={names}
            onChange={setName}
          />
          <CheckboxControl
            label="pressed"
            checked={pressed}
            onChange={setPressed}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <EmojiReaction
        emoji={emoji[name]}
        label={name}
        count={count}
        pressed={pressed}
        disabled={disabled}
        onPressedChange={setPressed}
      />
    </Playground>
  );
}
