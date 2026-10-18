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
import { type MediaPlayerHandle, VideoPlayer, type VideoPlayerProps } from ".";

// Six seconds at 320 by 180, in three chapters of two seconds, made by
// packages/media/scripts/make-media.sh.
const fixture = (path: string) =>
  new URL(`../../../test/fixtures/${path}`, import.meta.url).href;
const clip = fixture("clip.mp4");
// Written out whole: Vite reads a URL built from a variable as the files
// of one folder, and not the folders inside it.
const hlsStream = new URL(
  "../../../test/fixtures/hls/index.m3u8",
  import.meta.url,
).href;
const dashStream = new URL(
  "../../../test/fixtures/dash/index.mpd",
  import.meta.url,
).href;

const root = () =>
  document.querySelector<HTMLElement>(".nuv-video-player") as HTMLElement;
const video = () =>
  document.querySelector<HTMLVideoElement>(
    ".nuv-video-player video",
  ) as HTMLVideoElement;
const bar = () =>
  page.elementLocator(
    document.querySelector(".nuv-video-player__bar") as HTMLElement,
  );
const said = () =>
  document
    .querySelector('.nuv-video-player > [role="status"]')
    ?.textContent?.replace(/ /g, "") ?? "";
const captionText = () =>
  document.querySelector(".nuv-video-player__captions")?.textContent ?? "";

async function loaded() {
  await expect
    .poll(() => video()?.readyState ?? 0, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_METADATA);
}

async function playing() {
  await expect
    .poll(() => video().currentTime, { timeout: 15_000 })
    .toBeGreaterThan(0.25);
}

function Player(props: Partial<VideoPlayerProps>) {
  return <VideoPlayer title="Test clip" src={clip} defaultMuted {...props} />;
}

const captionTracks: VideoPlayerProps["tracks"] = [
  {
    kind: "captions",
    src: fixture("captions.en.vtt"),
    srcLang: "en",
    label: "English",
    default: true,
  },
  {
    kind: "subtitles",
    src: fixture("captions.es.vtt"),
    srcLang: "es",
    label: "Español",
  },
];

async function openSettings(submenu?: string) {
  await page.getByRole("button", { name: "Settings" }).click();
  if (submenu) {
    await page.getByRole("menuitem", { name: new RegExp(submenu) }).click();
  }
}

// An option in a submenu, chosen with a click on it. The click is the
// element's own: WebKit under Playwright moves the pointer from the
// submenu's trigger to the option in a way that closes the submenu first,
// which a person's pointer doesn't.
async function choose(name: string) {
  const option = page.getByRole("menuitemradio", { name });
  await expect.element(option).toBeInTheDocument();
  (option.element() as HTMLElement).click();
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
  localStorage.removeItem("test-player");
});

describe("rendering", () => {
  test("the server sends the video with its poster and the browser's own controls, and no style attribute", () => {
    const html = renderToString(
      <VideoPlayer
        title="Test clip"
        src={clip}
        poster={fixture("thumbnails.jpg")}
      />,
    );
    expect(html).toContain('<section aria-label="Test clip"');
    expect(html).toMatch(/<video[^>]*controls=""/);
    expect(html).toContain("poster=");
    expect(html).not.toContain(' style="');
    // The player's own controls come with the script.
    expect(html).not.toContain("nuv-video-player__controls");
  });

  test("in the browser its own controls take over", async () => {
    await render(<Player />);
    await loaded();
    expect(video().controls).toBe(false);
    await expect
      .element(page.getByRole("region", { name: "Test clip" }))
      .toBeInTheDocument();
    await expect
      .element(bar().getByRole("button", { name: "Play" }))
      .toBeVisible();
    for (const name of ["Unmute", "Settings"]) {
      await expect.element(page.getByRole("button", { name })).toBeVisible();
    }
    await expect
      .element(page.getByRole("slider", { name: "Seek" }))
      .toBeInTheDocument();
  });

  // Firefox makes a video a Tab stop of its own, with no name.
  test("Tab reaches the controls and not the video, unless the browser's controls are shown", async () => {
    const screen = await render(<Player />);
    await loaded();
    expect(video().tabIndex).toBe(-1);
    // Controls of the app's own, from the parts.
    await screen.rerender(<Player controls={false} />);
    expect(video().tabIndex).toBe(-1);
  });

  test("without a title it's named Video, or by its aria-label", async () => {
    const screen = await render(<VideoPlayer src={clip} />);
    expect(root().getAttribute("aria-label")).toBe("Video");
    await screen.rerender(<VideoPlayer src={clip} aria-label="Product tour" />);
    expect(root().getAttribute("aria-label")).toBe("Product tour");
  });

  test("it takes a class and other attributes", async () => {
    await render(<Player className="mine" data-test="yes" />);
    expect(root().classList).toContain("mine");
    expect(root().dataset.test).toBe("yes");
  });

  test("formats without heights are alternatives the browser chooses between", async () => {
    await render(
      <Player
        src={[
          { src: fixture("clip.webm"), type: "video/webm" },
          { src: clip, type: "video/mp4" },
        ]}
      />,
    );
    expect(video().querySelectorAll("source")).toHaveLength(2);
    expect(video().hasAttribute("src")).toBe(false);
    await loaded();
  });
});

