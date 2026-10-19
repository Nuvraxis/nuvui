"use client";

import {
  AudioPlayer,
  formatTime,
  type MediaChapter,
  type MediaPlayerHandle,
} from "@nuvui/media";
import { useEffect, useRef, useState } from "react";
import "./podcast-episode.scss";

// Made up, and standing in for your show. The sound is a demo track: put
// your own episode here, and its chapters.
const chapters: MediaChapter[] = [
  { start: 0, title: "Part one" },
  { start: 20, title: "Part two" },
  { start: 40, title: "Part three" },
];

export default function PodcastEpisode() {
  const player = useRef<MediaPlayerHandle>(null);
  const [time, setTime] = useState(0);
  // Worked out once, when the episode was published, and kept beside it.
  const [peaks, setPeaks] = useState<number[]>();
  useEffect(() => {
    fetch("/clips/demo_audio.peaks.json")
      .then((response) => response.json())
      .then(setPeaks)
      .catch(() => setPeaks(undefined));
  }, []);
  // The last chapter that has started.
  const chapterNow = chapters.reduce(
    (found, chapter, i) => (chapter.start <= time ? i : found),
    0,
  );

  return (
    <div className="podcast-episode">
      <header className="podcast-episode__head">
        <p className="podcast-episode__show">nuvui radio</p>
        <h1 className="podcast-episode__title">Episode 12: Demo track</h1>
        <p className="podcast-episode__meta">18 October 2026, 1 minute</p>
      </header>

      <div className="podcast-episode__body">
        <AudioPlayer
          layout="podcast"
          title="Demo track"
          artist="nuvui radio"
          artwork="/clips/demo_audio.jpg"
          src="/clips/demo_audio.mp3"
          chapters={chapters}
          peaks={peaks}
          persist="podcast-player"
          handleRef={player}
          onTimeUpdate={setTime}
        />

        <section
          className="podcast-episode__section"
          aria-labelledby="podcast-chapters"
        >
          <h2 id="podcast-chapters" className="podcast-episode__heading">
            Chapters
          </h2>
          <ol className="podcast-episode__chapters">
            {chapters.map((chapter, i) => (
              <li key={chapter.start}>
                <button
                  type="button"
                  className="podcast-episode__chapter"
                  aria-current={i === chapterNow ? "true" : undefined}
                  onClick={() => {
                    player.current?.seek(chapter.start);
                    player.current?.play();
                  }}
                >
                  <span className="podcast-episode__chapter-time">
                    {formatTime(chapter.start)}
                  </span>
                  <span>{chapter.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="podcast-episode__section"
          aria-labelledby="podcast-notes"
        >
          <h2 id="podcast-notes" className="podcast-episode__heading">
            Show notes
          </h2>
          <p className="podcast-episode__notes">
            The notes for an episode go here: what it's about, who's on it, and
            links to what's mentioned. A recording with speech also wants its
            transcript beside it, from the player's captions.
          </p>
          <ul className="podcast-episode__links">
            <li>
              <a href="/docs/media/audio-player">The audio player</a>
            </li>
            <li>
              <a href="/docs/media/media-transcript">The transcript</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
