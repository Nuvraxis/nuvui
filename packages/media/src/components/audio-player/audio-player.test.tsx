import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { VideoPlayer } from "../video-player";
import { AudioPlayer, type AudioPlayerProps, type MediaPlayerHandle } from ".";

// Eight seconds of a tone, four quiet and four loud, made by
// packages/media/scripts/make-media.sh.
const fixture = (path: string) =>
  new URL(`../../../test/fixtures/${path}`, import.meta.url).href;
const tone = fixture("tone.mp3");
const peaks = [0.1, 0.1, 0.1, 0.1, 0.8, 0.8, 0.8, 0.8];

const root = () =>
  document.querySelector<HTMLElement>(".nuv-audio-player") as HTMLElement;
const audio = () =>
  document.querySelector<HTMLAudioElement>(
    ".nuv-audio-player audio",
  ) as HTMLAudioElement;
const said = () =>
  document
    .querySelector('.nuv-audio-player > [role="status"]')
    // The no-break space that tells the same words said twice apart.
    ?.textContent?.replace(/ /g, "") ?? "";

async function loaded() {
  await expect
    .poll(() => audio()?.readyState ?? 0, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_METADATA);
}

async function playing() {
  await expect
    .poll(() => audio().currentTime, { timeout: 15_000 })
    .toBeGreaterThan(0.25);
}

function Player(props: Partial<AudioPlayerProps>) {
  return <AudioPlayer title="Test tone" src={tone} defaultMuted {...props} />;
}

// The settings menu, once it has finished coming in. axe reads colors
// while it fades, and finds them too faint.
async function openSettings() {
  await page.getByRole("button", { name: "Settings" }).click();
  const menu = page.getByRole("menu");
  await expect.element(menu).toBeVisible();
  await Promise.all(
    (menu.element() as HTMLElement)
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished),
  );
}

