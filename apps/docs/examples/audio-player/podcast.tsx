"use client";

import { AudioPlayer } from "@nuvui/media/audio-player";
import { useEffect, useState } from "react";

// The peaks were worked out once, when the sound was published, and are
// fetched beside it.
export default function Example() {
  const [peaks, setPeaks] = useState<number[]>();
  useEffect(() => {
    fetch("/docs/clips/demo_audio.peaks.json")
      .then((response) => response.json())
      .then(setPeaks)
      .catch(() => setPeaks(undefined));
  }, []);

  return (
    <AudioPlayer
      layout="podcast"
      title="Demo track"
      artist="nuvui radio"
      artwork="/docs/clips/demo_audio.jpg"
      src="/docs/clips/demo_audio.mp3"
      tracks={[
        { kind: "chapters", src: "/docs/clips/demo_audio.chapters.vtt" },
      ]}
      peaks={peaks}
    />
  );
}
