"use client";

import { formatTime, type MediaPlayerHandle, VideoPlayer } from "@nuvui/media";
import { Avatar, AvatarFallback, Button, Textarea } from "@nuvui/react";
import { type FormEvent, useRef, useState } from "react";
import "./recording-review.scss";

interface Note {
  id: number;
  at: number;
  who: string;
  text: string;
}

// The people and what they said are made up. The clip was made for the
// nuvui docs, and stands in for a recording of your meeting.
const first: Note[] = [
  {
    id: 1,
    at: 3,
    who: "Ana Costa",
    text: "Can we start the walkthrough here next time? The first seconds are slow.",
  },
  {
    id: 2,
    at: 10,
    who: "Ben Okafor",
    text: "This is the screen finance asked about. The totals match the export.",
  },
  {
    id: 3,
    at: 19,
    who: "Ana Costa",
    text: "Agreed to ship this on Thursday.",
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

export default function RecordingReview() {
  const player = useRef<MediaPlayerHandle>(null);
  const [notes, setNotes] = useState(first);
  const [draft, setDraft] = useState("");
  const [time, setTime] = useState(0);

  const add = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const at = Math.floor(player.current?.media?.currentTime ?? 0);
    setNotes((all) =>
      [...all, { id: Date.now(), at, who: "You", text }].sort(
        (a, b) => a.at - b.at,
      ),
    );
    setDraft("");
  };

  return (
    <div className="recording-review">
      <header className="recording-review__head">
        <h1 className="recording-review__title">Design review, 14 October</h1>
        <p className="recording-review__text">
          Recorded in the weekly review. Press a comment's time to go to that
          moment, and add yours where the video is.
        </p>
      </header>

      <div className="recording-review__body">
        <VideoPlayer
          title="Design review, 14 October"
          src="/clips/demo-720.mp4"
          poster="/clips/poster.jpg"
          tracks={[
            {
              kind: "captions",
              src: "/clips/captions.en.vtt",
              srcLang: "en",
              label: "English",
            },
          ]}
          chapters={notes.map((note) => ({
            start: note.at,
            title: `${note.who}: ${note.text}`,
          }))}
          handleRef={player}
          onTimeUpdate={setTime}
        />

        <section className="recording-review__notes" aria-label="Comments">
          <h2 className="recording-review__heading">
            Comments <span>({notes.length})</span>
          </h2>
          <ol className="recording-review__list">
            {notes.map((note) => {
              const here = time >= note.at && time < note.at + 3;
              return (
                <li
                  key={note.id}
                  className="recording-review__note"
                  data-here={here ? "" : undefined}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(note.who)}</AvatarFallback>
                  </Avatar>
                  <div className="recording-review__note-body">
                    <p className="recording-review__note-head">
                      <span className="recording-review__who">{note.who}</span>
                      <button
                        type="button"
                        className="recording-review__at"
                        aria-label={`Go to ${formatTime(note.at)}`}
                        onClick={() => {
                          player.current?.seek(note.at);
                          player.current?.play();
                        }}
                      >
                        {formatTime(note.at)}
                      </button>
                    </p>
                    <p className="recording-review__note-text">{note.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <form className="recording-review__form" onSubmit={add}>
            <label className="recording-review__label" htmlFor="review-note">
              Comment at {formatTime(time)}
            </label>
            <Textarea
              id="review-note"
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What should the team look at here?"
            />
            <Button type="submit" size="sm" className="recording-review__send">
              Add comment
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