describe("playing", () => {
  test("Play plays and Pause pauses, and the button says which", async () => {
    await render(<Player />);
    await loaded();
    await bar().getByRole("button", { name: "Play" }).click();
    await playing();
    expect(video().paused).toBe(false);
    await bar().getByRole("button", { name: "Pause" }).click();
    await expect.poll(() => video().paused).toBe(true);
    await expect
      .element(bar().getByRole("button", { name: "Play" }))
      .toBeInTheDocument();
  });

  test("the time and the seek bar follow it, in words for a screen reader", async () => {
    await render(<Player />);
    await loaded();
    const seek = page.getByRole("slider", { name: "Seek" });
    await expect
      .element(seek)
      .toHaveAttribute("aria-valuetext", "0 seconds of 6 seconds");
    video().currentTime = 3;
    await expect
      .element(seek)
      .toHaveAttribute("aria-valuetext", "3 seconds of 6 seconds");
    expect(
      document
        .querySelector(".nuv-media-time")
        ?.textContent?.replace(/\s/g, ""),
    ).toBe("0:03/0:06");
  });

  test("a press on the time shows the time left", async () => {
    await render(<Player />);
    await loaded();
    video().currentTime = 2;
    await page.getByRole("button", { name: "Show the time left" }).click();
    await expect
      .poll(() =>
        document.querySelector(".nuv-media-time")?.textContent?.trim(),
      )
      .toBe("-0:04");
  });

  test("the keys: k plays, numbers go to a tenth of the way, arrows and j and l skip, m mutes, up and down set the volume", async () => {
    await render(<Player skip={2} />);
    await loaded();
    root().focus();

    await userEvent.keyboard("5");
    await expect.poll(() => video().currentTime).toBeCloseTo(3, 1);
    await userEvent.keyboard("0");
    await expect.poll(() => video().currentTime).toBeCloseTo(0, 1);
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => video().currentTime).toBeCloseTo(5, 1);
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => video().currentTime).toBeCloseTo(0, 1);
    await userEvent.keyboard("l");
    await expect.poll(() => video().currentTime).toBeCloseTo(2, 1);
    await userEvent.keyboard("j");
    await expect.poll(() => video().currentTime).toBeCloseTo(0, 1);

    const muted = video().muted;
    await userEvent.keyboard("m");
    expect(video().muted).toBe(!muted);
    await userEvent.keyboard("{ArrowDown}");
    expect(video().volume).toBeCloseTo(0.95, 2);

    await userEvent.keyboard("k");
    await playing();
    await userEvent.keyboard("k");
    await expect.poll(() => video().paused).toBe(true);
  });

  test("a key the player used goes no further", async () => {
    const onKeyDown = vi.fn();
    document.addEventListener("keydown", onKeyDown);
    try {
      await render(<Player />);
      await loaded();
      root().focus();
      await userEvent.keyboard("m");
      expect(onKeyDown).not.toHaveBeenCalled();
      await userEvent.keyboard("q");
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener("keydown", onKeyDown);
    }
  });

  test("the seek bar: Home, End, the arrows, and a press where it's pressed", async () => {
    await render(<Player />);
    await loaded();
    const seek = page.getByRole("slider", { name: "Seek" });
    (seek.element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => video().currentTime).toBeCloseTo(5, 1);
    await userEvent.keyboard("{Home}");
    await expect.poll(() => video().currentTime).toBeCloseTo(0, 1);
    await userEvent.keyboard("{End}");
    await expect.poll(() => video().currentTime).toBeGreaterThan(5.9);

    const box = (seek.element() as HTMLElement).getBoundingClientRect();
    await seek.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await expect.poll(() => video().currentTime).toBeCloseTo(3, 0);
  });

  test("Space on a button presses the button, and doesn't also play", async () => {
    await render(<Player />);
    await loaded();
    (
      page.getByRole("button", { name: "Settings" }).element() as HTMLElement
    ).focus();
    await userEvent.keyboard(" ");
    await expect.element(page.getByRole("menu")).toBeVisible();
    expect(video().paused).toBe(true);
  });

  test("the speed comes from the menu and is said once, and the angle brackets step through it", async () => {
    await render(<Player />);
    await loaded();
    await openSettings("Speed");
    await choose("1.5×");
    expect(video().playbackRate).toBe(1.5);
    await expect.poll(said).toBe("Speed 1.5×");
    await userEvent.keyboard("{Escape}");
    root().focus();
    await userEvent.keyboard(">");
    expect(video().playbackRate).toBe(1.75);
    await userEvent.keyboard("<");
    await userEvent.keyboard("<");
    expect(video().playbackRate).toBe(1.25);
  });
});

