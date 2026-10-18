"use client";

import { AudioPlayer } from "@nuvui/media/audio-player";
import { useEffect, useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const layouts = ["bar", "podcast", "voice"] as const;

export function AudioPlayerPlayground() {
  const [layout, setLayout] = useState<(typeof layouts)[number]>("bar");
  const [waveform, setWaveform] = useState(true);
  const [chapters, setChapters] = useState(true);
  const [loop, setLoop] = useState(false);
  const [peaks, setPeaks] = useState<number[]>();

  useEffect(() => {
    fetch("/docs/clips/demo_audio.peaks.json")
      .then((response) => response.json())
      .then(setPeaks)
      .catch(() => setPeaks(undefined));
  }, []);

  const lines = [
    layout !== "bar" && `layout="${layout}"`,
    'title="Playground track"',
    layout === "podcast" && 'artist="nuvui radio"',
    layout === "podcast" && 'artwork="/docs/clips/demo_audio.jpg"',
    'src="/docs/clips/demo_audio.mp3"',
    chapters &&
      'tracks={[{ kind: "chapters", src: "/docs/clips/demo_audio.chapters.vtt" }]}',
    waveform && "peaks={peaks}",
    loop && "loop",
  ].filter(Boolean);
  const code = `<AudioPlayer\n${lines.map((line) => `  ${line}`).join("\n")}\n/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="layout"
            value={layout}
            options={layouts}
            onChange={setLayout}
          />
          <CheckboxControl
            label="waveform"
            checked={waveform}
            onChange={setWaveform}
          />
          <CheckboxControl
            label="chapters"
            checked={chapters}
            onChange={setChapters}
          />
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
        </>
      }
    >
      <div className="w-full">
        <AudioPlayer
          // A new player when the tracks change, so the browser reads them again.
          key={String(chapters)}
          layout={layout}
          title="Playground track"
          artist={layout === "podcast" ? "nuvui radio" : undefined}
          artwork={
            layout === "podcast" ? "/docs/clips/demo_audio.jpg" : undefined
          }
          src="/docs/clips/demo_audio.mp3"
          tracks={
            chapters
              ? [
                  {
                    kind: "chapters" as const,
                    src: "/docs/clips/demo_audio.chapters.vtt",
                  },
                ]
              : []
          }
          peaks={waveform ? peaks : undefined}
          loop={loop}
        />
      </div>
    </Playground>
  );
}
