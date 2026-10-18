"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@nuvui/react/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@nuvui/react/tooltip";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMediaContext, useMediaState } from "../core/context";
import {
  canFullscreen,
  enterFullscreen,
  exitFullscreen,
} from "../core/fullscreen";
import { formatRate, formatTime, spokenTime } from "../core/time";
import { cueAt } from "../core/vtt";
import { cx } from "../utils/cx";
import {
  CaptionsIcon,
  FullscreenIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  ReplayIcon,
  SettingsIcon,
  SkipIcon,
  VolumeIcon,
} from "./icons";
import { MediaSlider } from "./slider";

// A button with an icon, named for what it does, with the name in a
// tooltip for a mouse. The tooltip opens inside the player, so it's seen in
// fullscreen too.
interface ControlProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
}

const Control = forwardRef<HTMLButtonElement, ControlProps>(function Control(
  { label, icon, className, ...props },
  ref,
) {
  const { root } = useMediaContext("A player control");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          className={cx("nuv-media-button", className)}
          {...props}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent container={root.current} side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
});

export type MediaButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

/** Plays and pauses, and plays again from the start at the end. */
export function MediaPlayButton(props: MediaButtonProps) {
  const { store, labels } = useMediaContext("MediaPlayButton");
  const paused = useMediaState(store, (s) => s.paused);
  const ended = useMediaState(store, (s) => s.ended);
  return (
    <Control
      {...props}
      label={ended ? labels.replay : paused ? labels.play : labels.pause}
      icon={ended ? <ReplayIcon /> : paused ? <PlayIcon /> : <PauseIcon />}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) store.toggle();
      }}
    />
  );
}

export interface MediaSkipButtonProps extends MediaButtonProps {
  /** Seconds to skip, back when below zero. Defaults to the player's `skip`, ahead. */
  seconds?: number;
}

/** Goes back or ahead a few seconds. */
export function MediaSkipButton({ seconds, ...props }: MediaSkipButtonProps) {
  const { store, labels, skip } = useMediaContext("MediaSkipButton");
  const by = seconds ?? skip;
  return (
    <Control
      {...props}
      label={by < 0 ? labels.skipBack(-by) : labels.skipAhead(by)}
      icon={<SkipIcon ahead={by >= 0} />}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) store.skip(by);
      }}
    />
  );
}

export type MediaVolumeProps = HTMLAttributes<HTMLDivElement>;

/** Mutes and unmutes, with a slider for the volume beside it with a mouse. */
export function MediaVolume({ className, ...props }: MediaVolumeProps) {
  const { store, labels, save } = useMediaContext("MediaVolume");
  const muted = useMediaState(store, (s) => s.muted);
  const volume = useMediaState(store, (s) => s.volume);
  const level = muted || volume === 0 ? "off" : volume < 0.5 ? "low" : "high";
  return (
    <div {...props} className={cx("nuv-media-volume", className)}>
      <Control
        label={muted ? labels.unmute : labels.mute}
        icon={<VolumeIcon level={level} />}
        onClick={() => {
          const next = !muted;
          store.setMuted(next);
          // Unmuted at no volume would still be silent.
          if (!next && store.getState().volume === 0) store.setVolume(0.5);
          save({ muted: next });
        }}
      />
      <MediaSlider
        className="nuv-media-volume__slider"
        label={labels.volume}
        value={() => {
          const s = store.getState();
          return s.muted ? 0 : s.volume * 100;
        }}
        max={() => 100}
        valueText={(value) => `${Math.round(value)}%`}
        subscribe={store.subscribe}
        step={5}
        bigStep={20}
        onValueChange={(value, done) => {
          store.setVolume(value / 100);
          if (value === 0) store.setMuted(true);
          if (done) save({ volume: value / 100, muted: value === 0 });
        }}
      >
        <span className="nuv-media-slider__track">
          <span className="nuv-media-slider__fill" />
        </span>
        <span className="nuv-media-slider__thumb" />
      </MediaSlider>
    </div>
  );
}

export type MediaTimeProps = Omit<MediaButtonProps, "onClick">;

/**
 * The time played and the length, or the time left: a press swaps them. A
 * live stream says Live.
 */
