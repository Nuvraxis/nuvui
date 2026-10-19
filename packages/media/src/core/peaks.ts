export interface ComputePeaksOptions {
  /** How many peaks, spread evenly along the sound. @default 200 */
  count?: number;
  /** Stops the work, as when the component that asked is gone. */
  signal?: AbortSignal;
  /** Passed to `fetch` when the source is an address, as for credentials. */
  init?: RequestInit;
}

type AudioContextClass = typeof OfflineAudioContext;

// Lets the page draw and answer between slices of the work.
const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Decoded at a low rate: a waveform needs the shape of the sound, not its
// detail, and the samples of an hour at a CD's rate would take some 600 MB.
async function decode(data: ArrayBuffer): Promise<AudioBuffer> {
  const Context: AudioContextClass | undefined =
    globalThis.OfflineAudioContext ??
    (globalThis as { webkitOfflineAudioContext?: AudioContextClass })
      .webkitOfflineAudioContext;
  if (!Context) throw new Error("This browser can't decode audio.");
  for (const rate of [8000, 44100]) {
    let context: OfflineAudioContext;
    try {
      context = new Context(1, 1, rate);
    } catch {
      // A rate this browser doesn't take. Try the next.
      continue;
    }
    // decodeAudioData takes the buffer over, so it's given a copy.
    return await context.decodeAudioData(data.slice(0));
  }
  throw new Error("This browser can't decode audio.");
}

/**
 * Works out a waveform's peaks from a sound: an address, a `Blob` such as a
 * recording, or its bytes. Each is the loudest moment of its part of the
 * sound, from 0 to 1. The browser decodes on a thread of its own, and the
 * peaks are measured in slices that leave the page free to draw. For long
 * files, work them out once on a server and keep them.
 */
export async function computePeaks(
  source: string | Blob | ArrayBuffer,
  { count = 200, signal, init }: ComputePeaksOptions = {},
): Promise<number[]> {
  let data: ArrayBuffer;
  if (typeof source === "string") {
    const response = await fetch(source, { ...init, signal });
    if (!response.ok) {
      throw new Error(`${source} couldn't be loaded: ${response.status}.`);
    }
    data = await response.arrayBuffer();
  } else if (source instanceof ArrayBuffer) {
    data = source;
  } else {
    data = await source.arrayBuffer();
  }
  signal?.throwIfAborted();
  const audio = await decode(data);
  signal?.throwIfAborted();

  const channels: Float32Array[] = [];
  for (let i = 0; i < audio.numberOfChannels; i++) {
    channels.push(audio.getChannelData(i));
  }
  const peaks = new Array<number>(Math.max(0, count)).fill(0);
  const per = audio.length / peaks.length;
  let until = performance.now() + 8;
  for (let index = 0; index < peaks.length; index++) {
    const start = Math.floor(index * per);
    const end = Math.max(start + 1, Math.floor((index + 1) * per));
    let peak = 0;
    for (const channel of channels) {
      for (let i = start; i < end && i < channel.length; i++) {
        const value = Math.abs(channel[i] ?? 0);
        if (value > peak) peak = value;
      }
    }
    peaks[index] = peak;
    if (performance.now() > until) {
      await breathe();
      signal?.throwIfAborted();
      until = performance.now() + 8;
    }
  }
  const loudest = peaks.reduce((most, peak) => Math.max(most, peak), 0);
  return loudest > 0
    ? peaks.map((peak) => Math.round((peak / loudest) * 1000) / 1000)
    : peaks;
}
