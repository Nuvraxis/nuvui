"use client";

import { Button } from "@nuvui/react/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@nuvui/react/dialog";
import { Kbd } from "@nuvui/react/kbd";
import { TooltipProvider } from "@nuvui/react/tooltip";
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaContext,
  type MediaContextValue,
  useIsomorphicLayoutEffect,
  useLatest,
  useMediaState,
} from "../../core/context";
import { joinGroup } from "../../core/exclusive";
import {
  enterFullscreen,
  exitFullscreen,
  fullscreenElement,
} from "../../core/fullscreen";
import { englishLabels, type MediaLabels } from "../../core/labels";
import {
  defaultStorageKey,
  readSettings,
  type SavedSettings,
  writeSettings,
} from "../../core/persist";
import {
  attachStream,
  type DashLoader,
  type HlsLoader,
  kindOf,
  type MediaSourceItem,
  type StreamError,
} from "../../core/sources";
import { type MediaChapter, MediaStore } from "../../core/store";
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
import { cx } from "../../utils/cx";

/** A text track: captions, subtitles, chapters or descriptions, as WebVTT. */
export interface MediaTrackItem {
  src: string;
  kind: "captions" | "subtitles" | "chapters" | "descriptions" | "metadata";
  /** Its language, such as "en" or "pt-BR". */
  srcLang?: string;
  /** Its name in the captions menu. */
  label?: string;
  /** Shown from the start, unless the viewer turned captions off before. */
  default?: boolean;
}

/** What an app can do to a player from outside it. */
export interface MediaPlayerHandle {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  /** The media element, once it's on the page. */
  readonly media: HTMLMediaElement | null;
  /** The player's state, for a part outside it such as `MediaTranscript`. */
  readonly store: MediaStore;
}

export interface VideoPlayerOwnProps {
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
  /** Captions, subtitles and chapters, as WebVTT files. */
  tracks?: MediaTrackItem[];
  /** Chapters, which replace a chapters track if there is one. */
  chapters?: MediaChapter[];
  /** A WebVTT file of frames for the preview over the seek bar. */
  thumbnails?: string;
  /**
   * Starts on its own. Only allowed muted, as browsers require, so it's
   * muted when this is set. Moving video that starts by itself is a
   * problem for some people: give it a reason.
   */
  autoPlay?: boolean;
  /** @default false */
  defaultMuted?: boolean;
  /** From 0 to 1. @default 1 */
  defaultVolume?: number;
  /** @default 1 */
  defaultRate?: number;
  loop?: boolean;
  /** Where to start, in seconds. */
  startTime?: number;
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
  crossOrigin?: "anonymous" | "use-credentials";
  /** The speeds in the menu. @default [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] */
  rates?: number[];
  /** Seconds the J and L keys and a double tap go. @default 10 */
  skip?: number;
  /**
   * Keeps volume, speed, captions and quality between visits, in
   * `localStorage`, under this key, or "nuvui-media" with `true`.
   */
  persist?: boolean | string;
  /**
   * Starting this player pauses every other player in the same group. A
   * name for the group, or `true` for one shared by all.
   */
  exclusive?: boolean | string;
  /** A soft glow around the frame in the video's own colors. */
  ambient?: boolean;
  /**
   * The player's own controls. Set to false to lay out your own from the
   * parts, as children.
   * @default true
   */
  controls?: boolean;
  /** Loads hls.js for an HLS stream: `() => import("hls.js")`. */
  hls?: HlsLoader;
  /** Loads dashjs for a DASH stream: `() => import("dashjs")`. */
  dash?: DashLoader;
  /** Passed to `new Hls()`. */
  hlsConfig?: Record<string, unknown>;
  /** Passed to dashjs's `updateSettings()`. */
  dashSettings?: Record<string, unknown>;
  /**
   * Plays the source yourself, for DRM or a library of your own: given the
   * media element and the source, it returns what undoes it.
   */
  attachSource?: (
    media: HTMLMediaElement,
    source: MediaSourceItem,
  ) => (() => void) | undefined;
  /** The words, to translate the player. */
  labels?: Partial<MediaLabels>;
  handleRef?: Ref<MediaPlayerHandle>;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  /** About four times a second while it plays, with the time in seconds. */
  onTimeUpdate?: (time: number) => void;
  onError?: (kind: StreamError) => void;
  /** Over the video: your own controls from the parts, or anything else. */
  children?: ReactNode;
}

export interface VideoPlayerProps
  extends VideoPlayerOwnProps,
    Omit<HTMLAttributes<HTMLElement>, keyof VideoPlayerOwnProps> {}

const defaultRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// How long the controls stay after the last move while it plays.
const idleAfter = 2500;
// Two taps closer than this are a double tap.
const doubleTap = 300;

