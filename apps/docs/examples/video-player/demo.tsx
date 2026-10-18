import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <div className="w-full px-6 py-8">
      <VideoPlayer
        title="A music player, close up"
        src="/docs/clips/demo_video.mp4"
        poster="/docs/clips/demo_video.jpg"
        tracks={[
          {
            kind: "captions",
            src: "/docs/clips/demo_video.en.vtt",
            srcLang: "en",
            label: "English",
          },
        ]}
        ambient
      />
    </div>
  );
}
