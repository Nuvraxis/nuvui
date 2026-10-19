"use client";

import { AudioPlayer, computePeaks } from "@nuvui/media/audio-player";
import { useEffect, useState } from "react";

const src = "/docs/clips/demo_audio.mp3";

// Two messages, played one at a time: starting one pauses the other. The
// peaks are worked out in the browser, as for a recording just made.
export default function Example() {
  const [peaks, setPeaks] = useState<number[]>();
  useEffect(() => {
    const controller = new AbortController();
    computePeaks(src, { count: 48, signal: controller.signal })
      .then(setPeaks)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="self-start rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-surface-foreground">
        <AudioPlayer
          layout="voice"
          aria-label="Voice message from Ana"
          src={src}
          duration={62.8}
          peaks={peaks}
          exclusive="chat"
        />
      </div>
      <div className="self-end rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
        <AudioPlayer
          layout="voice"
          aria-label="Your voice message"
          src={src}
          duration={62.8}
          peaks={peaks}
          exclusive="chat"
        />
      </div>
    </div>
  );
}