describe("captions", () => {
  test("the default track is shown, drawn by the player and not the browser, and the button turns it off", async () => {
    await render(<Player tracks={captionTracks} />);
    await loaded();
    const button = page.getByRole("button", { name: "Captions" });
    await expect.element(button).toHaveAttribute("aria-pressed", "true");
    video().currentTime = 0.5;
    await expect.poll(captionText).toBe("The first line.");
    for (const track of Array.from(video().textTracks)) {
      expect(track.mode).not.toBe("showing");
    }

    await button.click();
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    await expect.poll(said).toBe("Captions off");
    await expect
      .poll(
        () =>
          document.querySelector<HTMLElement>(".nuv-video-player__captions")
            ?.hidden,
      )
      .toBe(true);
  });

  test("another language from the menu, with its italics kept", async () => {
    await render(<Player tracks={captionTracks} />);
    await loaded();
    await openSettings("Captions");
    await choose("Español");
    await expect.poll(said).toBe("Captions on, Español");
    video().currentTime = 2.5;
    await expect.poll(captionText).toBe("La segunda línea.");
    expect(
      document.querySelector(".nuv-video-player__cue")?.innerHTML,
    ).toContain("<i>segunda</i>");
  });

  test("the size comes from the menu", async () => {
    await render(<Player tracks={captionTracks} />);
    await loaded();
    await openSettings("Captions");
    await choose("Large");
    expect(
      document.querySelector<HTMLElement>(".nuv-video-player__captions")
        ?.dataset.size,
    ).toBe("large");
  });

  test("the button isn't there without captions", async () => {
    await render(<Player />);
    await loaded();
    expect(
      document.querySelector('.nuv-video-player__bar [aria-label="Captions"]'),
    ).toBeNull();
  });
});

