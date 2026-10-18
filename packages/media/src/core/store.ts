import type { MediaAudioTrack, MediaQuality, StreamError } from "./sources";
import type { Thumbnail } from "./vtt";

/** A captions or subtitles track the viewer can choose. */
export interface MediaTextTrack {
  id: string;
  label: string;
  lang: string;
}

/** A part of the media with a name, shown as a gap in the seek bar. */
export interface MediaChapter {
  start: number;
  /** Where it ends. The next chapter's start, or the end, when left out. */
  end?: number;
  title: string;
}

export type CaptionSize = "small" | "medium" | "large";

export interface MediaState {
  /** The media element is on the page and the player has taken it over. */
  attached: boolean;
  paused: boolean;
  ended: boolean;
  /** Waiting for data, with nothing to show for now. */
  waiting: boolean;
  /** It has played at least once, so the poster's big button goes. */
  started: boolean;
  duration: number;
  live: boolean;
  volume: number;
  muted: boolean;
  rate: number;
  error: StreamError | null;
  fullscreen: boolean;
  pictureInPicture: boolean;
  textTracks: MediaTextTrack[];
  /** The captions track shown, or null for none. */
  textTrack: string | null;
  captionSize: CaptionSize;
  qualities: MediaQuality[];
  /** The quality chosen, `"auto"` for the player's own choice. */
  quality: string;
  /** The quality playing now, which is what Auto is on. */
  playingQuality: string | null;
  audioTracks: MediaAudioTrack[];
  audioTrack: string | null;
  chapters: Required<MediaChapter>[];
  thumbnails: Thumbnail[];
  /** The controls are shown. They hide while it plays and nothing moves. */
  controlsVisible: boolean;
  /** The time shows what's left rather than what's played. */
  showRemaining: boolean;
  /** Something for a screen reader to hear, said once. */
  message: string;
}

export const initialState: MediaState = {
  attached: false,
  paused: true,
  ended: false,
  waiting: false,
  started: false,
  duration: 0,
  live: false,
  volume: 1,
  muted: false,
  rate: 1,
  error: null,
  fullscreen: false,
  pictureInPicture: false,
  textTracks: [],
  textTrack: null,
  captionSize: "medium",
  qualities: [],
  quality: "auto",
  playingQuality: null,
  audioTracks: [],
  audioTrack: null,
  chapters: [],
  thumbnails: [],
  controlsVisible: true,
  showRemaining: false,
  message: "",
};

type Listener = () => void;

const mediaEvents = [
  "play",
  "pause",
  "playing",
  "waiting",
  "canplay",
  "seeking",
  "seeked",
  "ended",
  "durationchange",
  "loadedmetadata",
  "volumechange",
  "ratechange",
  "error",
  "emptied",
  "progress",
  "timeupdate",
  "enterpictureinpicture",
  "leavepictureinpicture",
] as const;

/** The chapters in order, each with its end filled in. */
export function completeChapters(
  chapters: readonly MediaChapter[],
  duration: number,
): Required<MediaChapter>[] {
  const sorted = [...chapters].sort((a, b) => a.start - b.start);
  return sorted.map((chapter, index) => ({
    start: Math.max(0, chapter.start),
    end:
      chapter.end ??
      sorted[index + 1]?.start ??
      (Number.isFinite(duration) && duration > 0 ? duration : chapter.start),
    title: chapter.title,
  }));
}

/**
 * A player's state, fed by its media element. React reads it through
 * `useSyncExternalStore`. The time, which changes every frame while it
 * plays, goes to `onTick` listeners instead, which write it straight to
 * the page.
 */
export class MediaStore {
  private state: MediaState = initialState;
  private readonly listeners = new Set<Listener>();
  private readonly tickers = new Set<Listener>();
  private readonly cueListeners = new Set<(cues: TextTrackCue[]) => void>();
  private frame = 0;
  private chapterProp: MediaChapter[] | undefined;
  private chapterTrack: TextTrack | null = null;
  private chapterDuration = -1;
  private shownTrack: TextTrack | null = null;
  media: HTMLMediaElement | null = null;
  /** How the player changes quality and audio track, set by its source. */
  handlers: {
    quality?: (id: string) => void;
    audioTrack?: (id: string) => void;
  } = {};

  getState = () => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Called every frame while it plays, and whenever the time jumps. */
  onTick(listener: Listener) {
    this.tickers.add(listener);
    return () => {
      this.tickers.delete(listener);
    };
  }

  /** Called with the captions to show whenever they change. */
  onCues(listener: (cues: TextTrackCue[]) => void) {
    this.cueListeners.add(listener);
    listener(this.activeCues());
    return () => {
      this.cueListeners.delete(listener);
    };
  }

