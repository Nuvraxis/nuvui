"use client";

import { Button } from "@nuvui/react/button";
import { TooltipProvider } from "@nuvui/react/tooltip";
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaContext,
  type MediaContextValue,
  useMediaState,
} from "../../core/context";
import {
  enterFullscreen,
  exitFullscreen,
  fullscreenElement,
} from "../../core/fullscreen";
import { handlePlayerKey } from "../../core/keys";
import { englishLabels } from "../../core/labels";
import { readSettings } from "../../core/persist";
import {
  defaultRates,
  type MediaPlayerCommonProps,
  sourcesOf,
  storageKeyOf,
  usePlayer,
} from "../../core/player";
import type { MediaSourceItem } from "../../core/sources";
import { MediaStore } from "../../core/store";
import { parseThumbnails } from "../../core/vtt";
import { PlayIcon } from "../../parts/icons";
import {
  MediaCaptionsButton,
  MediaFullscreenButton,
  MediaPictureInPictureButton,
  MediaPlayButton,
  MediaSeek,
  MediaSettings,
  MediaTime,
  MediaVolume,
} from "../../parts/parts";
import { MediaShortcuts, videoShortcuts } from "../../parts/shortcuts";
import { cx } from "../../utils/cx";

export type { MediaPlayerHandle, MediaTrackItem } from "../../core/player";

// The video player's own, listed before what both players take.
interface VideoProps {
  /**
   * What to play: an address, a source, or several. Sources with a `height`
   * or a `label` are qualities, and fill the quality menu. Sources without
   * are alternatives, such as WebM and MP4, of which the browser plays the
   * first it can. An `.m3u8` or `.mpd` address is a stream.
   */
  src: string | MediaSourceItem | MediaSourceItem[];
  /** The picture shown before it plays. */
  poster?: string;
  /** The video's title: the player's name, and what the lock screen shows. */
  title?: string;
  /** The player's name for a screen reader. Defaults to `title`. */
  "aria-label"?: string;
  /** A WebVTT file of frames for the preview over the seek bar. */
  thumbnails?: string;
  /**
   * Starts on its own. Only allowed muted, as browsers require, so it's
   * muted when this is set. Moving video that starts by itself is a
   * problem for some people: give it a reason.
   */
  autoPlay?: boolean;
  /**
   * How much to load before it plays. With `lazy`, nothing until the player
   * is near the screen.
   * @default "metadata"
   */
  preload?: "none" | "metadata" | "auto";
  /** Loads nothing until the player is near the screen. */
  lazy?: boolean;
  /**
   * Shows only the poster and a play button, and puts the video on the page
   * at the first press. For a page with many videos.
   */
  facade?: boolean;
  /** Seconds the J and L keys and a double tap go. @default 10 */
  skip?: number;
  /** A soft glow around the frame in the video's own colors. */
  ambient?: boolean;
  /**
   * The player's own controls. Set to false to lay out your own from the
   * parts, as children.
   * @default true
   */
  controls?: boolean;
  /** Over the video: your own controls from the parts, or anything else. */
  children?: ReactNode;
}

export interface VideoPlayerOwnProps
  extends VideoProps,
    Omit<MediaPlayerCommonProps, "preload"> {}

export interface VideoPlayerProps
  extends VideoPlayerOwnProps,
    Omit<HTMLAttributes<HTMLElement>, keyof VideoPlayerOwnProps> {}

// How long the controls stay after the last move while it plays.
const idleAfter = 2500;
// Two taps closer than this are a double tap.
const doubleTap = 300;

const qualityLabel = (source: MediaSourceItem, index: number) =>
  source.label ?? (source.height ? `${source.height}p` : String(index + 1));

/**
 * A video with its own controls: play, seek with chapters and previews,
 * volume, speed, quality, captions drawn in the theme, picture in picture
 * and fullscreen, from a pointer, a finger or the keyboard. Plays files
 * itself, and HLS and DASH streams through hls.js and dashjs when given
 * them.
 */
