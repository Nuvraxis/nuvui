"use client";

import {
  formatTime,
  type MediaChapter,
  type MediaPlayerHandle,
  MediaTranscript,
  VideoPlayer,
} from "@nuvui/media";
import { Badge, Button } from "@nuvui/react";
import { useRef, useState } from "react";
import "./course-lesson.scss";

// Made up, and standing in for your course. The clip, its captions and its
// chapters were made for the nuvui docs: put your own lessons here.
const lessons = [
  { id: "setup", title: "Setting up the project", length: "4:12" },
  { id: "screen", title: "Building the first screen", length: "0:24" },
  { id: "forms", title: "Forms that check themselves", length: "6:05" },
  { id: "ship", title: "Shipping to production", length: "5:40" },
];

const chapters: MediaChapter[] = [
  { start: 0, title: "Getting started" },
  { start: 8, title: "Building the screen" },
  { start: 16, title: "Shipping it" },
];

export default function CourseLesson() {
  const player = useRef<MediaPlayerHandle>(null);
  const [time, setTime] = useState(0);
  const [done, setDone] = useState<string[]>(["setup"]);
  const current = "screen";
  const index = lessons.findIndex((lesson) => lesson.id === current);
  // The last chapter that has started.
  const chapterNow = chapters.reduce(
    (found, chapter, i) => (chapter.start <= time ? i : found),
    0,
  );

  return (
    <div className="course-lesson">
      <header className="course-lesson__head">
        <p className="course-lesson__course">A first app with nuvui</p>
        <h1 className="course-lesson__title">{lessons[index]?.title}</h1>
        <p className="course-lesson__progress">
          Lesson {index + 1} of {lessons.length}
        </p>
      </header>

      <div className="course-lesson__body">
        <section className="course-lesson__main" aria-label="This lesson">
          <VideoPlayer
            title={lessons[index]?.title}
            src={[
              { src: "/clips/demo-720.mp4", height: 720 },
              { src: "/clips/demo-360.mp4", height: 360 },
            ]}
            poster="/clips/poster.jpg"
            tracks={[
              {
                kind: "captions",
                src: "/clips/captions.en.vtt",
                srcLang: "en",
                label: "English",
                default: true,
              },
              {
                kind: "subtitles",
                src: "/clips/captions.es.vtt",
                srcLang: "es",
                label: "Español",
              },
            ]}
            chapters={chapters}
            thumbnails="/clips/thumbnails.vtt"
            persist="course-player"
            handleRef={player}
            onTimeUpdate={setTime}
            onEnded={() =>
              setDone((all) =>
                all.includes(current) ? all : [...all, current],
              )
            }
          />

          <div className="course-lesson__more">
            <div className="course-lesson__chapters">
              <h2 className="course-lesson__heading">In this lesson</h2>
              <ol className="course-lesson__chapter-list">
                {chapters.map((chapter, i) => (
                  <li key={chapter.start}>
                    <button
                      type="button"
                      className="course-lesson__chapter"
                      aria-current={i === chapterNow ? "true" : undefined}
                      onClick={() => {
                        player.current?.seek(chapter.start);
                        player.current?.play();
                      }}
                    >
                      <span className="course-lesson__chapter-time">
                        {formatTime(chapter.start)}
                      </span>
                      <span>{chapter.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            {/* The captions as text, in the language chosen for them. */}
            <div className="course-lesson__transcript">
              <h2 className="course-lesson__heading">Transcript</h2>
              <MediaTranscript player={player} />
            </div>
          </div>
        </section>

        <nav className="course-lesson__lessons" aria-label="Lessons">
          <h2 className="course-lesson__heading">Lessons</h2>
          <ol className="course-lesson__lesson-list">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="course-lesson__lesson"
                aria-current={lesson.id === current ? "step" : undefined}
              >
                <span className="course-lesson__lesson-title">
                  {lesson.title}
                </span>
                <span className="course-lesson__lesson-meta">
                  {lesson.length}
                  {done.includes(lesson.id) && (
                    <Badge intent="success">Watched</Badge>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <Button intent="secondary" className="course-lesson__next">
            Next lesson
          </Button>
        </nav>
      </div>
    </div>
  );
}
