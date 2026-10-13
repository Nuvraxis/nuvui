"use client";

import { EmojiPicker } from "@nuvui/emoji";
import {
  Button,
  Input,
  NativeSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";
import { type CSSProperties, type FormEvent, useId, useState } from "react";
import "./set-status.scss";

interface Status {
  emoji: string;
  // The emoji's name, which is what's read where the emoji is drawn.
  name: string;
  text: string;
  until: string;
}

// Made up, and stands in for the status your server has kept.
const kept: Status = {
  emoji: "🏖️",
  name: "beach with umbrella",
  text: "On holiday",
  until: "week",
};

const lasts: Record<string, string> = {
  hour: "for an hour",
  today: "until the end of today",
  week: "until the end of this week",
  never: "until you clear it",
};

// The popover is the picker's edge, so it gives up its own width and
// padding, and the picker its border.
const bare = {
  "--nuv-popover-width": "auto",
  "--nuv-popover-padding": "0px",
  "--nuv-emoji-picker-border": "transparent",
} as CSSProperties;

export default function SetStatus() {
  const id = useId();
  const [saved, setSaved] = useState<Status | null>(kept);
  const [emoji, setEmoji] = useState(kept.emoji);
  const [name, setName] = useState(kept.name);
  const [text, setText] = useState(kept.text);
  const [until, setUntil] = useState(kept.until);
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    if (text.trim() === "") {
      setMissing(true);
      return;
    }
    // Here the status goes to your server.
    setSaved({ emoji, name, text: text.trim(), until });
  }

  function clear() {
    setSaved(null);
    setEmoji("💬");
    setName("speech balloon");
    setText("");
    setUntil("today");
    setMissing(false);
  }

  return (
    <main className="set-status">
      <header className="set-status__head">
        <h1 className="set-status__title">Your status</h1>
        <p className="set-status__text">
          Shown beside your name to everyone in the workspace.
        </p>
      </header>
      <p className="set-status__now" role="status">
        {saved ? (
          <>
            <span role="img" aria-label={saved.name}>
              {saved.emoji}
            </span>{" "}
            {saved.text}, {lasts[saved.until]}
          </>
        ) : (
          "No status set"
        )}
      </p>
      <form className="set-status__form" onSubmit={save} noValidate>
        <div className="set-status__field">
          <label className="set-status__label" htmlFor={`${id}-text`}>
            Status
          </label>
          <div className="set-status__line">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  intent="secondary"
                  aria-label={`Emoji: ${name}. Change it`}
                  className="set-status__emoji"
                >
                  <span aria-hidden="true">{emoji}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                aria-label="Pick an emoji"
                align="start"
                style={bare}
              >
                <EmojiPicker
                  autoFocus
                  onEmojiSelect={(picked, item) => {
                    setEmoji(picked);
                    setName(item.label);
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <Input
              id={`${id}-text`}
              value={text}
              maxLength={80}
              placeholder="What are you up to?"
              aria-required
              aria-invalid={missing || undefined}
              aria-describedby={missing ? `${id}-error` : undefined}
              onChange={(event) => {
                setText(event.target.value);
                setMissing(false);
              }}
            />
          </div>
          {missing ? (
            <p id={`${id}-error`} className="set-status__error">
              Say what your status is.
            </p>
          ) : null}
        </div>
        <div className="set-status__field">
          <label className="set-status__label" htmlFor={`${id}-until`}>
            Clear it
          </label>
          <NativeSelect
            id={`${id}-until`}
            value={until}
            onChange={(event) => setUntil(event.target.value)}
          >
            <option value="hour">After an hour</option>
            <option value="today">At the end of today</option>
            <option value="week">At the end of this week</option>
            <option value="never">Never</option>
          </NativeSelect>
        </div>
        <div className="set-status__actions">
          <Button type="submit">Save status</Button>
          <Button type="button" intent="secondary" onClick={clear}>
            Clear status
          </Button>
        </div>
      </form>
    </main>
  );
}
