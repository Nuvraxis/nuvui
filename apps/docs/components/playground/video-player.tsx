"use client";

import { VideoPlayer } from "@nuvui/media/video-player";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const skips = ["10", "5", "15"] as const;
const aspects = ["16 / 9", "4 / 3", "1 / 1"] as const;

export function VideoPlayerPlayground() {
  const [captions, setCaptions] = useState(true);
  const [chapters, setChapters] = useState(true);
  const [thumbnails, setThumbnails] = useState(true);
  const [ambient, setAmbient] = useState(false);
  const [loop, setLoop] = useState(false);
  const [skip, setSkip] = useState<(typeof skips)[number]>("10");
  const [aspect, setAspect] = useState<(typeof aspects)[number]>("16 / 9");

  const tracks = [
    captions &&
      '{ kind: "captions", src: "/docs/clips/captions.en.vtt", srcLang: "en", label: "English", default: true }',
    chapters && '{ kind: "chapters", src: "/docs/clips/chapters.vtt" }',
  ].filter(Boolean);
  const lines = [
    'title="Building a screen with nuvui"',
    'src="/docs/clips/demo-720.mp4"',
    'poster="/docs/clips/poster.jpg"',
    tracks.length > 0 &&
      `tracks={[\n${tracks.map((track) => `    ${track},`).join("\n")}\n  ]}`,
    thumbnails && 'thumbnails="/docs/clips/thumbnails.vtt"',
    ambient && "ambient",
    loop && "loop",
    skip !== "10" && `skip={${skip}}`,
    aspect !== "16 / 9" &&
      `className="[--nuv-video-player-aspect:${aspect.replaceAll(" ", "")}]"`,
  ].filter(Boolean);
  const code = `<VideoPlayer\n${lines.map((line) => `  ${line}`).join("\n")}\n/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="captions"
            checked={captions}
            onChange={setCaptions}
          />
          <CheckboxControl
            label="chapters"
            checked={chapters}
            onChange={setChapters}
          />
          <CheckboxControl
            label="thumbnails"
            checked={thumbnails}
            onChange={setThumbnails}
          />
          <CheckboxControl
            label="ambient"
            checked={ambient}
            onChange={setAmbient}
          />
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
          <SelectControl
            label="skip"
            value={skip}
            options={skips}
            onChange={setSkip}
          />
          <SelectControl
            label="aspect"
            value={aspect}
            options={aspects}
            onChange={setAspect}
          />
        </>
      }
    >
      <div className="w-full">
        <VideoPlayer
          // A new player when the tracks change, so the browser reads them again.
          key={`${captions}-${chapters}`}
          title="Building a screen with nuvui"
          src="/docs/clips/demo-720.mp4"
          poster="/docs/clips/poster.jpg"
          tracks={[
            ...(captions
              ? [
                  {
                    kind: "captions" as const,
                    src: "/docs/clips/captions.en.vtt",
                    srcLang: "en",
                    label: "English",
                    default: true,
                  },
                ]
              : []),
            ...(chapters
              ? [{ kind: "chapters" as const, src: "/docs/clips/chapters.vtt" }]
              : []),
          ]}
          thumbnails={thumbnails ? "/docs/clips/thumbnails.vtt" : undefined}
          ambient={ambient}
          loop={loop}
          skip={Number(skip)}
          className={
            aspect === "4 / 3"
              ? "[--nuv-video-player-aspect:4/3]"
              : aspect === "1 / 1"
                ? "[--nuv-video-player-aspect:1/1]"
                : undefined
          }
        />
      </div>
    </Playground>
  );
}