function sourcesOf(src: VideoPlayerProps["src"]): MediaSourceItem[] {
  if (typeof src === "string") return [{ src }];
  return Array.isArray(src) ? src : [src];
}

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
  defaultVolume = 1,
  defaultRate = 1,
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
  const storageKey =
    persist === true ? defaultStorageKey : persist || undefined;
  const latest = useLatest({ onError, startTime, storageKey });

  // Until the script runs, the browser's own controls are shown, so the
  // video plays from the server's HTML alone.
  const [hydrated, setHydrated] = useState(false);
  const [activated, setActivated] = useState(!facade);
  const [near, setNear] = useState(!lazy);
  const [attempt, setAttempt] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const sources = useMemo(() => sourcesOf(src), [src]);
  const first = sources[0] ?? { src: "" };
  const streamKind = kindOf(first);
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

  const save = useCallback(
    (change: SavedSettings) => {
      const key = latest.current.storageKey;
      if (key) writeSettings(key, change);
    },
    [latest],
  );

  const context = useMemo<MediaContextValue>(
    () => ({
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

  useImperativeHandle(
    handleRef,
    () => ({
      play: () => {
        setActivated(true);
        store.play();
      },
      pause: () => store.pause(),
      toggle: () => store.toggle(),
      seek: (time: number) => store.seek(time),
      get media() {
        return store.media;
      },
      store,
    }),
    [store],
  );

  useEffect(() => setHydrated(true), []);

  // The media element comes and goes with the facade and with `key`.
  useIsomorphicLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    return store.attach(video);
  }, [store, activated, attempt]);

  // Settings kept from before, then the app's defaults where none were kept.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const saved = storageKey ? readSettings(storageKey) : {};
    video.volume = saved.volume ?? defaultVolume;
    video.muted = autoPlay || (saved.muted ?? defaultMuted);
    video.playbackRate = saved.rate ?? defaultRate;
    if (saved.captionSize) store.set({ captionSize: saved.captionSize });
  }, [store, activated, attempt]);

  useEffect(() => store.setChapterList(chapters), [store, chapters]);

  useEffect(() => {
    if (!exclusive || !activated) return;
    const video = videoRef.current;
    if (!video) return;
    return joinGroup(exclusive === true ? "nuvui-media" : exclusive, video);
  }, [exclusive, activated]);

  // A file's start time, once its length is known.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per element
  useEffect(() => {
    const video = videoRef.current;
    const start = latest.current.startTime;
    if (!video || !start || streamKind !== "file") return;
    const go = () => {
      video.currentTime = start;
    };
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) go();
    else video.addEventListener("loadedmetadata", go, { once: true });
    return () => video.removeEventListener("loadedmetadata", go);
  }, [activated, attempt]);

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

  // Streams, and sources the app plays itself.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the loaders and settings are read once per source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !near || !activated) return;
    if (attachSource) {
      const undo = attachSource(video, first);
      return () => undo?.();
    }
    if (streamKind === "file") return;
    let current = true;
    let stream: Awaited<ReturnType<typeof attachStream>> = null;
    const saved = storageKey ? readSettings(storageKey) : {};
    void attachStream(
      video,
      first,
      streamKind,
      {
        hls,
        dash,
        hlsConfig,
        dashSettings,
        startTime: latest.current.startTime,
        isCurrent: () => current,
      },
      {
        qualities: (qualities) => {
          store.set({ qualities, quality: "auto" });
          const kept = qualities.find(
            (q) =>
              saved.quality &&
              saved.quality !== "auto" &&
              String(q.height) === saved.quality,
          );
          if (kept) store.setQuality(kept.id);
        },
        playing: (id) => store.set({ playingQuality: id }),
        audioTracks: (audioTracks, audioTrack) =>
          store.set({ audioTracks, audioTrack }),
        error: (kind) => {
          store.set({ error: kind });
          latest.current.onError?.(kind);
        },
      },
    ).then((made) => {
      if (!current) {
        made?.destroy();
        return;
      }
      stream = made;
      store.handlers.quality = (id) => stream?.setQuality(id);
      store.handlers.audioTrack = (id) => stream?.setAudioTrack(id);
    });
    return () => {
      current = false;
      stream?.destroy();
      stream = null;
      store.handlers = {};
      store.set({
        qualities: [],
        audioTracks: [],
        audioTrack: null,
        playingQuality: null,
      });
    };
  }, [first.src, streamKind, near, activated, attempt, store]);

  // Captions: the one the viewer chose before, or the default track.
  const captionChoice = useRef(false);
  const textTracks = useMediaState(store, (s) => s.textTracks);
  useEffect(() => {
    if (captionChoice.current || textTracks.length === 0) return;
    captionChoice.current = true;
    const saved = storageKey ? readSettings(storageKey).captions : undefined;
    if (saved === "") return;
    const wanted =
      saved !== undefined
        ? textTracks.find((t) => t.lang === saved || t.label === saved)
        : undefined;
    const preset = tracks?.find(
      (item) =>
        item.default && (item.kind === "captions" || item.kind === "subtitles"),
    );
    const fallback = preset
      ? textTracks.find(
          (t) =>
            t.lang === (preset.srcLang ?? "") &&
            (preset.label === undefined || t.label === preset.label),
        )
      : undefined;
    const chosen = wanted ?? fallback;
    if (chosen) store.setTextTrack(chosen.id);
  }, [textTracks, tracks, storageKey, store]);

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

  // The lock screen and the system's media controls, for the player that
  // played last.
  const paused = useMediaState(store, (s) => s.paused);
  useEffect(() => {
    if (
      paused ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    )
      return;
    const session = navigator.mediaSession;
    try {
      session.metadata = new MediaMetadata({
        title: title ?? ariaLabel ?? "",
        artwork: poster
          ? [{ src: new URL(poster, window.location.href).href }]
          : [],
      });
      const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ["play", () => store.play()],
        ["pause", () => store.pause()],
        ["seekbackward", (d) => store.skip(-(d.seekOffset ?? skip))],
        ["seekforward", (d) => store.skip(d.seekOffset ?? skip)],
        ["seekto", (d) => d.seekTime !== undefined && store.seek(d.seekTime)],
      ];
      for (const [action, handler] of handlers)
        session.setActionHandler(action, handler);
    } catch {
      // An action this browser doesn't have. The rest still work.
    }
  }, [paused, title, ariaLabel, poster, skip, store]);

  // The controls hide while it plays and nothing moves.
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
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'input, textarea, select, [contenteditable="true"], [role="menu"], [role="dialog"]',
      )
    ) {
      return;
    }
    const onButton = target.closest("button") !== null;
    const state = store.getState();
    const rtl = rootRef.current
      ? getComputedStyle(rootRef.current).direction === "rtl"
      : false;
    const step = (by: number) => {
      store.skip(by);
      wake();
    };
    let handled = true;
    switch (event.key) {
      case " ":
      case "Enter":
        if (onButton) return;
        store.toggle();
        break;
      case "k":
        store.toggle();
        break;
      case "j":
        step(-skip);
        break;
      case "l":
        step(skip);
        break;
      case "ArrowLeft":
        step(rtl ? 5 : -5);
        break;
      case "ArrowRight":
        step(rtl ? -5 : 5);
        break;
      // Read from the element, not the state: a held key repeats faster
      // than the element says it changed.
      case "ArrowUp":
      case "ArrowDown": {
        const media = store.media;
        if (!media) break;
        store.setVolume(
          media.volume + (event.key === "ArrowUp" ? 0.05 : -0.05),
        );
        save({ volume: media.volume, muted: media.muted });
        break;
      }
      case "m": {
        const muted = !store.media?.muted;
        store.setMuted(muted);
        save({ muted });
        break;
      }
      case "f":
        toggleFullscreen();
        break;
      case "c": {
        const button = rootRef.current?.querySelector<HTMLButtonElement>(
          ".nuv-video-player__captions-button",
        );
        if (button) button.click();
        else handled = false;
        break;
      }
      case "<":
      case ">": {
        const index = rates.indexOf(store.media?.playbackRate ?? state.rate);
        const next =
          rates[
            Math.min(
              rates.length - 1,
              Math.max(
                0,
                (index === -1 ? rates.indexOf(1) : index) +
                  (event.key === ">" ? 1 : -1),
              ),
            )
          ];
        if (next !== undefined) {
          store.setRate(next);
          store.say(
            labels.speedChanged(next === 1 ? labels.normalSpeed : `${next}×`),
          );
          save({ rate: next });
        }
        break;
      }
      case ",":
      case ".":
        if (!state.paused) return;
        store.skip(event.key === "," ? -1 / 30 : 1 / 30);
        break;
      case "?":
        setShortcutsOpen(true);
        break;
      default:
        if (/^[0-9]$/.test(event.key) && state.duration > 0) {
          store.seek((Number(event.key) / 10) * state.duration);
        } else handled = false;
    }
    if (handled) {
      event.preventDefault();
      // The page's own shortcuts don't also act on a key the player used.
      event.stopPropagation();
      wake();
    }
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

          <Shortcuts
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
            labels={labels}
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

