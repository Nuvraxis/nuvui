// Reads a sound as 32-bit float samples on stdin, as ffmpeg writes them with
// `-f f32le`, and prints <count> peaks as JSON: the loudest moment of each
// part, from 0 to 1. make-media.sh writes them beside the demo sound, for the
// waveform, the way an app would work them out once on its server.
//
//   ffmpeg -i demo_audio.mp3 -ac 1 -ar 8000 -f f32le - | node peaks-from-pcm.mjs 400
const count = Number(process.argv[2] ?? 200);

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const bytes = Buffer.concat(chunks);
const samples = new Float32Array(
  bytes.buffer,
  bytes.byteOffset,
  Math.floor(bytes.byteLength / 4),
);

const peaks = [];
for (let i = 0; i < count; i++) {
  const start = Math.floor((i * samples.length) / count);
  const end = Math.max(
    start + 1,
    Math.floor(((i + 1) * samples.length) / count),
  );
  let peak = 0;
  for (let j = start; j < end && j < samples.length; j++) {
    peak = Math.max(peak, Math.abs(samples[j]));
  }
  peaks.push(peak);
}
const loudest = Math.max(...peaks, 0);
const scaled = peaks.map((peak) =>
  loudest > 0 ? Math.round((peak / loudest) * 1000) / 1000 : 0,
);
process.stdout.write(`${JSON.stringify(scaled)}\n`);
