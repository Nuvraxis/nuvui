import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <div className="w-full px-6 py-8">
      <VideoPlayer
        title="Ambient light"
        src="/docs/clips/demo-720.mp4"
        poster="/docs/clips/poster.jpg"
        ambient
      />
    </div>
  );
}
