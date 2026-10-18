/** One cue of a WebVTT file. */
export interface VttCue {
  start: number;
  end: number;
  text: string;
}

/** A frame for the preview over the seek bar. */
export interface Thumbnail {
  start: number;
  end: number;
  /** The image, resolved against the WebVTT file's address. */
  url: string;
  /** The part of the image that's this frame, when it's one of many. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// 01:02:03.456 or 02:03.456. A comma is taken for the dot, as some
// tools write one.
const timestamp = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/;

function seconds(text: string): number | null {
  const match = timestamp.exec(text.trim());
  if (!match) return null;
  const [, h = "0", m = "0", s = "0", ms = "0"] = match;
  return (
    Number(h) * 3600 +
    Number(m) * 60 +
    Number(s) +
    Number(ms.padEnd(3, "0")) / 1000
  );
}

/** The cues of a WebVTT file, in order. Blocks that aren't cues are left out. */
export function parseVtt(source: string): VttCue[] {
  const cues: VttCue[] = [];
  const blocks = source.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.length > 0);
    const at = lines.findIndex((line) => line.includes("-->"));
    if (at === -1) continue;
    const [from = "", rest = ""] = (lines[at] ?? "").split("-->");
    const start = seconds(from);
    const end = seconds(rest.trim().split(/\s+/)[0] ?? "");
    if (start === null || end === null) continue;
    cues.push({ start, end, text: lines.slice(at + 1).join("\n") });
  }
  return cues.sort((a, b) => a.start - b.start);
}

/**
 * The frames of a thumbnails track, which names an image for each span of
 * time, and where in it the frame is: `sprite.jpg#xywh=0,0,160,90`.
 */
export function parseThumbnails(source: string, base: string): Thumbnail[] {
  return parseVtt(source).flatMap((cue) => {
    const [path = "", hash = ""] = cue.text.trim().split("#");
    if (!path) return [];
    let url: string;
    try {
      url = new URL(path, base).href;
    } catch {
      return [];
    }
    const box = /^xywh=(\d+),(\d+),(\d+),(\d+)$/.exec(hash);
    return [
      box
        ? {
            start: cue.start,
            end: cue.end,
            url,
            x: Number(box[1]),
            y: Number(box[2]),
            width: Number(box[3]),
            height: Number(box[4]),
          }
        : { start: cue.start, end: cue.end, url },
    ];
  });
}

/** The cue whose span holds `time`, from cues in order. */
export function cueAt<T extends { start: number; end: number }>(
  cues: readonly T[],
  time: number,
): T | undefined {
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const cue = cues[mid] as T;
    if (time < cue.start) high = mid - 1;
    else if (time >= cue.end) low = mid + 1;
    else return cue;
  }
  return undefined;
}
