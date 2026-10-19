"use client";

import { MediaTranscript } from "@nuvui/media/media-transcript";
import { type MediaPlayerHandle, VideoPlayer } from "@nuvui/media/video-player";
import { useRef } from "react";

// Beside the video where there's room, as tall as it is, and under it
// where there isn't.
export default function Example() {
  const player = useRef<MediaPlayerHandle>(null);
  return (
    <div className="grid w-full gap-3 md:grid-cols-[2fr_1fr]">
      <VideoPlayer
        title="Building a screen with nuvui"
        src="/docs/clips/demo-720.mp4"
        poster="/docs/clips/poster.jpg"
        tracks={[
          {
            kind: "captions",
            src: "/docs/clips/captions.en.vtt",
            srcLang: "en",
            label: "English",
          },
        ]}
        handleRef={player}
      />
      <div className="relative">
        <MediaTranscript
          player={player}
          className="md:absolute md:inset-0 md:[--nuv-media-transcript-height:none]"
        />
      </div>
    </div>
  );
}
