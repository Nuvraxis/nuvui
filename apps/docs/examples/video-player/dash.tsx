"use client";

import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="A DASH stream"
      src="/docs/clips/dash/index.mpd"
      poster="/docs/clips/poster.jpg"
      dash={() => import("dashjs")}
    />
  );
}
