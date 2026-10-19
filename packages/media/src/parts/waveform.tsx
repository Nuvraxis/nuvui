"use client";

import {
  type HTMLAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useIsomorphicLayoutEffect,
  useMediaContext,
  useMediaState,
} from "../core/context";
import { formatTime, spokenTime } from "../core/time";
import { cueAt } from "../core/vtt";
import { cx } from "../utils/cx";
import { MediaSlider } from "./slider";

export interface MediaWaveformProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * How loud it is along its length, from the start to the end, in any
   * scale: the loudest is drawn the full height. A few hundred is plenty.
   * `computePeaks` works them out from a file.
   */
  peaks: readonly number[];
}

// Each bar's width and the least room between two, in pixels.
const barWidth = 3;
const barGap = 2;

/** As many bars as fit across `width`, each the loudest of the peaks it covers, from 0 to 1. */
export function barsFor(peaks: readonly number[], width: number): number[] {
  const count = Math.floor((width + barGap) / (barWidth + barGap));
  if (count <= 0 || peaks.length === 0) return [];
  let loudest = 0;
  for (const peak of peaks) loudest = Math.max(loudest, Math.abs(peak));
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const from = Math.floor((i * peaks.length) / count);
    const to = Math.max(from + 1, Math.floor(((i + 1) * peaks.length) / count));
    let bar = 0;
    for (let j = from; j < to && j < peaks.length; j++) {
      bar = Math.max(bar, Math.abs(peaks[j] ?? 0));
    }
    bars.push(loudest > 0 ? bar / loudest : 0);
  }
  return bars;
}

/**
 * A seek bar drawn as the sound's waveform, from `peaks`. What's played is
 * in the accent color, and the time under a pointer shows over it. It's a
 * slider for the keyboard and a screen reader, as the seek bar is.
 */
export function MediaWaveform({
  peaks,
  className,
  ...props
}: MediaWaveformProps) {
  const { store, labels, skip } = useMediaContext("MediaWaveform");
  const duration = useMediaState(store, (s) => s.duration);
  const chapters = useMediaState(store, (s) => s.chapters);
  const box = useRef<HTMLSpanElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hover, setHover] = useState<number | null>(null);

  // Drawn in real pixels, so each bar is sharp at every width.
  useIsomorphicLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () =>
      setSize((before) => {
        const width = Math.round(element.clientWidth);
        const height = Math.round(element.clientHeight);
        return before.width === width && before.height === height
          ? before
          : { width, height };
      });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const bars = useMemo(() => barsFor(peaks, size.width), [peaks, size.width]);
  const { width, height } = size;
  const step = bars.length > 0 ? width / bars.length : 0;
  const shapes = bars.map((bar, index) => {
    const tall = Math.max(2, bar * height);
    return (
      <rect
        // The bars are the same for the same peaks and width.
        // biome-ignore lint/suspicious/noArrayIndexKey: a bar is its place
        key={index}
        x={index * step + (step - barWidth) / 2}
        y={(height - tall) / 2}
        width={barWidth}
        height={tall}
        rx={barWidth / 2}
      />
    );
  });

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

  const chapter = hover === null ? undefined : cueAt(chapters, hover);

  return (
    <MediaSlider
      {...props}
      className={cx("nuv-media-waveform", className)}
      label={labels.seek}
      value={() => store.currentTime}
      max={() => store.getState().duration}
      valueText={(value, max) =>
        labels.timeOf(spokenTime(value, labels), spokenTime(max, labels))
      }
      subscribe={subscribe}
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
      <span ref={box} className="nuv-media-waveform__bars">
        {width > 0 && (
          <>
            <svg
              className="nuv-media-waveform__shape"
              viewBox={`0 0 ${width} ${height}`}
              width={width}
              height={height}
              aria-hidden="true"
              focusable="false"
            >
              {shapes}
            </svg>
            <svg
              className="nuv-media-waveform__shape nuv-media-waveform__played"
              viewBox={`0 0 ${width} ${height}`}
              width={width}
              height={height}
              aria-hidden="true"
              focusable="false"
            >
              {shapes}
            </svg>
          </>
        )}
      </span>
      <div
        ref={preview}
        className="nuv-media-seek__preview"
        aria-hidden="true"
        hidden={hover === null}
      >
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
