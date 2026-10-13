"use client";

import { EmojiPicker } from "@nuvui/emoji";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";
import { type CSSProperties, useState } from "react";

// The popover is the panel's edge here, so it gives up its own width and
// padding, and the picker gives up its border.
const bare = {
  "--nuv-popover-width": "auto",
  "--nuv-popover-padding": "0px",
  "--nuv-emoji-picker-border": "transparent",
} as CSSProperties;

export default function Example() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Shipped");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <p style={{ margin: 0 }} data-text>
        {text}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button intent="secondary">Add an emoji</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Pick an emoji" align="start" style={bare}>
          <EmojiPicker
            autoFocus
            onEmojiSelect={(emoji) => {
              setText((now) => `${now} ${emoji}`);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