export function MediaTime({ className, ...props }: MediaTimeProps) {
  const { store, labels } = useMediaContext("MediaTime");
  const remaining = useMediaState(store, (s) => s.showRemaining);
  const live = useMediaState(store, (s) => s.live);
  const current = useRef<HTMLSpanElement>(null);
  const total = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const write = () => {
      const { duration, showRemaining } = store.getState();
      const time = store.currentTime;
      const now = showRemaining
        ? `-${formatTime(duration - time, duration)}`
        : formatTime(time, duration);
      const length = showRemaining ? "" : ` / ${formatTime(duration)}`;
      if (current.current && current.current.textContent !== now) {
        current.current.textContent = now;
      }
      if (total.current && total.current.textContent !== length) {
        total.current.textContent = length;
      }
    };
    write();
    const offTick = store.onTick(write);
    const offState = store.subscribe(write);
    return () => {
      offTick();
      offState();
    };
  }, [store]);

  if (live) {
    return (
      <span className={cx("nuv-media-time", "nuv-media-time--live", className)}>
        {labels.live}
      </span>
    );
  }
  return (
    <button
      {...props}
      type="button"
      aria-label={remaining ? labels.showElapsed : labels.showRemaining}
      className={cx("nuv-media-time", className)}
      onClick={() => store.set({ showRemaining: !remaining })}
    >
      <span aria-hidden="true">
        <span ref={current}>0:00</span>
        <span ref={total} className="nuv-media-time__total">
          {" / 0:00"}
        </span>
      </span>
    </button>
  );
}

export type MediaSeekProps = Omit<HTMLAttributes<HTMLDivElement>, "children">;

/**
 * The seek bar: what's played, what's loaded, the chapters as gaps along
 * it, and over it, where a pointer hovers, the time, the chapter and a
 * frame from the thumbnails track.
 */
export function MediaSeek({ className, ...props }: MediaSeekProps) {
  const { store, labels, skip } = useMediaContext("MediaSeek");
  const chapters = useMediaState(store, (s) => s.chapters);
  const duration = useMediaState(store, (s) => s.duration);
  const live = useMediaState(store, (s) => s.live);
  const segments = useRef<(HTMLSpanElement | null)[]>([]);
  const preview = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  // The chapters, with a part of no name for any time they leave out, so
  // the parts cover the whole length, as a press on the bar does.
  const parts = useMemo(() => {
    const found: { start: number; end: number; title: string }[] = [];
    let reached = 0;
    for (const chapter of chapters) {
      if (chapter.start > reached) {
        found.push({ start: reached, end: chapter.start, title: "" });
      }
      found.push(chapter);
      reached = Math.max(reached, chapter.end);
    }
    if (reached < duration || found.length === 0) {
      found.push({
        start: reached,
        end: Math.max(reached, duration),
        title: "",
      });
    }
    return found;
  }, [chapters, duration]);

  // Each part's share of the bar, set through the CSSOM so a strict
  // Content Security Policy has nothing to refuse.
  useEffect(() => {
    parts.forEach((part, index) => {
      const element = segments.current[index];
      if (element)
        element.style.flexGrow = String(
          Math.max(0.0001, part.end - part.start),
        );
    });
  });

  // What's played and what's loaded, as a share of each part.
  const paint = useCallback(
    (value: number) => {
      const loaded = store.bufferedEnd;
      const share = (at: number, start: number, end: number) => {
        const length = end - start;
        const part = length > 0 ? (at - start) / length : at > start ? 1 : 0;
        return String(Math.min(1, Math.max(0, part)));
      };
      parts.forEach((part, index) => {
        const element = segments.current[index];
        if (!element) return;
        element.style.setProperty(
          "--nuv-media-part-fill",
          share(value, part.start, part.end),
        );
        element.style.setProperty(
          "--nuv-media-part-buffered",
          share(loaded, part.start, part.end),
        );
      });
    },
    [parts, store],
  );

  const subscribe = useCallback(
    (update: () => void) => {
      const offTick = store.onTick(update);
      const offState = store.subscribe(update);
      return () => {
        offTick();
        offState();
      };
    },
    [store],
  );

  const thumbnails = useMediaState(store, (s) => s.thumbnails);
  const thumb = hover === null ? undefined : cueAt(thumbnails, hover);
  const chapter = hover === null ? undefined : cueAt(chapters, hover);

  useEffect(() => {
    const element = frame.current;
    if (!element || !thumb) return;
    element.style.backgroundImage = `url("${thumb.url.replace(/"/g, "%22")}")`;
    if (thumb.width && thumb.height) {
      element.style.backgroundPosition = `-${thumb.x ?? 0}px -${thumb.y ?? 0}px`;
      element.style.backgroundSize = "auto";
      element.style.width = `${thumb.width}px`;
      element.style.height = `${thumb.height}px`;
    } else {
      element.style.backgroundPosition = "center";
      element.style.backgroundSize = "cover";
      element.style.removeProperty("width");
      element.style.removeProperty("height");
    }
  }, [thumb]);

  if (live) return null;

  return (
    <MediaSlider
      {...props}
      className={cx("nuv-media-seek", className)}
      label={labels.seek}
      value={() => store.currentTime}
      max={() => store.getState().duration}
      valueText={(value, max) =>
        labels.timeOf(spokenTime(value, labels), spokenTime(max, labels))
      }
      subscribe={subscribe}
      paint={paint}
      step={5}
      bigStep={Math.max(skip, duration / 10)}
      disabled={duration <= 0}
      onValueChange={(value) => store.seek(value)}
      onHover={(value, fraction) => {
        setHover(value);
        preview.current?.style.setProperty(
          "--nuv-media-hover",
          String(fraction),
        );
      }}
    >
      <span className="nuv-media-seek__parts">
        {parts.map((part, index) => (
          <span
            key={`${part.start}-${part.title}`}
            ref={(element) => {
              segments.current[index] = element;
            }}
            className="nuv-media-seek__part"
          >
            <span className="nuv-media-seek__buffered" />
            <span className="nuv-media-seek__fill" />
          </span>
        ))}
      </span>
      <span className="nuv-media-slider__thumb" />
      <div
        ref={preview}
        className="nuv-media-seek__preview"
        aria-hidden="true"
        hidden={hover === null}
      >
        {thumb && <span ref={frame} className="nuv-media-seek__frame" />}
        {chapter?.title && (
          <span className="nuv-media-seek__chapter">{chapter.title}</span>
        )}
        <span className="nuv-media-seek__time">
          {hover === null ? "" : formatTime(hover, duration)}
        </span>
      </div>
    </MediaSlider>
  );
}

