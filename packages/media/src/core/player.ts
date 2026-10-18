"use client";

import {
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useIsomorphicLayoutEffect, useLatest, useMediaState } from "./context";
import { joinGroup } from "./exclusive";
import type { MediaLabels } from "./labels";
import {
  defaultStorageKey,
  readSettings,
  type SavedSettings,
  writeSettings,
} from "./persist";
import {
  attachStream,
  type DashLoader,
  type HlsLoader,
  kindOf,
  type MediaSourceItem,
  type StreamError,
} from "./sources";
import type { MediaChapter, MediaStore } from "./store";

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

/** What the video and the audio player both take. */
export interface MediaPlayerCommonProps {
  /** Captions, subtitles and chapters, as WebVTT files. */
  tracks?: MediaTrackItem[];
  /** Chapters, which replace a chapters track if there is one. */
  chapters?: MediaChapter[];
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
   * How much to load before it plays.
   * @default "metadata"
   */
  preload?: "none" | "metadata" | "auto";
  crossOrigin?: "anonymous" | "use-credentials";
  /** The speeds in the menu. @default [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] */
  rates?: number[];
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
}

export const defaultRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function sourcesOf(
  src: string | MediaSourceItem | MediaSourceItem[],
): MediaSourceItem[] {
  if (typeof src === "string") return [{ src }];
  return Array.isArray(src) ? src : [src];
}

export const storageKeyOf = (persist?: boolean | string) =>
  persist === true ? defaultStorageKey : persist || undefined;

export interface PlayerSetup
  extends Pick<
    MediaPlayerCommonProps,
    | "tracks"
    | "chapters"
    | "defaultMuted"
    | "defaultVolume"
    | "defaultRate"
    | "startTime"
    | "exclusive"
    | "hls"
    | "dash"
    | "hlsConfig"
    | "dashSettings"
    | "attachSource"
    | "handleRef"
    | "onError"
  > {
  store: MediaStore;
  media: RefObject<HTMLMediaElement | null>;
  sources: MediaSourceItem[];
  storageKey: string | undefined;
  autoPlay?: boolean;
  /** Changes whenever the media element is a new one. */
  element: number;
  /** The source may load now. */
  load: boolean;
  /** What the lock screen shows, and how far its skip buttons go. */
  session: {
    title?: string;
    artist?: string;
    artwork?: string;
    back: number;
    ahead: number;
  };
  /** Called by the handle's play before it plays, as to put the video on the page. */
  onHandlePlay?: () => void;
}

/**
 * What both players do with their media element: take it over, give it the
 * settings kept from before, play its stream, choose its captions, join its
 * group, and tell the lock screen what's playing. Returns how to keep a
 * setting.
 */
export function usePlayer({
  store,
  media,
  sources,
  storageKey,
  autoPlay = false,
  defaultMuted = false,
  defaultVolume = 1,
  defaultRate = 1,
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
  element,
  load,
  session,
  onHandlePlay,
}: PlayerSetup) {
  const latest = useLatest({ onError, startTime, storageKey, onHandlePlay });
  const first = sources[0] ?? { src: "" };
  const streamKind = kindOf(first);

  const save = useCallback(
    (change: SavedSettings) => {
      const key = latest.current.storageKey;
      if (key) writeSettings(key, change);
    },
    [latest],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      play: () => {
        latest.current.onHandlePlay?.();
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
    [store, latest],
  );

  // The media element comes and goes, with a video's facade and with `key`.
  useIsomorphicLayoutEffect(() => {
    const target = media.current;
    if (!target) return;
    return store.attach(target);
  }, [store, element]);

  // Settings kept from before, then the app's defaults where none were kept.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per element
  useEffect(() => {
    const target = media.current;
    if (!target) return;
    const saved = storageKey ? readSettings(storageKey) : {};
    target.volume = saved.volume ?? defaultVolume;
    target.muted = autoPlay || (saved.muted ?? defaultMuted);
    target.playbackRate = saved.rate ?? defaultRate;
    if (saved.captionSize) store.set({ captionSize: saved.captionSize });
  }, [store, element]);

  useEffect(() => store.setChapterList(chapters), [store, chapters]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: once per element
  useEffect(() => {
    const target = media.current;
    if (!exclusive || !target) return;
    return joinGroup(exclusive === true ? "nuvui-media" : exclusive, target);
  }, [exclusive, element]);

  // A file's start time, once its length is known.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per element
  useEffect(() => {
    const target = media.current;
    const start = latest.current.startTime;
    if (!target || !start || streamKind !== "file") return;
    const go = () => {
      target.currentTime = start;
    };
    if (target.readyState >= HTMLMediaElement.HAVE_METADATA) go();
    else target.addEventListener("loadedmetadata", go, { once: true });
    return () => target.removeEventListener("loadedmetadata", go);
  }, [element]);

  // Streams, and sources the app plays itself.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the loaders and settings are read once per source
  useEffect(() => {
    const target = media.current;
    if (!target || !load) return;
    if (attachSource) {
      const undo = attachSource(target, first);
      return () => undo?.();
    }
    if (streamKind === "file") return;
    let current = true;
    let stream: Awaited<ReturnType<typeof attachStream>> = null;
    const saved = storageKey ? readSettings(storageKey) : {};
    void attachStream(
      target,
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
  }, [first.src, streamKind, load, element, store]);

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

  // The lock screen and the system's media controls, for the player that
  // played last.
  const paused = useMediaState(store, (s) => s.paused);
  const { title, artist, artwork, back, ahead } = session;
  useEffect(() => {
    if (
      paused ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    )
      return;
    const mediaSession = navigator.mediaSession;
    try {
      mediaSession.metadata = new MediaMetadata({
        title: title ?? "",
        artist: artist ?? "",
        artwork: artwork
          ? [{ src: new URL(artwork, window.location.href).href }]
          : [],
      });
      const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ["play", () => store.play()],
        ["pause", () => store.pause()],
        ["seekbackward", (d) => store.skip(-(d.seekOffset ?? back))],
        ["seekforward", (d) => store.skip(d.seekOffset ?? ahead)],
        ["seekto", (d) => d.seekTime !== undefined && store.seek(d.seekTime)],
      ];
      for (const [action, handler] of handlers)
        mediaSession.setActionHandler(action, handler);
    } catch {
      // An action this browser doesn't have. The rest still work.
    }
  }, [paused, title, artist, artwork, back, ahead, store]);

  return { save, streamKind, first };
}
