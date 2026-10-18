"use client";

import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="An HLS stream"
      src="/docs/clips/hls/index.m3u8"
      poster="/docs/clips/poster.jpg"
      hls={() => import("hls.js")}
    />
  );
}
