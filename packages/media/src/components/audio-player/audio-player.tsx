"use client";

import { Button } from "@nuvui/react/button";
import { TooltipProvider } from "@nuvui/react/tooltip";
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaContext,
  type MediaContextValue,
  useIsomorphicLayoutEffect,
  useMediaContext,
  useMediaState,
} from "../../core/context";
import { handlePlayerKey } from "../../core/keys";
import { englishLabels } from "../../core/labels";
import {
  defaultRates,
  type MediaPlayerCommonProps,
  sourcesOf,
  storageKeyOf,
  usePlayer,
} from "../../core/player";
import type { MediaSourceItem } from "../../core/sources";
import { MediaStore } from "../../core/store";
import { formatRate, formatTime } from "../../core/time";
import {
  MediaPlayButton,
  MediaSeek,
  MediaSettings,
  MediaSkipButton,
  MediaTime,
  MediaVolume,
} from "../../parts/parts";
import { audioShortcuts, MediaShortcuts } from "../../parts/shortcuts";
import { MediaWaveform } from "../../parts/waveform";
import { cx } from "../../utils/cx";

// The audio player's own, listed before what both players take.
interface AudioProps {
  /**
   * What to play: an address, a source, or several formats of the same
   * sound, such as Ogg and MP3, of which the browser plays the first it
   * can. An `.m3u8` or `.mpd` address is a stream.
   */
  src: string | MediaSourceItem | MediaSourceItem[];
  /** The title: the player's name, and what the lock screen shows. */
  title?: string;
  /** Who it's by: the show, the speaker or the artist. Under the title in the podcast layout, and on the lock screen. */
  artist?: string;
  /** A square picture, shown in the podcast layout and on the lock screen. */
  artwork?: string;
  /** The player's name for a screen reader. Defaults to `title`. */
  "aria-label"?: string;
  /**
   * - `bar`: one row of controls, for anywhere.
   * - `podcast`: the artwork, the title, skip buttons and a larger play button.
   * - `voice`: a play button, the waveform, the time and the speed, small
   *   enough for a message in a chat.
   * @default "bar"
   */
  layout?: "bar" | "podcast" | "voice";
  /**
   * The waveform to seek on, in place of the seek bar: how loud it is along
   * its length, in any scale. `computePeaks` works them out from a file.
   */
  peaks?: readonly number[];
  /**
   * The length in seconds, shown until the file has said its own. For a
   * list of messages with `preload="none"`, which load nothing until played.
   */
  duration?: number;
  /** Seconds J and the back button go. @default 15 */
  skipBack?: number;
  /** Seconds L and the ahead button go. @default 30 */
  skipAhead?: number;
  /**
   * The player's own controls. Set to false to lay out your own from the
   * parts, as children.
   * @default true
   */
  controls?: boolean;
  /** Your own controls from the parts, with `controls={false}`. */
  children?: ReactNode;
}

export interface AudioPlayerOwnProps
  extends AudioProps,
    MediaPlayerCommonProps {}

export interface AudioPlayerProps
  extends AudioPlayerOwnProps,
    Omit<HTMLAttributes<HTMLElement>, keyof AudioPlayerOwnProps> {}

// The speeds a press on the voice layout's speed steps through.
const voiceRates = [1, 1.5, 2];

/**
 * A sound with its own controls: play, seek on a bar or a waveform, the
 * time, volume and speed, from a pointer, a finger or the keyboard. One row
 * by default, a larger layout for a podcast, and a small one for a voice
 * message. Plays files itself, and HLS and DASH streams through hls.js and
 * dashjs when given them.
 */