describe("chapters and previews", () => {
  test("a chapters track splits the seek bar, and the preview names the chapter and shows a frame", async () => {
    await render(
      <Player
        tracks={[{ kind: "chapters", src: fixture("chapters.vtt") }]}
        thumbnails={fixture("thumbnails.vtt")}
      />,
    );
    await loaded();
    await expect
      .poll(() => document.querySelectorAll(".nuv-media-seek__part").length)
      .toBe(3);

    const seek = page.getByRole("slider", { name: "Seek" });
    const box = (seek.element() as HTMLElement).getBoundingClientRect();
    await seek.hover({ position: { x: box.width * 0.5, y: box.height / 2 } });
    const preview = page.elementLocator(
      document.querySelector(".nuv-media-seek__preview") as HTMLElement,
    );
    await expect.element(preview).toBeVisible();
    await expect
      .poll(() => preview.element().textContent)
      .toContain("Building the screen");
    await expect
      .poll(
        () =>
          document.querySelector<HTMLElement>(".nuv-media-seek__frame")?.style
            .backgroundImage ?? "",
      )
      .toContain("thumbnails.jpg");
  });

  test("chapters given as a list take the place of a track", async () => {
    await render(
      <Player
        tracks={[{ kind: "chapters", src: fixture("chapters.vtt") }]}
        chapters={[
          { start: 0, title: "Start" },
          { start: 3, title: "Rest" },
        ]}
      />,
    );
    await loaded();
    await expect
      .poll(() => document.querySelectorAll(".nuv-media-seek__part").length)
      .toBe(2);
  });

  test("time the chapters leave out is a part of its own, so the bar is the whole length", async () => {
    await render(<Player chapters={[{ start: 2, end: 4, title: "Middle" }]} />);
    await loaded();
    await expect
      .poll(() =>
        Array.from(
          document.querySelectorAll<HTMLElement>(".nuv-media-seek__part"),
        ).map((part) => Math.round(Number(part.style.flexGrow))),
      )
      .toEqual([2, 2, 2]);
  });
});

describe("qualities", () => {
  test("sources with heights fill the quality menu, and a change keeps the place", async () => {
    await render(
      <Player
        src={[
          { src: clip, type: "video/mp4", height: 360 },
          { src: fixture("clip.webm"), type: "video/webm", height: 180 },
        ]}
      />,
    );
    await loaded();
    video().currentTime = 2;
    await expect.poll(() => video().currentTime).toBeCloseTo(2, 1);
    await openSettings("Quality");
    await expect
      .element(page.getByRole("menuitemradio", { name: "360p" }))
      .toHaveAttribute("aria-checked", "true");
    await choose("180p");
    await expect.poll(() => video().currentSrc).toContain("clip.webm");
    await expect.poll(() => video().currentTime).toBeCloseTo(2, 0);
    await expect.poll(said).toBe("Quality 180p");
  });
});

describe("streams", () => {
  test("HLS through hls.js: its levels fill the quality menu, with Auto first", async () => {
    await render(<Player src={hlsStream} hls={() => import("hls.js")} />);
    await loaded();
    expect(video().src.startsWith("blob:")).toBe(true);
    await openSettings("Quality");
    const items = page.getByRole("menuitemradio");
    await expect
      .poll(() => items.elements().map((item) => item.textContent))
      .toEqual([expect.stringMatching(/^Auto/), "360p", "180p"]);
    await choose("180p");
    await bar().getByRole("button", { name: "Play" }).click();
    await playing();
  });

  test("DASH through dashjs", async () => {
    await render(<Player src={dashStream} dash={() => import("dashjs")} />);
    await loaded();
    await openSettings("Quality");
    await expect
      .element(page.getByRole("menuitemradio", { name: "180p" }))
      .toBeInTheDocument();
    await userEvent.keyboard("{Escape}{Escape}");
    await bar().getByRole("button", { name: "Play" }).click();
    await playing();
  });

  test("an HLS stream with no library, in a browser that can't play HLS, says so and names what to pass", async ({
    skip,
  }) => {
    if (
      document
        .createElement("video")
        .canPlayType("application/vnd.apple.mpegurl")
    ) {
      skip("this browser plays HLS itself");
    }
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onError = vi.fn();
    await render(<Player src={hlsStream} onError={onError} />);
    await expect
      .poll(() => document.querySelector('[role="alert"]')?.textContent)
      .toContain("This video can't be played in this browser.");
    expect(onError).toHaveBeenCalledWith("unsupported");
    expect(warn.mock.calls[0]?.[0]).toContain('hls={() => import("hls.js")}');
  });

  test("a file that isn't there says it couldn't be loaded, with a way to try again", async () => {
    await render(<Player src={fixture("missing.mp4")} />);
    await expect
      .poll(() => document.querySelector('[role="alert"]')?.textContent)
      .toContain("The video couldn't be loaded.");
    await expect
      .element(page.getByRole("button", { name: "Try again" }))
      .toBeVisible();
  });
});