/** Turns captions on and off. Shown only when there are captions to show. */
export function MediaCaptionsButton(props: MediaButtonProps) {
  const { store, labels, save } = useMediaContext("MediaCaptionsButton");
  const tracks = useMediaState(store, (s) => s.textTracks);
  const shown = useMediaState(store, (s) => s.textTrack);
  const last = useRef<string | null>(null);
  if (shown) last.current = shown;
  if (tracks.length === 0) return null;
  return (
    <Control
      {...props}
      label={labels.captions}
      aria-pressed={shown !== null}
      icon={<CaptionsIcon />}
      onClick={() => {
        if (shown) {
          store.setTextTrack(null);
          store.say(labels.captionsOff);
          save({ captions: "" });
          return;
        }
        const track = tracks.find((t) => t.id === last.current) ?? tracks[0];
        if (!track) return;
        store.setTextTrack(track.id);
        store.say(labels.captionsOn(track.label));
        save({ captions: track.lang || track.label });
      }}
    />
  );
}

/**
 * The settings menu: speed, quality, captions and their size, the audio
 * track, and the keyboard shortcuts. Each part shows only when there's a
 * choice to make.
 */
export function MediaSettings(props: MediaButtonProps) {
  const { store, labels, rates, root, save, showShortcuts } =
    useMediaContext("MediaSettings");
  const rate = useMediaState(store, (s) => s.rate);
  const qualities = useMediaState(store, (s) => s.qualities);
  const quality = useMediaState(store, (s) => s.quality);
  const playing = useMediaState(store, (s) => s.playingQuality);
  const tracks = useMediaState(store, (s) => s.textTracks);
  const track = useMediaState(store, (s) => s.textTrack);
  const size = useMediaState(store, (s) => s.captionSize);
  const audioTracks = useMediaState(store, (s) => s.audioTracks);
  const audioTrack = useMediaState(store, (s) => s.audioTrack);

  const rateName = (r: number) =>
    r === 1 ? labels.normalSpeed : formatRate(r);
  const playingLabel = qualities.find((q) => q.id === playing)?.label;
  const qualityName =
    quality === "auto"
      ? labels.auto(playingLabel)
      : (qualities.find((q) => q.id === quality)?.label ?? quality);
  const trackName =
    track === null
      ? labels.off
      : (tracks.find((t) => t.id === track)?.label ?? labels.off);
  const sizes = [
    ["small", labels.small],
    ["medium", labels.medium],
    ["large", labels.large],
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Control {...props} label={labels.settings} icon={<SettingsIcon />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        container={root.current}
        side="top"
        align="end"
        className="nuv-media-menu"
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="nuv-media-menu__name">{labels.speed}</span>
            <span className="nuv-media-menu__value">{rateName(rate)}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="nuv-media-menu">
            <DropdownMenuRadioGroup
              value={String(rate)}
              onValueChange={(value) => {
                const next = Number(value);
                store.setRate(next);
                store.say(labels.speedChanged(rateName(next)));
                save({ rate: next });
              }}
            >
              {rates.map((r) => (
                <DropdownMenuRadioItem key={r} value={String(r)}>
                  {rateName(r)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {qualities.length > 1 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="nuv-media-menu__name">{labels.quality}</span>
              <span className="nuv-media-menu__value">{qualityName}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="nuv-media-menu">
              <DropdownMenuRadioGroup
                value={quality}
                onValueChange={(value) => {
                  store.setQuality(value);
                  const chosen = qualities.find((q) => q.id === value);
                  store.say(
                    labels.qualityChanged(chosen?.label ?? labels.auto()),
                  );
                  save({
                    quality:
                      value === "auto"
                        ? "auto"
                        : String(chosen?.height ?? value),
                  });
                }}
              >
                <DropdownMenuRadioItem value="auto">
                  {labels.auto(quality === "auto" ? playingLabel : undefined)}
                </DropdownMenuRadioItem>
                {[...qualities]
                  .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
                  .map((q) => (
                    <DropdownMenuRadioItem key={q.id} value={q.id}>
                      {q.label}
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {tracks.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="nuv-media-menu__name">{labels.captions}</span>
              <span className="nuv-media-menu__value">{trackName}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="nuv-media-menu">
              <DropdownMenuRadioGroup
                value={track ?? ""}
                onValueChange={(value) => {
                  const chosen = tracks.find((t) => t.id === value);
                  store.setTextTrack(chosen ? chosen.id : null);
                  store.say(
                    chosen
                      ? labels.captionsOn(chosen.label)
                      : labels.captionsOff,
                  );
                  save({ captions: chosen ? chosen.lang || chosen.label : "" });
                }}
              >
                <DropdownMenuRadioItem value="">
                  {labels.off}
                </DropdownMenuRadioItem>
                {tracks.map((t) => (
                  <DropdownMenuRadioItem key={t.id} value={t.id}>
                    {t.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{labels.captionSize}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={size}
                onValueChange={(value) => {
                  const next = value as (typeof sizes)[number][0];
                  store.set({ captionSize: next });
                  save({ captionSize: next });
                }}
              >
                {sizes.map(([value, name]) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {audioTracks.length > 1 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="nuv-media-menu__name">{labels.audioTrack}</span>
              <span className="nuv-media-menu__value">
                {audioTracks.find((t) => t.id === audioTrack)?.label ?? ""}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="nuv-media-menu">
              <DropdownMenuRadioGroup
                value={audioTrack ?? ""}
                onValueChange={(value) => store.setAudioTrack(value)}
              >
                {audioTracks.map((t) => (
                  <DropdownMenuRadioItem key={t.id} value={t.id}>
                    {t.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => showShortcuts()}>
          {labels.shortcuts}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Picture in picture, where the browser has it. */
export function MediaPictureInPictureButton(props: MediaButtonProps) {
  const { store, labels } = useMediaContext("MediaPictureInPictureButton");
  const active = useMediaState(store, (s) => s.pictureInPicture);
  const attached = useMediaState(store, (s) => s.attached);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const media = store.media;
    setSupported(
      Boolean(
        attached &&
          media instanceof HTMLVideoElement &&
          document.pictureInPictureEnabled &&
          !media.disablePictureInPicture,
      ),
    );
  }, [attached, store]);
  if (!supported) return null;
  return (
    <Control
      {...props}
      label={
        active ? labels.exitPictureInPicture : labels.enterPictureInPicture
      }
      icon={<PictureInPictureIcon />}
      onClick={() => {
        const media = store.media as HTMLVideoElement | null;
        if (!media) return;
        if (document.pictureInPictureElement === media) {
          document.exitPictureInPicture().catch(() => {});
        } else {
          media.requestPictureInPicture().catch(() => {});
        }
      }}
    />
  );
}

/** Fullscreen for the whole player, or the video alone where that's the only kind. */
export function MediaFullscreenButton(props: MediaButtonProps) {
  const { store, labels, root } = useMediaContext("MediaFullscreenButton");
  const active = useMediaState(store, (s) => s.fullscreen);
  const attached = useMediaState(store, (s) => s.attached);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(
      attached && canFullscreen(store.media as HTMLVideoElement | null),
    );
  }, [attached, store]);
  if (!supported) return null;
  return (
    <Control
      {...props}
      label={active ? labels.exitFullscreen : labels.enterFullscreen}
      icon={<FullscreenIcon exit={active} />}
      onClick={() => {
        if (active) void exitFullscreen();
        else if (root.current) {
          void enterFullscreen(
            root.current,
            store.media as HTMLVideoElement | null,
          );
        }
      }}
    />
  );
}
