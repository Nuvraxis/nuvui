"use client";

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLatest } from "../../core/context";
import { englishLabels, type MediaLabels } from "../../core/labels";
import type { MediaPlayerHandle } from "../../core/player";
import type { MediaStore } from "../../core/store";
import { formatTime } from "../../core/time";
import { cueAt } from "../../core/vtt";
import { cx } from "../../utils/cx";

export interface MediaTranscriptProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The player whose words it shows: the ref given to its `handleRef`. */
  player: RefObject<MediaPlayerHandle | null>;
  /**
   * Keeps the line being said in view as it plays, except while the
   * pointer is over the transcript or the keyboard is in it.
   * @default true
   */
  follow?: boolean;
  /** The transcript's name for a screen reader. @default "Transcript" */
  "aria-label"?: string;
  /** The words, to translate it. */
  labels?: Partial<MediaLabels>;
}

/** A line of the transcript: a cue's words, its time, and who says them. */
interface TranscriptLine {
  start: number;
  end: number;
  text: string;
  /** The speaker, from a `<v>` tag in the cue. */
  voice?: string;
}

const voiceTag = /<v(?:\.[^\s>]+)?\s+([^>]+)>/;

/** The cues of a track as lines of text, without their tags. */
export function linesOf(cues: readonly TextTrackCue[]): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const cue of cues) {
    const vtt = cue as VTTCue;
    const raw = vtt.text ?? "";
    const voice = voiceTag.exec(raw)?.[1]?.trim();
    // getCueAsHTML reads the tags and the entities as a browser does.
    const text = (
      typeof vtt.getCueAsHTML === "function"
        ? (vtt.getCueAsHTML().textContent ?? "")
        : raw.replace(/<[^>]*>/g, "")
    )
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    lines.push({
      start: cue.startTime,
      end: cue.endTime,
      text,
      ...(voice ? { voice } : {}),
    });
  }
  return lines;
}

/**
 * The words of a player's captions as text beside it or under it. The line
 * being said is marked and kept in view, and a press on a line plays from
 * there. Reads the captions shown, or the first captions track when none
 * is.
 */
export function MediaTranscript({
  player,
  follow = true,
  "aria-label": ariaLabel,
  labels: labelsProp,
  className,
  ...props
}: MediaTranscriptProps) {
  const labels = useMemo(
    () => ({ ...englishLabels, ...labelsProp }),
    [labelsProp],
  );
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [store, setStore] = useState<MediaStore | null>(null);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [duration, setDuration] = useState(0);
  // Only one line is in the Tab order. The arrow keys move between them.
  const [focusIndex, setFocusIndex] = useState(0);
  const latest = useLatest({ lines, follow });

  // The player's handle is set before effects run, so it's there by now.
  useEffect(() => {
    const found = player.current?.store ?? null;
    if (found !== store) setStore(found);
  });

  // The lines, again whenever the track shown changes or a file loads.
  useEffect(() => {
    if (!store) return;
    let key = "";
    const read = () => {
      const state = store.getState();
      const next = [
        state.textTrack,
        state.trackLoads,
        state.textTracks.length,
        state.attached,
      ].join("|");
      setDuration(state.duration);
      if (next === key) return;
      key = next;
      setLines(linesOf(store.transcriptCues()));
    };
    read();
    return store.subscribe(read);
  }, [store]);

  useEffect(() => {
    setFocusIndex((index) => Math.min(index, Math.max(0, lines.length - 1)));
  }, [lines]);

  // The line being said, marked on the page as it plays, with no render.
  // biome-ignore lint/correctness/useExhaustiveDependencies: new lines are new buttons, marked afresh
  useEffect(() => {
    if (!store) return;
    const buttons = () =>
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        ".nuv-media-transcript__line",
      ) ?? [];
    for (const button of buttons()) button.removeAttribute("aria-current");
    let active = -1;
    const update = () => {
      const { lines, follow } = latest.current;
      const line = cueAt(lines, store.currentTime);
      const index = line ? lines.indexOf(line) : -1;
      if (index === active) return;
      const all = buttons();
      all[active]?.removeAttribute("aria-current");
      active = index;
      const button = all[index];
      if (!button) return;
      button.setAttribute("aria-current", "time");
      const root = rootRef.current;
      // Left alone while someone reads with the pointer or moves with the
      // keyboard.
      if (
        !follow ||
        !root ||
        root.matches(":hover") ||
        root.querySelector(":focus-visible")
      )
        return;
      const top = button.offsetTop;
      const inView =
        top >= root.scrollTop &&
        top + button.offsetHeight <= root.scrollTop + root.clientHeight * 0.7;
      if (inView) return;
      root.scrollTo({
        top: Math.max(0, top - root.clientHeight / 3),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };
    update();
    const offTick = store.onTick(update);
    const offState = store.subscribe(update);
    return () => {
      offTick();
      offState();
    };
  }, [store, lines, latest]);

  const onListKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    const last = lines.length - 1;
    const next =
      event.key === "ArrowDown"
        ? Math.min(last, focusIndex + 1)
        : event.key === "ArrowUp"
          ? Math.max(0, focusIndex - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null || last < 0) return;
    event.preventDefault();
    setFocusIndex(next);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>(".nuv-media-transcript__line")
      [next]?.focus();
  };

  return (
    <section
      {...props}
      ref={rootRef}
      aria-label={ariaLabel ?? labels.transcript}
      className={cx("nuv-media-transcript", className)}
    >
      <ol
        ref={listRef}
        className="nuv-media-transcript__list"
        onKeyDown={onListKeyDown}
      >
        {lines.map((line, index) => {
          const speaker =
            line.voice && line.voice !== lines[index - 1]?.voice
              ? line.voice
              : undefined;
          return (
            <li key={`${line.start}-${line.end}-${line.text}`}>
              {speaker && (
                <span className="nuv-media-transcript__voice">{speaker}</span>
              )}
              <button
                type="button"
                className="nuv-media-transcript__line"
                tabIndex={index === focusIndex ? 0 : -1}
                onFocus={() => setFocusIndex(index)}
                onClick={() => {
                  store?.seek(line.start);
                  store?.play();
                }}
              >
                <span className="nuv-media-transcript__time">
                  {formatTime(line.start, duration)}
                </span>
                <span className="nuv-media-transcript__text">{line.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