describe("loading less", () => {
  test("a facade is the poster and a button, and the video comes at the press", async () => {
    await render(<Player facade poster={fixture("thumbnails.jpg")} />);
    expect(video()).toBeNull();
    expect(document.querySelector(".nuv-video-player__poster")).not.toBeNull();
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(() => video()).not.toBeNull();
    await playing();
  });

  test("lazy loads nothing until the player is near the screen", async () => {
    await render(
      <div>
        <div style={{ height: 3000 }} />
        <Player lazy />
      </div>,
    );
    expect(video().hasAttribute("src")).toBe(false);
    expect(video().preload).toBe("none");
    root().scrollIntoView();
    await expect.poll(() => video().getAttribute("src")).toContain("clip.mp4");
  });
});

describe("settings kept with persist", () => {
  test("the volume and the speed are there next time", async () => {
    const screen = await render(<Player persist="test-player" />);
    await loaded();
    root().focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await userEvent.keyboard(">");
    await screen.unmount();

    await render(<Player persist="test-player" />);
    await loaded();
    await expect.poll(() => video().volume).toBeCloseTo(0.9, 2);
    expect(video().playbackRate).toBe(1.25);
  });

  test("nothing is kept without it", async () => {
    await render(<Player />);
    await loaded();
    root().focus();
    await userEvent.keyboard(">");
    expect(video().playbackRate).toBe(1.25);
    expect(localStorage.getItem("nuvui-media")).toBeNull();
  });
});

describe("one at a time", () => {
  test("starting one player pauses the other in its group", async () => {
    await render(
      <>
        <Player title="First" exclusive="lesson" />
        <Player title="Second" exclusive="lesson" />
      </>,
    );
    const [first, second] = Array.from(
      document.querySelectorAll<HTMLVideoElement>(".nuv-video-player video"),
    ) as [HTMLVideoElement, HTMLVideoElement];
    await expect.poll(() => second.readyState).toBeGreaterThanOrEqual(1);
    await first.play();
    await expect.poll(() => first.paused).toBe(false);
    await second.play();
    await expect.poll(() => first.paused).toBe(true);
    expect(second.paused).toBe(false);
  });
});

