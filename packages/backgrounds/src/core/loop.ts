/** Called once a frame, with the time the frame is for, in milliseconds. */
export type Tick = (now: number) => void;

// One animation frame loop for every background on the page, so two of
// them don't ask the browser for two frames. It runs only while something
// is listening.
const ticks = new Set<Tick>();
let frame = 0;

function run(now: number) {
  frame = 0;
  for (const tick of [...ticks]) tick(now);
  if (ticks.size > 0 && frame === 0) frame = requestAnimationFrame(run);
}

/** Calls `tick` every frame until the function it returns is called. */
export function onFrame(tick: Tick): () => void {
  ticks.add(tick);
  if (frame === 0) frame = requestAnimationFrame(run);
  return () => {
    ticks.delete(tick);
    if (ticks.size === 0 && frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** How many ticks are listening, for the tests. */
export const listening = () => ticks.size;
