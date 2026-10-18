/** One file or stream a player can play. */
export interface MediaSourceItem {
  src: string;
  /** Its MIME type, when the address doesn't say what it is. */
  type?: string;
  /** Its name in the quality menu, such as "1080p". */
  label?: string;
  /** Its height in pixels, which orders the quality menu. */
  height?: number;
}

export type SourceKind = "file" | "hls" | "dash";

/** Whether a source is a file the browser plays, or an HLS or DASH stream. */
export function kindOf(source: MediaSourceItem): SourceKind {
  const type = source.type?.toLowerCase() ?? "";
  if (type.includes("mpegurl")) return "hls";
  if (type.includes("dash")) return "dash";
  const path = (source.src.split(/[?#]/)[0] ?? "").toLowerCase();
  if (path.endsWith(".m3u8")) return "hls";
  if (path.endsWith(".mpd")) return "dash";
  return "file";
}

/** A quality to choose in the menu. `"auto"` is the player's own choice. */
export interface MediaQuality {
  id: string;
  label: string;
  height?: number;
}

/** An audio track of a stream, such as another language. */
export interface MediaAudioTrack {
  id: string;
  label: string;
  lang?: string;
}

export type StreamError = "network" | "decode" | "unsupported";

export interface StreamEvents {
  qualities: (qualities: MediaQuality[]) => void;
  /** The quality playing now, which is what Auto is on. */
  playing: (id: string | null) => void;
  audioTracks: (tracks: MediaAudioTrack[], current: string | null) => void;
  error: (kind: StreamError) => void;
}

export interface Stream {
  setQuality: (id: string) => void;
  setAudioTrack: (id: string) => void;
  destroy: () => void;
}

// The parts of hls.js the player uses. Written out here, so the published
// types don't need hls.js installed.
interface HlsLevel {
  height?: number;
  bitrate?: number;
}
interface HlsAudioTrack {
  name?: string;
  lang?: string;
}
// Written as methods, which TypeScript compares loosely, so the libraries'
// own, more exact types fit them.
interface HlsInstance {
  levels: HlsLevel[];
  currentLevel: number;
  audioTracks: HlsAudioTrack[];
  audioTrack: number;
  loadSource(src: string): void;
  attachMedia(media: HTMLMediaElement): void;
  startLoad(startPosition?: number): void;
  recoverMediaError(): void;
  destroy(): void;
  // biome-ignore lint/suspicious/noExplicitAny: each event has its own data
  on(event: string, listener: (event: string, data: any) => void): void;
}

/** hls.js's `Hls` class, or the module it's the default export of. */
export interface HlsConstructor {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported: () => boolean;
  Events: Record<string, string>;
}

/** Loads hls.js when a stream needs it: `() => import("hls.js")`. */
export type HlsLoader = () => Promise<
  HlsConstructor | { default: HlsConstructor }
>;

// The parts of dashjs the player uses.
interface DashRepresentation {
  id: string;
  height?: number;
  bandwidth?: number;
}
interface DashTrack {
  lang: string | null;
  labels?: { text: string }[];
}
interface DashPlayer {
  initialize(
    view: HTMLMediaElement,
    source: string,
    autoPlay: boolean,
    startTime?: number,
  ): void;
  reset(): void;
  // biome-ignore lint/suspicious/noExplicitAny: each event has its own data
  on(type: string, listener: (event: any) => void): void;
  getRepresentationsByType(type: "video"): DashRepresentation[];
  getCurrentRepresentationForType(type: "video"): DashRepresentation | null;
  setRepresentationForTypeById(
    type: "video",
    id: string,
    forceReplace?: boolean,
  ): void;
  getTracksFor(type: "audio"): DashTrack[];
  getCurrentTrackFor(type: "audio"): DashTrack | null;
  setCurrentTrack(track: DashTrack): void;
  updateSettings(settings: object): void;
}

/** The dashjs module, as `import("dashjs")` gives it. */
export interface DashModule {
  MediaPlayer: () => { create: () => DashPlayer };
}

/** Loads dashjs when a stream needs it: `() => import("dashjs")`. */
export type DashLoader = () => Promise<DashModule | { default: DashModule }>;

export interface StreamOptions {
  hls?: HlsLoader;
  dash?: DashLoader;
  /** Passed to `new Hls()`. */
  hlsConfig?: Record<string, unknown>;
  /** Passed to dashjs's `updateSettings()`. */
  dashSettings?: Record<string, unknown>;
  startTime?: number;
  /** False once the player has moved on, so a late library does nothing. */
  isCurrent: () => boolean;
}

const levelLabel = (height?: number, bitrate?: number) =>
  height ? `${height}p` : bitrate ? `${Math.round(bitrate / 1000)} kbps` : "";

function playNatively(
  media: HTMLMediaElement,
  src: string,
  startTime?: number,
) {
  media.src = src;
  if (startTime) {
    media.addEventListener(
      "loadedmetadata",
      () => {
        media.currentTime = startTime;
      },
      { once: true },
    );
  }
}

/**
 * Plays an HLS or DASH stream in the media element, through the library the
 * app hands over, or by the browser itself where it can and no library was
 * given. Returns null when the browser plays it alone.
 */
export async function attachStream(
  media: HTMLMediaElement,
  source: MediaSourceItem,
  kind: "hls" | "dash",
  options: StreamOptions,
  events: StreamEvents,
): Promise<Stream | null> {
  const native =
    kind === "hls" && media.canPlayType("application/vnd.apple.mpegurl") !== "";

  if (kind === "hls") {
    const loaded = options.hls ? await options.hls().catch(() => null) : null;
    if (!options.isCurrent()) return null;
    const Hls = loaded ? ("default" in loaded ? loaded.default : loaded) : null;
    if (!Hls?.isSupported()) {
      if (native) {
        playNatively(media, source.src, options.startTime);
        return null;
      }
      warn(
        options.hls
          ? "hls.js couldn't be loaded, and this browser can't play HLS itself."
          : 'This is an HLS stream, and this browser can\'t play HLS itself. Pass hls={() => import("hls.js")} to play it.',
      );
      events.error("unsupported");
      return null;
    }
    return hlsStream(Hls, media, source, options, events);
  }

  const loaded = options.dash ? await options.dash().catch(() => null) : null;
  if (!options.isCurrent()) return null;
  const dash = loaded ? ("default" in loaded ? loaded.default : loaded) : null;
  if (!dash) {
    warn(
      options.dash
        ? "dashjs couldn't be loaded."
        : 'This is a DASH stream. Pass dash={() => import("dashjs")} to play it.',
    );
    events.error("unsupported");
    return null;
  }
  return dashStream(dash, media, source, options, events);
}

function warn(message: string) {
  if (typeof console !== "undefined") console.warn(`@nuvui/media: ${message}`);
}

function hlsStream(
  Hls: HlsConstructor,
  media: HTMLMediaElement,
  source: MediaSourceItem,
  options: StreamOptions,
  events: StreamEvents,
): Stream {
  const hls = new Hls({
    ...(options.startTime ? { startPosition: options.startTime } : {}),
    ...options.hlsConfig,
  });
  const E = Hls.Events;
  // One try at getting going again after each kind of failure, then it's
  // the viewer's to try again.
  let retriedNetwork = false;
  let retriedMedia = false;

  hls.on(E.MANIFEST_PARSED ?? "hlsManifestParsed", () => {
    // Where some levels have a height, one without is sound alone, and not
    // a quality to choose.
    const sized = hls.levels.some((level) => level.height);
    const qualities = hls.levels
      .map((level, index) => ({
        id: String(index),
        label: levelLabel(level.height, level.bitrate),
        height: level.height,
      }))
      .filter((level) => level.label !== "" && (!sized || level.height));
    events.qualities(qualities);
  });
  hls.on(E.LEVEL_SWITCHED ?? "hlsLevelSwitched", (_event, data) => {
    events.playing(String(data.level));
  });
  const tracks = () =>
    events.audioTracks(
      hls.audioTracks.map((track, index) => ({
        id: String(index),
        label: track.name || track.lang || String(index + 1),
        lang: track.lang,
      })),
      hls.audioTrack >= 0 ? String(hls.audioTrack) : null,
    );
  hls.on(E.AUDIO_TRACKS_UPDATED ?? "hlsAudioTracksUpdated", tracks);
  hls.on(E.AUDIO_TRACK_SWITCHED ?? "hlsAudioTrackSwitched", tracks);
  hls.on(E.ERROR ?? "hlsError", (_event, data) => {
    if (!data?.fatal) return;
    if (data.type === "networkError" && !retriedNetwork) {
      retriedNetwork = true;
      hls.startLoad();
    } else if (data.type === "mediaError" && !retriedMedia) {
      retriedMedia = true;
      hls.recoverMediaError();
    } else {
      events.error(data.type === "networkError" ? "network" : "decode");
    }
  });

  hls.loadSource(source.src);
  hls.attachMedia(media);

  return {
    setQuality: (id) => {
      hls.currentLevel = id === "auto" ? -1 : Number(id);
    },
    setAudioTrack: (id) => {
      hls.audioTrack = Number(id);
    },
    destroy: () => hls.destroy(),
  };
}

function dashStream(
  dash: DashModule,
  media: HTMLMediaElement,
  source: MediaSourceItem,
  options: StreamOptions,
  events: StreamEvents,
): Stream {
  const player = dash.MediaPlayer().create();
  if (options.dashSettings) player.updateSettings(options.dashSettings);

  const tracks = () => {
    const all = player.getTracksFor("audio");
    const current = player.getCurrentTrackFor("audio");
    events.audioTracks(
      all.map((track, index) => ({
        id: String(index),
        label: track.labels?.[0]?.text || track.lang || String(index + 1),
        lang: track.lang ?? undefined,
      })),
      current ? String(all.indexOf(current)) : null,
    );
  };

  player.on("streamInitialized", () => {
    events.qualities(
      player
        .getRepresentationsByType("video")
        .map((rep) => ({
          id: rep.id,
          label: levelLabel(rep.height, rep.bandwidth),
          height: rep.height,
        }))
        .filter((rep) => rep.label !== ""),
    );
    tracks();
    events.playing(player.getCurrentRepresentationForType("video")?.id ?? null);
  });
  player.on("qualityChangeRendered", (event) => {
    if (event?.mediaType === "video") {
      events.playing(event.newRepresentation?.id ?? null);
    }
  });
  player.on("trackChangeRendered", (event) => {
    if (event?.mediaType === "audio") tracks();
  });
  player.on("error", (event) => {
    const code = event?.error?.code;
    // dashjs's codes for a manifest, a segment or an address that couldn't
    // be fetched, and for a browser with no Media Source Extensions.
    if (code === 23) events.error("unsupported");
    else if ([11, 12, 15, 17, 18, 19].includes(code)) events.error("network");
    else events.error("decode");
  });
  player.on("playbackError", () => events.error("decode"));

  player.initialize(media, source.src, false, options.startTime);

  const auto = (on: boolean) =>
    player.updateSettings({
      streaming: { abr: { autoSwitchBitrate: { video: on } } },
    });

  return {
    setQuality: (id) => {
      if (id === "auto") {
        auto(true);
        return;
      }
      auto(false);
      player.setRepresentationForTypeById("video", id, true);
    },
    setAudioTrack: (id) => {
      const track = player.getTracksFor("audio")[Number(id)];
      if (track) player.setCurrentTrack(track);
    },
    destroy: () => player.reset(),
  };
}