describe("the controls", () => {
  test("they hide while it plays and nothing moves, come back on a move, and stay while paused", async () => {
    await render(
      <div>
        <button type="button">Elsewhere</button>
        <Player />
      </div>,
    );
    await loaded();
    await bar().getByRole("button", { name: "Play" }).click();
    await playing();
    await userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));
    await expect
      .poll(() => root().hasAttribute("data-controls"), { timeout: 5000 })
      .toBe(false);
    await userEvent.hover(page.getByRole("region", { name: "Test clip" }));
    await expect.poll(() => root().hasAttribute("data-controls")).toBe(true);

    video().pause();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    expect(root().hasAttribute("data-controls")).toBe(true);
  });

  test("fullscreen asks for the whole player, not the video", async ({
    skip,
  }) => {
    await render(<Player />);
    await loaded();
    const button = page.getByRole("button", { name: "Full screen" });
    if (!button.query()) skip("this browser has no fullscreen");
    const request = vi
      .spyOn(HTMLElement.prototype, "requestFullscreen")
      .mockResolvedValue(undefined);
    await button.click();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.contexts[0]).toBe(root());
  });

  test("? shows the keyboard shortcuts", async () => {
    await render(<Player />);
    await loaded();
    root().focus();
    await userEvent.keyboard("?");
    await expect
      .element(page.getByRole("dialog", { name: "Keyboard shortcuts" }))
      .toBeVisible();
    expect(root().querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe("from the app", () => {
  test("the handle plays, seeks and pauses, and hands over the video", async () => {
    const handle = createRef<MediaPlayerHandle>();
    const onTimeUpdate = vi.fn();
    await render(<Player handleRef={handle} onTimeUpdate={onTimeUpdate} />);
    await loaded();
    expect(handle.current?.media).toBe(video());
    handle.current?.seek(2);
    await expect.poll(() => video().currentTime).toBeCloseTo(2, 1);
    handle.current?.play();
    await expect.poll(() => onTimeUpdate.mock.calls.length).toBeGreaterThan(0);
    handle.current?.pause();
    await expect.poll(() => video().paused).toBe(true);
  });

  test("it starts where startTime says", async () => {
    await render(<Player startTime={4} />);
    await loaded();
    await expect.poll(() => video().currentTime).toBeCloseTo(4, 1);
  });

  test("the lock screen has its title while it plays", async ({ skip }) => {
    if (!("mediaSession" in navigator))
      skip("this browser has no Media Session");
    await render(<Player title="Lesson one" />);
    await loaded();
    await bar().getByRole("button", { name: "Play" }).click();
    await expect
      .poll(() => navigator.mediaSession.metadata?.title)
      .toBe("Lesson one");
  });
});

describe("right to left", () => {
  test("the arrow that points back goes back, on the player and on the seek bar", async () => {
    await render(
      <div dir="rtl">
        <Player />
      </div>,
    );
    await loaded();
    video().currentTime = 3;
    root().focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => video().currentTime).toBeGreaterThan(5.9);

    const seek = page.getByRole("slider", { name: "Seek" });
    (seek.element() as HTMLElement).focus();
    await userEvent.keyboard("{Home}{ArrowLeft}");
    await expect.poll(() => video().currentTime).toBeCloseTo(5, 1);
    // What's played grows from the right.
    const fill = document.querySelector(".nuv-media-seek__fill") as Element;
    expect(getComputedStyle(fill).transformOrigin.startsWith("0px")).toBe(
      false,
    );
  });
});

describe("translation", () => {
  test("every word comes from labels", async () => {
    function Spanish() {
      const [labels] = useState({
        play: "Reproducir",
        settings: "Ajustes",
        seek: "Buscar",
      });
      return <Player labels={labels} />;
    }
    await render(<Spanish />);
    await loaded();
    await expect
      .element(bar().getByRole("button", { name: "Reproducir" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Ajustes" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("slider", { name: "Buscar" }))
      .toBeInTheDocument();
  });
});

describe("how it's drawn", () => {
  test("the ambient glow is gone when less motion is asked for", async () => {
    await render(<Player ambient />);
    await loaded();
    const glow = document.querySelector(
      ".nuv-video-player__ambient",
    ) as Element;
    await emulateMedia({ reducedMotion: "no-preference" });
    try {
      expect(getComputedStyle(glow).display).not.toBe("none");
      await emulateMedia({ reducedMotion: "reduce" });
      expect(getComputedStyle(glow).display).toBe("none");
    } finally {
      await emulateMedia({ reducedMotion: null });
    }
  });

  test("where the browser forces its colors, the controls are on the system's colors", async ({
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
      const controls = document.querySelector(
        ".nuv-video-player__controls",
      ) as Element;
      expect(getComputedStyle(controls).backgroundColor).toBe(system("Canvas"));
    } finally {
      await emulateMedia({ forcedColors: null });
    }
  });
});

describe("accessibility", () => {
  test.for(themes)("the player passes axe in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <Player tracks={captionTracks} />,
    );
    await loaded();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("the settings menu passes axe", async () => {
    const { container } = await render(<Player tracks={captionTracks} />);
    await loaded();
    await openSettings();
    expect(await axe(container)).toHaveNoViolations();
  });
});