// What a color resolves to here, to tell whether the browser forces colors.
function system(name: string) {
  const probe = document.createElement("span");
  probe.style.color = name;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

beforeEach(async () => {
  await setViewport("desktop");
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem("test-audio");
});

describe("rendering", () => {
  test("the server sends the audio with the browser's own controls", () => {
    const html = renderToString(<Player />);
    expect(html).toMatch(/<audio[^>]*controls=""/);
    expect(html).toContain('aria-label="Test tone"');
    expect(html).not.toContain("nuv-audio-player__bar");
    expect(html).not.toMatch(/style="/);
  });

  test("in the browser its own controls take over", async () => {
    await render(<Player />);
    await loaded();
    expect(audio().controls).toBe(false);
    await expect
      .element(page.getByRole("region", { name: "Test tone" }))
      .toBeInTheDocument();
    for (const name of ["Play", "Unmute", "Settings"]) {
      await expect.element(page.getByRole("button", { name })).toBeVisible();
    }
    await expect
      .element(page.getByRole("slider", { name: "Seek" }))
      .toHaveAttribute("aria-valuemax", "8");
  });

  test("without a title it's named Audio, or by its aria-label", async () => {
    const screen = await render(<AudioPlayer src={tone} />);
    await expect
      .element(page.getByRole("region", { name: "Audio" }))
      .toBeInTheDocument();
    await screen.rerender(<AudioPlayer src={tone} aria-label="Interview" />);
    await expect
      .element(page.getByRole("region", { name: "Interview" }))
      .toBeInTheDocument();
  });

  test("its settings have the speed and no captions, which audio doesn't draw", async () => {
    await render(
      <Player
        tracks={[
          {
            kind: "captions",
            src: fixture("tone.en.vtt"),
            srcLang: "en",
            label: "English",
            default: true,
          },
        ]}
      />,
    );
    await loaded();
    await openSettings();
    await expect
      .element(page.getByRole("menuitem", { name: /Speed/ }))
      .toBeVisible();
    expect(page.getByRole("menuitem", { name: /Captions/ }).query()).toBeNull();
  });
});

describe("layouts", () => {
  test("a podcast has its artwork, its title and who it's by, and skip buttons", async () => {
    await render(
      <Player
        layout="podcast"
        artist="nuvui radio"
        artwork={fixture("thumbnails.jpg")}
        skipBack={2}
        skipAhead={3}
      />,
    );
    await loaded();
    const art = root().querySelector("img") as HTMLImageElement;
    expect(art.alt).toBe("");
    expect(root().textContent).toContain("Test tone");
    expect(root().textContent).toContain("nuvui radio");
    audio().currentTime = 1;
    await page.getByRole("button", { name: "Ahead 3 seconds" }).click();
    await expect.poll(() => audio().currentTime).toBeCloseTo(4, 1);
    await page.getByRole("button", { name: "Back 2 seconds" }).click();
    await expect.poll(() => audio().currentTime).toBeCloseTo(2, 1);
  });

  test("a voice message has the play button, the length, and a press for the speed", async () => {
    await render(<Player layout="voice" peaks={peaks} />);
    await loaded();
    expect(page.getByRole("button", { name: "Settings" }).query()).toBeNull();
    expect(page.getByRole("button", { name: "Unmute" }).query()).toBeNull();
    await expect
      .poll(
        () =>
          document.querySelector(".nuv-audio-player__time")?.textContent ?? "",
      )
      .toBe("0:08");
    const speed = page.getByRole("button", { name: "Speed 1×" });
    await speed.click();
    expect(audio().playbackRate).toBe(1.5);
    await expect.poll(said).toBe("Speed 1.5×");
    await page.getByRole("button", { name: "Speed 1.5×" }).click();
    await page.getByRole("button", { name: "Speed 2×" }).click();
    expect(audio().playbackRate).toBe(1);
  });

  test("the length given shows before anything has loaded", async () => {
    await render(<Player layout="voice" preload="none" duration={42} />);
    expect(audio().readyState).toBe(HTMLMediaElement.HAVE_NOTHING);
    await expect
      .poll(
        () =>
          document.querySelector(".nuv-audio-player__time")?.textContent ?? "",
      )
      .toBe("0:42");
    await expect
      .element(page.getByRole("slider", { name: "Seek" }))
      .toHaveAttribute("aria-valuemax", "42");
  });
});

describe("the waveform", () => {
  test("its bars fill the width, and a press goes to where it was pressed", async () => {
    await render(<Player peaks={peaks} />);
    await loaded();
    const slider = page.getByRole("slider", { name: "Seek" });
    const element = slider.element() as HTMLElement;
    const bars = element.querySelector(".nuv-media-waveform__bars") as Element;
    const width = bars.getBoundingClientRect().width;
    await expect
      .poll(() => element.querySelectorAll("svg")[0]?.children.length ?? 0)
      .toBe(Math.floor((Math.round(width) + 2) / 5));
    const box = element.getBoundingClientRect();
    await slider.click({
      position: { x: box.width * 0.75, y: box.height / 2 },
    });
    await expect.poll(() => audio().currentTime).toBeCloseTo(6, 0);
  });

  test("what's played grows along it, and it says the time in words", async () => {
    await render(<Player peaks={peaks} />);
    await loaded();
    const slider = page.getByRole("slider", { name: "Seek" });
    const element = slider.element() as HTMLElement;
    audio().currentTime = 4;
    await expect
      .poll(() =>
        Number(element.style.getPropertyValue("--nuv-media-fill") || 0),
      )
      .toBeCloseTo(0.5, 1);
    await expect
      .element(slider)
      .toHaveAttribute("aria-valuetext", "4 seconds of 8 seconds");
  });

  test("right to left, it's mirrored, and the arrow that points back goes back", async () => {
    await render(
      <div dir="rtl">
        <Player peaks={peaks} />
      </div>,
    );
    await loaded();
    const shape = document.querySelector(
      ".nuv-media-waveform__shape",
    ) as Element;
    await expect
      .poll(() => shape && getComputedStyle(shape).scale)
      .toBe("-1 1");
    const slider = page.getByRole("slider", { name: "Seek" });
    (slider.element() as HTMLElement).focus();
    await userEvent.keyboard("{Home}{ArrowLeft}");
    await expect.poll(() => audio().currentTime).toBeCloseTo(5, 1);
  });

  test("without peaks, it's the seek bar", async () => {
    await render(<Player />);
    await loaded();
    expect(document.querySelector(".nuv-media-waveform")).toBeNull();
    expect(document.querySelector(".nuv-media-seek")).not.toBeNull();
  });
});

describe("keys", () => {
  test("k plays, j and l skip back and ahead, and ? lists the keys", async () => {
    await render(<Player skipBack={2} skipAhead={3} />);
    await loaded();
    audio().currentTime = 4;
    root().focus();
    await userEvent.keyboard("l");
    await expect.poll(() => audio().currentTime).toBeCloseTo(7, 1);
    await userEvent.keyboard("j");
    await expect.poll(() => audio().currentTime).toBeCloseTo(5, 1);
    await userEvent.keyboard("k");
    await expect.poll(() => audio().paused).toBe(false);
    await userEvent.keyboard("k");
    await expect.poll(() => audio().paused).toBe(true);
    await userEvent.keyboard("?");
    const sheet = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect.element(sheet).toBeVisible();
    const listed = sheet.element().textContent ?? "";
    expect(listed).toContain("Back 2 seconds");
    expect(listed).toContain("Ahead 3 seconds");
    expect(listed).not.toContain("Full screen");
  });

  test("a key the player used goes no further", async () => {
    const outside = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: listens for what gets through
      <div onKeyDown={outside}>
        <Player />
      </div>,
    );
    await loaded();
    root().focus();
    await userEvent.keyboard("m");
    expect(outside).not.toHaveBeenCalled();
    await userEvent.keyboard("x");
    expect(outside).toHaveBeenCalledTimes(1);
  });
});

describe("states", () => {
  test("a file that isn't there says so, with a way to try again", async () => {
    await render(<Player src={fixture("missing.mp3")} />);
    await expect
      .poll(() => document.querySelector('[role="alert"]')?.textContent)
      .toContain("The audio couldn't be loaded.");
    await expect
      .element(page.getByRole("button", { name: "Try again" }))
      .toBeVisible();
  });

  test("the speed is there next time with persist", async () => {
    const screen = await render(<Player persist="test-audio" />);
    await loaded();
    root().focus();
    await userEvent.keyboard(">");
    await screen.unmount();
    await render(<Player persist="test-audio" />);
    await loaded();
    await expect.poll(() => audio().playbackRate).toBe(1.25);
  });

  test("starting the video pauses the audio in the same group", async () => {
    await render(
      <>
        <Player exclusive="page" />
        <VideoPlayer
          title="Clip"
          src={fixture("clip.mp4")}
          defaultMuted
          exclusive="page"
        />
      </>,
    );
    const video = document.querySelector("video") as HTMLVideoElement;
    await loaded();
    await expect.poll(() => video.readyState).toBeGreaterThanOrEqual(1);
    await audio().play();
    await expect.poll(() => audio().paused).toBe(false);
    await video.play();
    await expect.poll(() => audio().paused).toBe(true);
  });
});

describe("from the app", () => {
  test("the handle plays, seeks and pauses, and hands over the audio", async () => {
    const handle = createRef<MediaPlayerHandle>();
    await render(<Player handleRef={handle} />);
    await loaded();
    expect(handle.current?.media).toBe(audio());
    handle.current?.seek(3);
    await expect.poll(() => audio().currentTime).toBeCloseTo(3, 1);
    handle.current?.play();
    await expect.poll(() => audio().paused).toBe(false);
    handle.current?.pause();
    await expect.poll(() => audio().paused).toBe(true);
  });

  test("the lock screen has its title and who it's by while it plays", async ({
    skip,
  }) => {
    if (!("mediaSession" in navigator))
      skip("this browser has no Media Session");
    await render(<Player artist="nuvui radio" />);
    await loaded();
    await page.getByRole("button", { name: "Play" }).click();
    await playing();
    await expect
      .poll(() => navigator.mediaSession.metadata?.artist)
      .toBe("nuvui radio");
    expect(navigator.mediaSession.metadata?.title).toBe("Test tone");
  });
});

describe("translation", () => {
  test("every word comes from labels", async () => {
    function Spanish() {
      const [labels] = useState({
        audio: "Sonido",
        play: "Reproducir",
        seek: "Buscar",
      });
      return <AudioPlayer src={tone} labels={labels} />;
    }
    await render(<Spanish />);
    await loaded();
    await expect
      .element(page.getByRole("region", { name: "Sonido" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Reproducir" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("slider", { name: "Buscar" }))
      .toBeInTheDocument();
  });
});

describe("how it's drawn", () => {
  test("where the browser forces its colors, the play button is a button of the system's", async ({
    skip,
  }) => {
    await render(<Player />);
    await loaded();
    await emulateMedia({ forcedColors: "active" });
    try {
      // WebKit answers the media query and goes on painting the page's own
      // colors.
      if (system("rgb(1, 2, 3)") === "rgb(1, 2, 3)") {
        skip("this browser doesn't force colors");
      }
      const button = document.querySelector(
        ".nuv-audio-player__play-button",
      ) as Element;
      expect(getComputedStyle(button).backgroundColor).toBe(
        system("ButtonFace"),
      );
    } finally {
      await emulateMedia({ forcedColors: null });
    }
  });
});

describe("accessibility", () => {
  test.for(themes)(
    "the bar with a waveform passes axe in %s",
    async (theme) => {
      const { container } = await renderThemed(theme, <Player peaks={peaks} />);
      await loaded();
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  test.for(themes)("the podcast layout passes axe in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <Player
        layout="podcast"
        artist="nuvui radio"
        artwork={fixture("thumbnails.jpg")}
      />,
    );
    await loaded();
    expect(await axe(container)).toHaveNoViolations();
  });

  test.for(themes)("the voice layout passes axe in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <Player layout="voice" peaks={peaks} />,
    );
    await loaded();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("the settings menu passes axe", async () => {
    const { container } = await render(<Player />);
    await loaded();
    await openSettings();
    expect(await axe(container)).toHaveNoViolations();
  });
});
