import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { type ReactNode, useRef } from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AudioPlayer, type MediaPlayerHandle } from "../audio-player";
import { VideoPlayer } from "../video-player";
import { MediaTranscript, type MediaTranscriptProps } from ".";

// Eight seconds of a tone, and its captions in four cues of two seconds,
// two said by Ana and two by Ben.
const fixture = (path: string) =>
  new URL(`../../../test/fixtures/${path}`, import.meta.url).href;
const tone = fixture("tone.mp3");
const captions = [
  {
    kind: "captions" as const,
    src: fixture("tone.en.vtt"),
    srcLang: "en",
    label: "English",
    default: true,
  },
];

const audio = () =>
  document.querySelector<HTMLAudioElement>("audio") as HTMLAudioElement;
const transcript = () =>
  document.querySelector<HTMLElement>(".nuv-media-transcript") as HTMLElement;
const lines = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(".nuv-media-transcript__line"),
  );

function WithTranscript({
  children,
  ...props
}: Partial<MediaTranscriptProps> & { children?: ReactNode }) {
  const player = useRef<MediaPlayerHandle>(null);
  return (
    <>
      {children}
      <AudioPlayer
        title="Test tone"
        src={tone}
        tracks={captions}
        defaultMuted
        handleRef={player}
      />
      <MediaTranscript player={player} {...props} />
    </>
  );
}

async function ready() {
  await expect.poll(() => lines().length, { timeout: 15_000 }).toBe(4);
  await expect
    .poll(() => audio().readyState, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_METADATA);
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("the lines", () => {
  test("each cue is a line with its time, and the speaker shows where it changes", async () => {
    await render(<WithTranscript />);
    await ready();
    const text = (line: HTMLButtonElement) =>
      line.querySelector(".nuv-media-transcript__text")?.textContent;
    const time = (line: HTMLButtonElement) =>
      line.querySelector(".nuv-media-transcript__time")?.textContent;
    expect(lines().map(time)).toEqual(["0:00", "0:02", "0:04", "0:06"]);
    expect(lines().map(text)).toEqual([
      "The quiet part starts here.",
      // The cue's tags are gone, and its entities read.
      "It's still quiet.",
      "Now it's loud.",
      "Loud & clear, to the end.",
    ]);
    const voices = Array.from(
      document.querySelectorAll(".nuv-media-transcript__voice"),
    ).map((voice) => voice.textContent);
    expect(voices).toEqual(["Ana", "Ben"]);
  });

  test("it's a region named Transcript, or by its aria-label", async () => {
    const screen = await render(<WithTranscript />);
    await expect
      .element(page.getByRole("region", { name: "Transcript" }))
      .toBeInTheDocument();
    await screen.rerender(<WithTranscript aria-label="What's said" />);
    await expect
      .element(page.getByRole("region", { name: "What's said" }))
      .toBeInTheDocument();
  });

  test("with the captions off, a video's transcript still has its words", async () => {
    function Video() {
      const player = useRef<MediaPlayerHandle>(null);
      return (
        <>
          <VideoPlayer
            title="Clip"
            src={fixture("clip.mp4")}
            tracks={[
              {
                kind: "captions",
                src: fixture("captions.en.vtt"),
                srcLang: "en",
                label: "English",
              },
            ]}
            defaultMuted
            handleRef={player}
          />
          <MediaTranscript player={player} />
        </>
      );
    }
    await render(<Video />);
    await expect
      .poll(() => lines().length, { timeout: 15_000 })
      .toBeGreaterThan(0);
    // Read, and not drawn over the picture.
    expect(
      document.querySelector<HTMLElement>(".nuv-video-player__captions")
        ?.hidden,
    ).toBe(true);
  });
});

describe("following along", () => {
  test("the line being said is marked, and a press on a line plays from there", async () => {
    await render(<WithTranscript />);
    await ready();
    await lines()[2]?.click();
    await expect.poll(() => audio().paused).toBe(false);
    expect(audio().currentTime).toBeGreaterThanOrEqual(4);
    await expect
      .poll(() => lines()[2]?.getAttribute("aria-current"))
      .toBe("time");
    expect(
      lines().filter((line) => line.hasAttribute("aria-current")),
    ).toHaveLength(1);
  });

  test("it keeps the line being said in view, in its own box and not the page's", async () => {
    await render(
      <WithTranscript style={{ maxBlockSize: "4rem" }}>
        <button type="button">Elsewhere</button>
      </WithTranscript>,
    );
    await ready();
    // The pointer away from the transcript, which it would leave alone.
    await userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));
    const pageScroll = window.scrollY;
    audio().currentTime = 6.5;
    await expect.poll(() => transcript().scrollTop).toBeGreaterThan(0);
    expect(window.scrollY).toBe(pageScroll);
  });

  test("with follow off, it stays where it is", async () => {
    await render(
      <WithTranscript follow={false} style={{ maxBlockSize: "4rem" }} />,
    );
    await ready();
    audio().currentTime = 6.5;
    await expect
      .poll(() => lines()[3]?.getAttribute("aria-current"))
      .toBe("time");
    expect(transcript().scrollTop).toBe(0);
  });
});

describe("the keyboard", () => {
  test("one line is in the Tab order, and the arrows, Home and End move between them", async () => {
    await render(<WithTranscript />);
    await ready();
    expect(lines().map((line) => line.tabIndex)).toEqual([0, -1, -1, -1]);
    lines()[0]?.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(lines()[1]);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(lines()[3]);
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(lines()[2]);
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(lines()[0]);
    await expect.poll(() => lines()[0]?.tabIndex).toBe(0);
    expect(lines()[3]?.tabIndex).toBe(-1);
  });
});

describe("accessibility", () => {
  test("it passes axe", async () => {
    const { container } = await render(<WithTranscript />);
    await ready();
    expect(await axe(container)).toHaveNoViolations();
  });
});