export function VideoPlayer({
  src,
  poster,
  title,
  "aria-label": ariaLabel,
  tracks,
  chapters,
  thumbnails,
  autoPlay = false,
  defaultMuted = false,
  defaultVolume,
  defaultRate,
  loop,
  startTime,
  preload = "metadata",
  lazy = false,
  facade = false,
  crossOrigin,
  rates = defaultRates,
  skip = 10,
  persist,
  exclusive,
  ambient = false,
  controls = true,
  hls,
  dash,
  hlsConfig,
  dashSettings,
  attachSource,
  labels: labelsProp,
  handleRef,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onError,
  children,
  className,
  onKeyDown,
  ...props
}: VideoPlayerProps) {
  const [store] = useState(() => new MediaStore());
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const labels = useMemo(
    () => ({ ...englishLabels, ...labelsProp }),
    [labelsProp],
  );
  const storageKey = storageKeyOf(persist);

  // Until the script runs, the browser's own controls are shown, so the
  // video plays from the server's HTML alone.
  const [hydrated, setHydrated] = useState(false);
  const [activated, setActivated] = useState(!facade);
  const [near, setNear] = useState(!lazy);
  const [attempt, setAttempt] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const sources = useMemo(() => sourcesOf(src), [src]);
  const { save, streamKind, first } = usePlayer({
    store,
    media: videoRef,
    sources,
    storageKey,
    autoPlay,
    defaultMuted,
    defaultVolume,
    defaultRate,
    startTime,
    exclusive,
    chapters,
    tracks,
    hls,
    dash,
    hlsConfig,
    dashSettings,
    attachSource,
    handleRef,
    onError,
    element: activated ? attempt : -1,
    load: near && activated,
    session: {
      title: title ?? ariaLabel,
      artwork: poster,
      back: skip,
      ahead: skip,
    },
    onHandlePlay: () => setActivated(true),
  });

  const qualityMode =
    streamKind === "file" &&
    sources.some(
      (source) => source.height !== undefined || source.label !== undefined,
    );

  // Of the qualities, the ones this browser can play. On the server, all.
  const playable = useMemo(() => {
    if (!qualityMode || !hydrated) return sources;
    const probe = document.createElement("video");
    const kept = sources.filter(
      (source) => !source.type || probe.canPlayType(source.type) !== "",
    );
    return kept.length > 0 ? kept : sources;
  }, [qualityMode, hydrated, sources]);

  const [qualityIndex, setQualityIndex] = useState(0);
  const active = qualityMode
    ? (playable[qualityIndex] ?? playable[0])
    : undefined;

  // The quality chosen before, among those this browser can play, before
  // anything has played.
  useEffect(() => {
    if (!qualityMode || !hydrated || !storageKey) return;
    const saved = readSettings(storageKey).quality;
    const found = playable.findIndex((s) => String(s.height) === saved);
    if (found >= 0) setQualityIndex(found);
  }, [qualityMode, hydrated, storageKey, playable]);

  const context = useMemo<MediaContextValue>(
    () => ({
      kind: "video",
      store,
      labels,
      root: rootRef,
      rates,
      skip,
      save,
      showShortcuts: () => setShortcutsOpen(true),
    }),
    [store, labels, rates, skip, save],
  );

  useEffect(() => setHydrated(true), []);

  // Qualities from the sources, for files.
  useEffect(() => {
    if (!qualityMode) {
      if (streamKind === "file") store.set({ qualities: [] });
      return;
    }
    store.set({
      qualities: playable.map((source, index) => ({
        id: String(index),
        label: qualityLabel(source, index),
        height: source.height,
      })),
      quality: String(qualityIndex),
      playingQuality: String(qualityIndex),
    });
    store.handlers.quality = (id) => {
      const video = videoRef.current;
      if (!video || id === "auto") return;
      // The same place, and playing if it was.
      const time = video.currentTime;
      const wasPlaying = !video.paused;
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = time;
          if (wasPlaying) store.play();
        },
        { once: true },
      );
      setQualityIndex(Number(id));
    };
  }, [qualityMode, streamKind, playable, qualityIndex, store]);

  // The thumbnails track, which browsers don't read.
  useEffect(() => {
    if (!thumbnails) {
      store.set({ thumbnails: [] });
      return;
    }
    let current = true;
    const base =
      typeof window === "undefined"
        ? thumbnails
        : new URL(thumbnails, window.location.href).href;
    fetch(thumbnails, {
      credentials:
        crossOrigin === "use-credentials" ? "include" : "same-origin",
    })
      .then((response) => (response.ok ? response.text() : ""))
      .then((text) => {
        if (current) store.set({ thumbnails: parseThumbnails(text, base) });
      })
      .catch(() => {
        // No previews, and the bar works as before.
      });
    return () => {
      current = false;
    };
  }, [thumbnails, crossOrigin, store]);

  // Nothing is loaded until the player is near the screen.
  useEffect(() => {
    if (near) return;
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);

  // Fullscreen, however it was entered or left.
  useEffect(() => {
    const onChange = () => {
      const element = fullscreenElement();
      store.set({
        fullscreen: element !== null && element === rootRef.current,
      });
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [store]);

  // The controls hide while it plays and nothing moves.
  const paused = useMediaState(store, (s) => s.paused);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wake = useCallback(() => {
    store.set({ controlsVisible: true });
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const controls = rootRef.current?.querySelector(
        ".nuv-video-player__controls",
      );
      // Kept while the pointer rests on them, a menu of theirs is open, the
      // keyboard is on one of them, or the seek bar is being dragged. Focus
      // left on a button by a press of the mouse doesn't count.
      const busy =
        controls?.matches(":hover") ||
        controls?.querySelector(
          '[data-state="open"], :focus-visible, [data-dragging]',
        );
      if (!store.getState().paused && !busy) {
        store.set({ controlsVisible: false });
      }
    }, idleAfter);
  }, [store]);
  useEffect(() => {
    if (paused) {
      clearTimeout(idleTimer.current);
      store.set({ controlsVisible: true });
    } else wake();
  }, [paused, wake, store]);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // A press on the picture plays and pauses with a mouse. A tap shows and
  // hides the controls, and a double tap at either side skips.
  const lastTap = useRef({ time: 0, x: 0 });
  // A double tap fires dblclick in some browsers too. Only a mouse's goes
  // fullscreen.
  const lastPointer = useRef("mouse");
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [ripple, setRipple] = useState<{
    side: "back" | "ahead";
    key: number;
  } | null>(null);
  const onSurfacePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    rootRef.current?.focus({ preventScroll: true });
    lastPointer.current = event.pointerType;
    if (event.pointerType === "mouse") {
      if (event.button === 0) store.toggle();
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const now = event.timeStamp;
    const before = lastTap.current;
    lastTap.current = { time: now, x };
    // Two taps close together on the same side. A third goes on skipping.
    const sameSide =
      (x < 1 / 3 && before.x < 1 / 3) || (x > 2 / 3 && before.x > 2 / 3);
    if (now - before.time < doubleTap && sameSide) {
      clearTimeout(tapTimer.current);
      const rtl = rootRef.current
        ? getComputedStyle(rootRef.current).direction === "rtl"
        : false;
      const back = rtl ? x > 2 / 3 : x < 1 / 3;
      store.skip(back ? -skip : skip);
      store.say(back ? labels.skipBack(skip) : labels.skipAhead(skip));
      setRipple({ side: back ? "back" : "ahead", key: now });
      return;
    }
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      const visible = store.getState().controlsVisible;
      if (visible && !store.getState().paused) {
        clearTimeout(idleTimer.current);
        store.set({ controlsVisible: false });
      } else wake();
    }, doubleTap);
  };
  useEffect(() => () => clearTimeout(tapTimer.current), []);

  const toggleFullscreen = () => {
    if (store.getState().fullscreen) void exitFullscreen();
    else if (rootRef.current)
      void enterFullscreen(rootRef.current, videoRef.current);
  };

  // The keys work while focus is anywhere in the player.
  const onPlayerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    const frame = (by: number) => () => {
      if (!store.getState().paused) return false;
      store.skip(by);
      return true;
    };
    const handled = handlePlayerKey(event, {
      store,
      root: rootRef.current,
      labels,
      rates,
      back: skip,
      ahead: skip,
      save,
      extra: {
        f: () => {
          toggleFullscreen();
          return true;
        },
        c: () => {
          const button = rootRef.current?.querySelector<HTMLButtonElement>(
            ".nuv-video-player__captions-button",
          );
          button?.click();
          return Boolean(button);
        },
        ",": frame(-1 / 30),
        ".": frame(1 / 30),
        "?": () => {
          setShortcutsOpen(true);
          return true;
        },
      },
    });
    if (handled) wake();
  };

  const started = useMediaState(store, (s) => s.started);
  const waiting = useMediaState(store, (s) => s.waiting);
  const error = useMediaState(store, (s) => s.error);
  const fullscreen = useMediaState(store, (s) => s.fullscreen);
  const controlsVisible = useMediaState(store, (s) => s.controlsVisible);
  const captionSize = useMediaState(store, (s) => s.captionSize);
  const message = useMediaState(store, (s) => s.message);
  const name = ariaLabel ?? title ?? labels.video;

  const errorText =
    error === "network"
      ? labels.errorNetwork
      : error === "unsupported"
        ? labels.errorUnsupported
        : labels.errorDecode;

  const retry = () => {
    const video = videoRef.current;
    const time = video?.currentTime ?? 0;
    store.set({ error: null });
    if (streamKind === "file" && video) {
      video.load();
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = time;
          store.play();
        },
        { once: true },
      );
    } else setAttempt((n) => n + 1);
  };

  const showControls = controls && hydrated && activated;

  return (
    <MediaContext.Provider value={context}>
      <TooltipProvider delayDuration={400}>
        <section
          {...props}
          ref={rootRef}
          aria-label={name}
          tabIndex={-1}
          className={cx("nuv-video-player", className)}
          data-ready={hydrated ? "" : undefined}
          data-paused={paused ? "" : undefined}
          data-started={started ? "" : undefined}
          data-controls={controlsVisible || !started ? "" : undefined}
          data-fullscreen={fullscreen ? "" : undefined}
          data-ambient={ambient ? "" : undefined}
          onKeyDown={onPlayerKeyDown}
          onPointerMove={(event) => {
            if (event.pointerType === "mouse") wake();
          }}
          onFocus={wake}
        >
          {ambient && activated && <Ambient video={videoRef} store={store} />}
          <div className="nuv-video-player__frame">
            {activated ? (
              <video
                key={attempt}
                ref={videoRef}
                className="nuv-video-player__media"
                poster={poster}
                preload={near ? preload : "none"}
                playsInline
                autoPlay={autoPlay || (facade && hydrated)}
                muted={autoPlay || defaultMuted}
                loop={loop}
                crossOrigin={crossOrigin}
                controls={!showControls && controls}
                // Firefox puts a video in the Tab order even without its own
                // controls, as a stop with no name. The player's controls,
                // or the app's, are what Tab should reach.
                tabIndex={!showControls && controls ? undefined : -1}
                src={
                  streamKind !== "file" || !near
                    ? undefined
                    : qualityMode
                      ? active?.src
                      : sources.length === 1
                        ? first.src
                        : undefined
                }
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
                onTimeUpdate={
                  onTimeUpdate
                    ? (event) => onTimeUpdate(event.currentTarget.currentTime)
                    : undefined
                }
                onError={() => {
                  const kind = store.getState().error;
                  if (kind) onError?.(kind);
                }}
              >
                {streamKind === "file" &&
                  !qualityMode &&
                  sources.length > 1 &&
                  near &&
                  sources.map((source) => (
                    <source
                      key={source.src}
                      src={source.src}
                      type={source.type}
                    />
                  ))}
                {tracks?.map((track) => (
                  <track
                    key={track.src}
                    src={track.src}
                    kind={track.kind}
                    srcLang={track.srcLang}
                    label={track.label}
                  />
                ))}
              </video>
            ) : (
              poster && (
                <img className="nuv-video-player__poster" src={poster} alt="" />
              )
            )}

            {activated && <Captions store={store} size={captionSize} />}

            {showControls && (
              <div
                className="nuv-video-player__surface"
                aria-hidden="true"
                onPointerUp={onSurfacePointerUp}
                onDoubleClick={() => {
                  if (lastPointer.current === "mouse") toggleFullscreen();
                }}
              />
            )}

            {ripple && (
              <span
                key={ripple.key}
                className="nuv-video-player__ripple"
                data-side={ripple.side}
                aria-hidden="true"
                onAnimationEnd={() => setRipple(null)}
              >
                {ripple.side === "back" ? `-${skip}` : `+${skip}`}
              </span>
            )}

            {(!activated || (showControls && !started && paused && !error)) && (
              <button
                type="button"
                className="nuv-video-player__big-play"
                aria-label={labels.play}
                onClick={() => {
                  if (!activated) setActivated(true);
                  else store.play();
                }}
              >
                <PlayIcon />
              </button>
            )}

            {waiting && !error && (
              <span
                className="nuv-video-player__spinner"
                role="status"
                aria-label={labels.loading}
              />
            )}

            {error && (
              <div className="nuv-video-player__error" role="alert">
                <p>{errorText}</p>
                {error !== "unsupported" && (
                  <Button intent="secondary" size="sm" onClick={retry}>
                    {labels.retry}
                  </Button>
                )}
              </div>
            )}

            {children}

            {showControls && (
              <div className="nuv-video-player__controls">
                <MediaSeek className="nuv-video-player__seek" />
                <div className="nuv-video-player__bar">
                  <MediaPlayButton />
                  <MediaVolume />
                  <MediaTime />
                  <span className="nuv-video-player__spacer" />
                  <MediaCaptionsButton className="nuv-video-player__captions-button" />
                  <MediaSettings />
                  <MediaPictureInPictureButton className="nuv-video-player__pip" />
                  <MediaFullscreenButton />
                </div>
              </div>
            )}
          </div>

          <div className="nuv-media-hidden" role="status">
            {message}
          </div>

          <MediaShortcuts
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
            labels={labels}
            list={videoShortcuts(labels, skip)}
            container={rootRef}
          />
        </section>
      </TooltipProvider>
    </MediaContext.Provider>
  );
}