const shortcutKeys = (labels: MediaLabels): [string[], string][] => [
  [["Space", "K"], labels.shortcutPlay],
  [["J"], labels.shortcutBack],
  [["L"], labels.shortcutAhead],
  [["←", "→"], `${labels.skipBack(5)}, ${labels.skipAhead(5)}`],
  [["↑", "↓"], labels.shortcutVolume],
  [["M"], labels.shortcutMute],
  [["F"], labels.shortcutFullscreen],
  [["C"], labels.shortcutCaptions],
  [["0", "9"], labels.shortcutJump],
  [["<", ">"], labels.shortcutSpeed],
  [[",", "."], labels.shortcutFrame],
  [["?"], labels.shortcutShortcuts],
];

function Shortcuts({
  open,
  onOpenChange,
  labels,
  container,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: MediaLabels;
  container: { current: HTMLElement | null };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container.current}
        className="nuv-media-shortcuts"
      >
        <DialogTitle>{labels.shortcuts}</DialogTitle>
        <DialogDescription className="nuv-media-hidden">
          {labels.shortcutShortcuts}
        </DialogDescription>
        <dl className="nuv-media-shortcuts__list">
          {shortcutKeys(labels).map(([keys, what]) => (
            <div key={what} className="nuv-media-shortcuts__row">
              <dt>
                {keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