  set(change: Partial<MediaState>) {
    let changed = false;
    for (const key of Object.keys(change) as (keyof MediaState)[]) {
      if (!Object.is(this.state[key], change[key])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.state = { ...this.state, ...change };
    for (const listener of this.listeners) listener();
  }

  /** Something for a screen reader to hear. The same words twice are heard twice. */
  say(text: string) {
    this.set({
      message: this.state.message === text ? `${text} ` : text,
    });
  }

  get currentTime() {
    return this.media?.currentTime ?? 0;
  }

  /** How far the media is loaded ahead of the time, in seconds from the start. */
  get bufferedEnd() {
    const media = this.media;
    if (!media) return 0;
    const time = media.currentTime;
    const ranges = media.buffered;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= time + 0.5 && ranges.end(i) >= time) {
        return ranges.end(i);
      }
    }
    return time;
  }

  attach(media: HTMLMediaElement) {
    this.media = media;
    const sync = () => this.sync();
    for (const type of mediaEvents) media.addEventListener(type, sync);
    const tracks = media.textTracks;
    const onTracks = () => this.syncTracks();
    tracks.addEventListener("addtrack", onTracks);
    tracks.addEventListener("removetrack", onTracks);
    // A <track> says its file has loaded with a load event, which doesn't
    // bubble, and which React doesn't listen for on a track. Caught on the
    // way down instead, it's when a chapters track's cues can be read.
    const onTrackLoad = (event: Event) => {
      if (event.target instanceof HTMLTrackElement) this.refreshTracks();
    };
    media.addEventListener("load", onTrackLoad, true);
    this.sync();
    this.syncTracks();
    this.set({ attached: true });
    return () => {
      for (const type of mediaEvents) media.removeEventListener(type, sync);
      tracks.removeEventListener("addtrack", onTracks);
      tracks.removeEventListener("removetrack", onTracks);
      media.removeEventListener("load", onTrackLoad, true);
      this.showTrack(null);
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.media = null;
      this.set({ attached: false });
    };
  }

  private sync() {
    const media = this.media;
    if (!media) return;
    const duration = media.duration;
    const error = media.error;
    this.set({
      paused: media.paused,
      ended: media.ended,
      waiting:
        !media.paused &&
        media.readyState < HTMLMediaElement.HAVE_FUTURE_DATA &&
        !media.ended,
      started: this.state.started || !media.paused || media.currentTime > 0,
      duration: Number.isFinite(duration) ? duration : 0,
      live: duration === Number.POSITIVE_INFINITY,
      volume: media.volume,
      muted: media.muted,
      rate: media.playbackRate,
      // A file that isn't there comes as "source not supported" too, so
      // that's said as one that couldn't be loaded. Unsupported is kept for
      // a stream the player knows it can't play here.
      error: error
        ? error.code === MediaError.MEDIA_ERR_NETWORK ||
          error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "network"
          : "decode"
        : this.state.error,
      pictureInPicture:
        typeof document !== "undefined" &&
        document.pictureInPictureElement === media,
    });
    // A chapter without an end runs to the end, which is known only now.
    if (this.state.duration !== this.chapterDuration) {
      this.chapterDuration = this.state.duration;
      if (this.chapterProp === undefined) this.readChapterTrack();
      else this.setChapters(this.chapterProp);
    }
    this.tick();
    if (!media.paused && !this.frame) this.loop();
  }

  private loop = () => {
    this.frame = 0;
    const media = this.media;
    if (!media || media.paused) return;
    this.tick();
    this.frame = requestAnimationFrame(this.loop);
  };

  tick() {
    for (const listener of this.tickers) listener();
  }

  // Text tracks ------------------------------------------------------------

  private captionTracks(): TextTrack[] {
    const list = this.media?.textTracks;
    if (!list) return [];
    const found: TextTrack[] = [];
    for (let i = 0; i < list.length; i++) {
      const track = list[i];
      if (track && (track.kind === "captions" || track.kind === "subtitles")) {
        found.push(track);
      }
    }
    return found;
  }

  private trackId = (track: TextTrack, index: number) =>
    `${index}:${track.language}:${track.label}`;

  /** Reads the tracks again, as when a track's file has loaded. */
  refreshTracks() {
    this.syncTracks();
    this.onCueChange();
  }

