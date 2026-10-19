"use client";

import { AudioPlayer, type MediaPlayerHandle } from "@nuvui/media";
import { Avatar, AvatarFallback, Button, Input } from "@nuvui/react";
import { type FormEvent, useRef, useState } from "react";
import "./voice-messages.scss";

interface Voice {
  src: string;
  /** Seconds, kept with the message, so nothing loads until it's played. */
  duration: number;
  /** Worked out when it was sent, and kept with it. */
  peaks: number[];
}

interface Message {
  id: number;
  /** Null for you. */
  from: string | null;
  at: string;
  text?: string;
  voice?: Voice;
}

// Made up, and standing in for your team. Every message plays the same
// demo track: put your own recordings here, each with its length and peaks.
const demo: Voice = {
  src: "/clips/demo_audio.mp3",
  duration: 62.8,
  peaks: [
    0.19, 0.22, 0.24, 0.78, 0.73, 0.68, 0.72, 0.72, 0.76, 0.64, 0.64, 0.75,
    0.78, 0.73, 0.78, 0.63, 0.68, 0.62, 0.61, 0.59, 0.69, 0.68, 0.74, 0.66,
    0.71, 0.62, 0.58, 0.82, 0.84, 0.81, 0.89, 0.8, 0.82, 0.85, 0.83, 0.8, 0.8,
    0.85, 0.82, 1, 0.98, 0.94, 0.88, 0.9, 0.82, 0.93, 0, 0,
  ],
};

const first: Message[] = [
  {
    id: 1,
    from: "Ana Costa",
    at: "9:12",
    text: "Morning! I listened to yesterday's recording of the review.",
  },
  { id: 2, from: "Ana Costa", at: "9:13", voice: demo },
  {
    id: 3,
    from: null,
    at: "9:15",
    text: "Thanks. One thing about the waveform, though:",
  },
  { id: 4, from: null, at: "9:16", voice: demo },
  { id: 5, from: "Ben Okafor", at: "9:20", voice: demo },
  {
    id: 6,
    from: "Ben Okafor",
    at: "9:21",
    text: "Agreed. Let's ship it on Thursday.",
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

export default function VoiceMessages() {
  const [messages, setMessages] = useState(first);
  const [draft, setDraft] = useState("");
  const players = useRef(new Map<number, MediaPlayerHandle>());

  // When one voice message ends, the next one in the thread plays.
  const playNext = (after: number) => {
    const next = messages.find(
      (message) => message.id > after && message.voice,
    );
    if (next) players.current.get(next.id)?.play();
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((all) => [
      ...all,
      { id: Date.now(), from: null, at: "Now", text },
    ]);
    setDraft("");
  };

  return (
    <div className="voice-messages">
      <section className="voice-messages__chat" aria-labelledby="voice-chat">
        <header className="voice-messages__head">
          <h1 id="voice-chat" className="voice-messages__title">
            Design team
          </h1>
          <p className="voice-messages__about">Ana Costa, Ben Okafor and you</p>
        </header>

        <ol className="voice-messages__thread" aria-label="Messages">
          {messages.map((message, index) => {
            const mine = message.from === null;
            // The name and picture once, on the first of a run.
            const opens = messages[index - 1]?.from !== message.from;
            return (
              <li
                key={message.id}
                className="voice-messages__message"
                data-mine={mine ? "" : undefined}
              >
                {!mine && (
                  <Avatar
                    size="sm"
                    className="voice-messages__picture"
                    aria-hidden="true"
                    data-hidden={opens ? undefined : ""}
                  >
                    <AvatarFallback>
                      {initials(message.from ?? "")}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="voice-messages__content">
                  {!mine && opens && (
                    <span className="voice-messages__who">{message.from}</span>
                  )}
                  <div className="voice-messages__bubble">
                    {message.voice ? (
                      <AudioPlayer
                        layout="voice"
                        aria-label={
                          mine
                            ? "Your voice message"
                            : `Voice message from ${message.from}`
                        }
                        src={message.voice.src}
                        duration={message.voice.duration}
                        peaks={message.voice.peaks}
                        preload="none"
                        exclusive="voice-messages"
                        handleRef={(handle) => {
                          if (handle) players.current.set(message.id, handle);
                          else players.current.delete(message.id);
                        }}
                        onEnded={() => playNext(message.id)}
                      />
                    ) : (
                      <p className="voice-messages__text">{message.text}</p>
                    )}
                  </div>
                  <span className="voice-messages__at">{message.at}</span>
                </div>
              </li>
            );
          })}
        </ol>

        <form className="voice-messages__composer" onSubmit={send}>
          <Input
            aria-label="Message"
            placeholder="Write a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit">Send</Button>
        </form>
      </section>
    </div>
  );
}