export function AudioPlayer({
  src,
  title,
  artist,
  artwork,
  "aria-label": ariaLabel,
  layout = "bar",
  peaks,
  duration,
  tracks,
  chapters,
  defaultMuted = false,
  defaultVolume,
  defaultRate,
  loop,
  startTime,
  preload = "metadata",
  crossOrigin,
  rates = defaultRates,
  skipBack = 15,
  skipAhead = 30,
  persist,
  exclusive,
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
}: AudioPlayerProps) {
  const [store] = useState(() => new MediaStore());
  const rootRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const labels = useMemo(
    () => ({ ...englishLabels, ...labelsProp }),
    [labelsProp],
  );
  const storageKey = storageKeyOf(persist);

  // Until the script runs, the browser's own controls are shown, so it
  // plays from the server's HTML alone.
  const [hydrated, setHydrated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Before the store takes the element over, which reads it.
  useIsomorphicLayoutEffect(() => {
    store.durationHint = duration ?? 0;
    const media = store.media;
    if (!media || !(media.duration > 0)) store.set({ duration: duration ?? 0 });
  }, [store, duration]);

  const sources = useMemo(() => sourcesOf(src), [src]);
  const { save, streamKind, first } = usePlayer({
    store,
    media: audioRef,
    sources,
    storageKey,
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
    element: attempt,
    load: true,
    session: {
      title: title ?? ariaLabel,
      artist,
      artwork,
      back: skipBack,
      ahead: skipAhead,
    },
  });

  const context = useMemo<MediaContextValue>(
    () => ({
      kind: "audio",
      store,
      labels,
      root: rootRef,
      rates,
      skip: skipAhead,
      save,
      showShortcuts: () => setShortcutsOpen(true),
    }),
    [store, labels, rates, skipAhead, save],
  );

  useEffect(() => setHydrated(true), []);

  // The keys work while focus is anywhere in the player.
  const onPlayerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    handlePlayerKey(event, {
      store,
      root: rootRef.current,
      labels,
      rates,
      back: skipBack,
      ahead: skipAhead,
      save,
      extra: {
        "?": () => {
          setShortcutsOpen(true);
          return true;
        },
      },
    });
  };

  const paused = useMediaState(store, (s) => s.paused);
  const started = useMediaState(store, (s) => s.started);
  const waiting = useMediaState(store, (s) => s.waiting);
  const error = useMediaState(store, (s) => s.error);
  const message = useMediaState(store, (s) => s.message);
  const name = ariaLabel ?? title ?? labels.audio;

  const errorText =
    error === "network"
      ? labels.audioErrorNetwork
      : error === "unsupported"
        ? labels.audioErrorUnsupported
        : labels.audioErrorDecode;

  const retry = () => {
    const audio = audioRef.current;
    const time = audio?.currentTime ?? 0;
    store.set({ error: null });
    if (streamKind === "file" && audio) {
      audio.load();
      audio.addEventListener(
        "loadedmetadata",
        () => {
          audio.currentTime = time;
          store.play();
        },
        { once: true },
      );
    } else setAttempt((n) => n + 1);
  };

  const showControls = controls && hydrated;
  const seek = peaks ? (
    <MediaWaveform peaks={peaks} className="nuv-audio-player__seek" />
  ) : (
    <MediaSeek className="nuv-audio-player__seek" />
  );
  const play = (
    <span className="nuv-audio-player__play">
      <MediaPlayButton className="nuv-audio-player__play-button" />
      {waiting && !error && (
        <span
          className="nuv-audio-player__spinner"
          role="status"
          aria-label={labels.loading}
        />
      )}
    </span>
  );

  return (
    <MediaContext.Provider value={context}>
      <TooltipProvider delayDuration={400}>
        <section
          {...props}
          ref={rootRef}
          aria-label={name}
          tabIndex={-1}
          className={cx("nuv-audio-player", className)}
          data-layout={layout}
          data-artwork={layout === "podcast" && artwork ? "" : undefined}
          data-ready={hydrated ? "" : undefined}
          data-paused={paused ? "" : undefined}
          data-started={started ? "" : undefined}
          onKeyDown={onPlayerKeyDown}
        >
          {layout === "podcast" && artwork && (
            <img className="nuv-audio-player__artwork" src={artwork} alt="" />
          )}
          {layout === "podcast" && (title || artist) && (
            <div className="nuv-audio-player__meta">
              {title && <p className="nuv-audio-player__title">{title}</p>}
              {artist && <p className="nuv-audio-player__artist">{artist}</p>}
            </div>
          )}

          <audio
            key={attempt}
            ref={audioRef}
            className="nuv-audio-player__media"
            preload={preload}
            loop={loop}
            muted={defaultMuted}
            crossOrigin={crossOrigin}
            controls={!showControls && controls}
            src={
              streamKind === "file" && sources.length === 1
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
              sources.length > 1 &&
              sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
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
          </audio>

          {showControls && layout === "bar" && (
            <div className="nuv-audio-player__bar">
              {play}
              {seek}
              <MediaTime />
              <MediaVolume />
              <MediaSettings />
            </div>
          )}

          {showControls && layout === "podcast" && (
            <>
              <div className="nuv-audio-player__track">{seek}</div>
              <div className="nuv-audio-player__bar">
                <div className="nuv-audio-player__group">
                  <MediaTime />
                </div>
                <div className="nuv-audio-player__group">
                  <MediaSkipButton seconds={-skipBack} />
                  {play}
                  <MediaSkipButton seconds={skipAhead} />
                </div>
                <div className="nuv-audio-player__group nuv-audio-player__group--end">
                  <MediaVolume />
                  <MediaSettings />
                </div>
              </div>
            </>
          )}

          {showControls && layout === "voice" && (
            <div className="nuv-audio-player__bar">
              {play}
              {seek}
              <VoiceTime />
              <VoiceSpeed />
            </div>
          )}

          {children}

          {error && (
            <div className="nuv-audio-player__error" role="alert">
              <p>{errorText}</p>
              {error !== "unsupported" && (
                <Button intent="secondary" size="sm" onClick={retry}>
                  {labels.retry}
                </Button>
              )}
            </div>
          )}

          <div className="nuv-media-hidden" role="status">
            {message}
          </div>

          <MediaShortcuts
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
            labels={labels}
            list={audioShortcuts(labels, skipBack, skipAhead)}
            container={rootRef}
          />
        </section>
      </TooltipProvider>
    </MediaContext.Provider>
  );
}

// The length until it plays, and the time played while it does, as a
// voice message shows it. The waveform says both to a screen reader.
function VoiceTime() {
  const { store } = useMediaContext("VoiceTime");
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const write = () => {
      const element = ref.current;
      if (!element) return;
      const { duration, started, ended } = store.getState();
      const text =
        started && !ended
          ? formatTime(store.currentTime, duration)
          : formatTime(duration);
      if (element.textContent !== text) element.textContent = text;
    };
    write();
    const offTick = store.onTick(write);
    const offState = store.subscribe(write);
    return () => {
      offTick();
      offState();
    };
  }, [store]);
  return (
    <span ref={ref} className="nuv-audio-player__time" aria-hidden="true">
      0:00
    </span>
  );
}

// A press steps through the speeds a voice message is played at.
function VoiceSpeed() {
  const { store, labels, save } = useMediaContext("VoiceSpeed");
  const rate = useMediaState(store, (s) => s.rate);
  return (
    <button
      type="button"
      className="nuv-audio-player__speed"
      onClick={() => {
        const index = voiceRates.indexOf(rate);
        const next = voiceRates[(index + 1) % voiceRates.length] ?? 1;
        store.setRate(next);
        store.say(
          labels.speedChanged(
            next === 1 ? labels.normalSpeed : formatRate(next),
          ),
        );
        save({ rate: next });
      }}
    >
      <span className="nuv-media-hidden">{labels.speed} </span>
      {formatRate(rate)}
    </button>
  );
}