// The captions shown now, drawn by the player so they take the theme and
// the size the viewer chose. A screen reader has the transcript, or the
// sound itself, so these are hidden from it.
function Captions({ store, size }: { store: MediaStore; size: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      store.onCues((cues) => {
        const element = ref.current;
        if (!element) return;
        const lines = cues.map((cue) => {
          const line = document.createElement("span");
          line.className = "nuv-video-player__cue";
          const vtt = cue as VTTCue;
          // getCueAsHTML keeps the cue's italics and voices and nothing
          // that could run.
          if (typeof vtt.getCueAsHTML === "function") {
            line.append(vtt.getCueAsHTML());
          } else {
            line.textContent = vtt.text ?? "";
          }
          return line;
        });
        element.replaceChildren(...lines);
        element.hidden = lines.length === 0;
      }),
    [store],
  );
  return (
    <div
      ref={ref}
      className="nuv-video-player__captions"
      data-size={size}
      aria-hidden="true"
      hidden
    />
  );
}

// The glow around the frame: the picture drawn small onto a canvas a few
// times a second, which the stylesheet blurs and spreads. Off when less
// motion is asked for, and where the browser forces colors.
function Ambient({
  video,
  store,
}: {
  video: { current: HTMLVideoElement | null };
  store: MediaStore;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const still =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      matchMedia("(forced-colors: active)").matches;
    if (still) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const draw = () => {
      const media = video.current;
      if (!media || media.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
        return;
      try {
        context.drawImage(media, 0, 0, canvas.width, canvas.height);
      } catch {
        // A frame that can't be drawn yet.
      }
    };
    const run = () => {
      const { paused } = store.getState();
      clearInterval(timer);
      draw();
      if (!paused) timer = setInterval(draw, 250);
    };
    run();
    const off = store.subscribe(run);
    return () => {
      off();
      clearInterval(timer);
    };
  }, [video, store]);
  return (
    <canvas
      ref={ref}
      className="nuv-video-player__ambient"
      width={32}
      height={18}
    />
  );
}
