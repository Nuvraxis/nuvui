import { afterEach, describe, expect, test, vi } from "vitest";
import { barsFor } from "../parts/waveform";
import { englishLabels } from "./labels";
import { computePeaks } from "./peaks";
import { readSettings, writeSettings } from "./persist";
import { kindOf } from "./sources";
import { completeChapters } from "./store";
import { formatRate, formatTime, spokenTime } from "./time";
import { cueAt, parseThumbnails, parseVtt } from "./vtt";

describe("time", () => {
  test("a clock's way, with hours once there are any, or the whole is that long", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5.9)).toBe("0:05");
    expect(formatTime(252)).toBe("4:12");
    expect(formatTime(3723)).toBe("1:02:03");
    expect(formatTime(65, 4000)).toBe("0:01:05");
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-3)).toBe("0:00");
  });

  test("in words for a screen reader", () => {
    expect(spokenTime(0, englishLabels)).toBe("0 seconds");
    expect(spokenTime(1, englishLabels)).toBe("1 second");
    expect(spokenTime(65, englishLabels)).toBe("1 minute 5 seconds");
    expect(spokenTime(3600, englishLabels)).toBe("1 hour");
    expect(spokenTime(7322, englishLabels)).toBe("2 hours 2 minutes 2 seconds");
  });

  test("a speed", () => {
    expect(formatRate(1.25)).toBe("1.25×");
  });
});

describe("WebVTT", () => {
  test("cues are read in order, with their times, and other blocks are left out", () => {
    const cues = parseVtt(
      [
        "WEBVTT",
        "",
        "NOTE a note",
        "",
        "two",
        "00:00:04.000 --> 00:00:06.500 align:start",
        "Second",
        "",
        "00:01.000 --> 00:02,500",
        "First",
        "on two lines",
      ].join("\r\n"),
    );
    expect(cues).toEqual([
      { start: 1, end: 2.5, text: "First\non two lines" },
      { start: 4, end: 6.5, text: "Second" },
    ]);
  });

  test("a thumbnails track names an image and the part of it that's the frame", () => {
    const frames = parseThumbnails(
      [
        "WEBVTT",
        "",
        "00:00.000 --> 00:02.000",
        "sprite.jpg#xywh=0,0,160,90",
        "",
        "00:02.000 --> 00:04.000",
        "https://cdn.example/one.jpg",
      ].join("\n"),
      "https://example.com/videos/thumbs.vtt",
    );
    expect(frames).toEqual([
      {
        start: 0,
        end: 2,
        url: "https://example.com/videos/sprite.jpg",
        x: 0,
        y: 0,
        width: 160,
        height: 90,
      },
      { start: 2, end: 4, url: "https://cdn.example/one.jpg" },
    ]);
  });

  test("the cue at a time is found, and none between cues", () => {
    const cues = [
      { start: 0, end: 2 },
      { start: 2, end: 4 },
      { start: 6, end: 8 },
    ];
    expect(cueAt(cues, 0)).toBe(cues[0]);
    expect(cueAt(cues, 2)).toBe(cues[1]);
    expect(cueAt(cues, 7.9)).toBe(cues[2]);
    expect(cueAt(cues, 5)).toBeUndefined();
    expect(cueAt([], 1)).toBeUndefined();
  });
});

describe("sources", () => {
  test("a stream is known by its address or its type", () => {
    expect(kindOf({ src: "/a/index.m3u8" })).toBe("hls");
    expect(kindOf({ src: "/a/index.m3u8?token=1" })).toBe("hls");
    expect(kindOf({ src: "/a/manifest.mpd" })).toBe("dash");
    expect(kindOf({ src: "/play", type: "application/x-mpegURL" })).toBe("hls");
    expect(kindOf({ src: "/play", type: "application/dash+xml" })).toBe("dash");
    expect(kindOf({ src: "/a/clip.mp4" })).toBe("file");
  });
});

describe("chapters", () => {
  test("each runs to the next, and the last to the end", () => {
    expect(
      completeChapters(
        [
          { start: 10, title: "Two" },
          { start: 0, title: "One" },
          { start: 20, end: 25, title: "Three" },
        ],
        30,
      ),
    ).toEqual([
      { start: 0, end: 10, title: "One" },
      { start: 10, end: 20, title: "Two" },
      { start: 20, end: 25, title: "Three" },
    ]);
  });
});

describe("remembered settings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem("test-media");
  });

  test("are kept under the key, a change at a time", () => {
    writeSettings("test-media", { volume: 0.4 });
    writeSettings("test-media", { rate: 1.5 });
    expect(readSettings("test-media")).toEqual({ volume: 0.4, rate: 1.5 });
  });

  test("storage that refuses is as if nothing was kept", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("refused");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("refused");
    });
    expect(() => writeSettings("test-media", { volume: 1 })).not.toThrow();
    expect(readSettings("test-media")).toEqual({});
  });

  test("something that isn't settings is ignored", () => {
    localStorage.setItem("test-media", "not json");
    expect(readSettings("test-media")).toEqual({});
  });
});

// Eight seconds of a tone, four quiet and four loud, made by
// packages/media/scripts/make-media.sh.
const tone = new URL("../../test/fixtures/tone.mp3", import.meta.url).href;

describe("the waveform", () => {
  test("as many bars as fit, each the loudest of what it covers, and the loudest of all full height", () => {
    // Bars of 3px with 2px between: 23px holds five.
    expect(barsFor([1, 2, 4, 2, 1, 0, 8, 0, 4, 2], 23)).toEqual([
      0.25, 0.5, 0.125, 1, 0.5,
    ]);
    // More bars than peaks: each peak is drawn as wide as it needs.
    expect(barsFor([0, 1], 23)).toEqual([0, 0, 0, 1, 1]);
    expect(barsFor([], 100)).toEqual([]);
    expect(barsFor([1, 2], 0)).toEqual([]);
    expect(barsFor([0, 0], 23)).toEqual([0, 0, 0, 0, 0]);
  });

  test("peaks worked out from a file: quiet, then loud", async () => {
    const peaks = await computePeaks(tone, { count: 8 });
    expect(peaks).toHaveLength(8);
    expect(Math.max(...peaks)).toBe(1);
    expect(Math.max(...peaks.slice(0, 3))).toBeLessThan(0.3);
    expect(Math.min(...peaks.slice(5))).toBeGreaterThan(0.9);
  });

  test("from a Blob too, as a recording is", async () => {
    const blob = await (await fetch(tone)).blob();
    const peaks = await computePeaks(blob, { count: 4 });
    expect(peaks[0]).toBeLessThan(0.3);
    expect(peaks[3]).toBeGreaterThan(0.9);
  });

  test("a file that can't be had is an error", async () => {
    await expect(
      computePeaks(new URL("missing.mp3", tone).href),
    ).rejects.toThrow();
  });

  test("it stops when asked", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      computePeaks(tone, { signal: controller.signal }),
    ).rejects.toThrow();
  });
});