  private syncTracks() {
    const tracks = this.captionTracks();
    this.set({
      textTracks: tracks.map((track, index) => ({
        id: this.trackId(track, index),
        label: track.label || track.language || String(index + 1),
        lang: track.language,
      })),
    });
    // A track another library added or took away may have been the one
    // shown. Keep showing it by its id, or show none.
    const id = this.state.textTrack;
    const kept = tracks.find(
      (track, index) => this.trackId(track, index) === id,
    );
    if (id && !kept) this.set({ textTrack: null });
    this.showTrack(kept ?? null);
    // The browser draws none of them. The player draws the one shown.
    for (const track of tracks) {
      if (track !== kept && track.mode === "showing") track.mode = "disabled";
    }
    if (this.chapterProp === undefined) this.readChapterTrack();
  }

  private readonly onCueChange = () => {
    const cues = this.activeCues();
    for (const listener of this.cueListeners) listener(cues);
  };

  private activeCues(): TextTrackCue[] {
    const active = this.shownTrack?.activeCues;
    return active ? Array.from(active) : [];
  }

  private showTrack(track: TextTrack | null) {
    if (this.shownTrack === track) {
      if (track && track.mode !== "hidden") track.mode = "hidden";
      return;
    }
    if (this.shownTrack) {
      this.shownTrack.removeEventListener("cuechange", this.onCueChange);
      this.shownTrack.mode = "disabled";
    }
    this.shownTrack = track;
    if (track) {
      // Hidden: its cues load and change, and the browser doesn't draw them.
      track.mode = "hidden";
      track.addEventListener("cuechange", this.onCueChange);
    }
    this.onCueChange();
  }

  /** Shows a captions track by its id, or none. */
  setTextTrack(id: string | null) {
    const tracks = this.captionTracks();
    const track =
      id === null
        ? null
        : (tracks.find((t, index) => this.trackId(t, index) === id) ?? null);
    this.set({ textTrack: track ? id : null });
    this.showTrack(track);
  }

  /** Every cue of the track shown, for a transcript. */
  allCues(): TextTrackCue[] {
    const cues = this.shownTrack?.cues;
    return cues ? Array.from(cues) : [];
  }

  // Chapters ----------------------------------------------------------------

  /** Chapters from the app, which replace any chapters track. */
  setChapterList(chapters: MediaChapter[] | undefined) {
    this.chapterProp = chapters;
    if (chapters) this.setChapters(chapters);
    else this.readChapterTrack();
  }

  private setChapters(chapters: readonly MediaChapter[]) {
    const next = completeChapters(chapters, this.state.duration);
    const same =
      next.length === this.state.chapters.length &&
      next.every((chapter, index) => {
        const other = this.state.chapters[index];
        return (
          other &&
          other.start === chapter.start &&
          other.end === chapter.end &&
          other.title === chapter.title
        );
      });
    if (!same) this.set({ chapters: next });
  }

  private readChapterTrack() {
    const list = this.media?.textTracks;
    if (!list) return;
    let track: TextTrack | null = null;
    for (let i = 0; i < list.length; i++) {
      if (list[i]?.kind === "chapters") {
        track = list[i] ?? null;
        break;
      }
    }
    if (track !== this.chapterTrack) {
      this.chapterTrack = track;
      // Hidden, so its cues load. They're read again when its file has
      // loaded, which the player hears from the track's element.
      if (track) track.mode = "hidden";
    }
    const cues = track?.cues;
    if (!cues || cues.length === 0) return;
    this.setChapters(
      Array.from(cues).map((cue) => ({
        start: cue.startTime,
        end: cue.endTime,
        title: (cue as VTTCue).text ?? "",
      })),
    );
  }

  // Commands ----------------------------------------------------------------

  play() {
    const media = this.media;
    if (!media) return;
    if (media.ended) media.currentTime = 0;
    media.play()?.catch(() => {
      // Refused, as an unmuted start without a press is. The button still
      // says Play, which is the truth.
    });
  }

  pause() {
    this.media?.pause();
  }

  toggle() {
    if (this.media?.paused) this.play();
    else this.pause();
  }

  seek(time: number) {
    const media = this.media;
    if (!media) return;
    const end = Number.isFinite(media.duration) ? media.duration : time;
    media.currentTime = Math.min(Math.max(0, time), end);
    this.tick();
  }

  skip(seconds: number) {
    this.seek(this.currentTime + seconds);
  }

  setVolume(volume: number) {
    const media = this.media;
    if (!media) return;
    media.volume = Math.min(1, Math.max(0, volume));
    if (volume > 0 && media.muted) media.muted = false;
  }

  setMuted(muted: boolean) {
    if (this.media) this.media.muted = muted;
  }

  setRate(rate: number) {
    if (this.media) this.media.playbackRate = rate;
  }

  setQuality(id: string) {
    this.set({ quality: id });
    this.handlers.quality?.(id);
  }

  setAudioTrack(id: string) {
    this.set({ audioTrack: id });
    this.handlers.audioTrack?.(id);
  }
}
